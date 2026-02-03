// reconcilePayments.js (ESM)
// Worker separado: pega orders payment_pending com +5min e consulta MP por external_reference
// Quando aprovado: marca paid e envia payload para webhook do n8n (1x por pedido).

import { pool } from "./db.js";

const MP_TOKEN =
  process.env.MP_ACCESS_TOKEN ||
  process.env.MERCADOPAGO_ACCESS_TOKEN ||
  process.env.MP_TOKEN;

if (!MP_TOKEN) {
  console.error("[reconcile] MP token ausente (MP_ACCESS_TOKEN / MERCADOPAGO_ACCESS_TOKEN / MP_TOKEN)");
  process.exit(1);
}

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "";

// ✅ Header Auth do n8n (igual ao seu Webhook node: Header Auth)
const N8N_AUTH_HEADER_NAME = process.env.N8N_AUTH_HEADER_NAME || "api-key-pagamento-aprovado";
const N8N_AUTH_HEADER_VALUE =
  process.env.N8N_AUTH_HEADER_VALUE ||
  process.env.N8N_WEBHOOK_TOKEN || // fallback p/ compatibilidade
  "";

// Configs
const MIN_AGE_MINUTES = Number(process.env.RECONCILE_MIN_AGE_MINUTES || 5);
const LOOP_LIMIT = Number(process.env.RECONCILE_LIMIT || 50);
const INTERVAL_MS = Number(process.env.RECONCILE_INTERVAL_MS || 60_000);

function mustHaveN8nConfigured() {
  return false;
}

async function mpSearchByExternalReference(externalReference) {
  const url =
    "https://api.mercadopago.com/v1/payments/search?external_reference=" +
    encodeURIComponent(externalReference);

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${MP_TOKEN}` },
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`[mp] search failed ${r.status} ${txt}`);
  }

  const data = await r.json();
  return Array.isArray(data?.results) ? data.results : [];
}

function pickBestPayment(payments) {
  if (!payments.length) return null;

  const approved = payments.find((p) => p?.status === "approved");
  if (approved) return approved;

  const sorted = payments
    .slice()
    .sort(
      (a, b) =>
        new Date(b?.date_created || 0).getTime() - new Date(a?.date_created || 0).getTime()
    );

  return sorted[0] || null;
}

async function sendToN8n(payload) {
  if (!N8N_WEBHOOK_URL) {
    if (mustHaveN8nConfigured()) throw new Error("N8N_WEBHOOK_URL não configurado no .env");
    console.log("[reconcile] N8N_WEBHOOK_URL vazio; pulando envio ao n8n.");
    return { skipped: true };
  }

  const headers = { "Content-Type": "application/json" };

  // ✅ Usa Header Auth do n8n
  if (N8N_AUTH_HEADER_VALUE) {
    headers[N8N_AUTH_HEADER_NAME] = N8N_AUTH_HEADER_VALUE;
  } else {
    console.warn("[reconcile] ATENÇÃO: N8N_AUTH_HEADER_VALUE vazio; n8n pode recusar.");
  }

  const r = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const txt = await r.text().catch(() => "");
  if (!r.ok) throw new Error(`[n8n] webhook failed ${r.status} ${txt}`);

  return { ok: true, status: r.status, body: txt };
}

async function reconcileOnce() {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      email,
      nome,
      data_nascimento,
      hora_nascimento,
      cidade_nascimento,
      product_id,
      external_reference,
      n8n_sent_at
    FROM public.orders
    WHERE status = 'payment_pending'
      AND external_reference IS NOT NULL
      AND external_reference <> ''
      AND created_at < now() - ($1::int * interval '1 minute')
    ORDER BY created_at ASC
    LIMIT $2
    `,
    [MIN_AGE_MINUTES, LOOP_LIMIT]
  );

  if (!rows.length) {
    console.log("[reconcile] nada para checar");
    return;
  }

  console.log(`[reconcile] checando ${rows.length} orders...`);

  for (const o of rows) {
    try {
      const payments = await mpSearchByExternalReference(o.external_reference);
      const best = pickBestPayment(payments);

      if (!best) {
        await pool.query(
          `
          UPDATE public.orders
          SET mp_payment_status = $1, updated_at = now()
          WHERE id = $2
          `,
          ["not_found", o.id]
        );
        continue;
      }

      const mpId = best?.id ? String(best.id) : null;
      const mpStatus = best?.status || null;

      if (mpStatus === "approved") {
        await pool.query(
          `
          UPDATE public.orders
          SET status = 'paid',
              mp_payment_id = $1,
              mp_payment_status = $2,
              datapagamento = COALESCE(datapagamento, now()),
              updated_at = now()
          WHERE id = $3
            AND status = 'payment_pending'
          `,
          [mpId, mpStatus, o.id]
        );

        console.log(`[reconcile] order ${o.id} APROVADO (mp=${mpId})`);

        if (!o.n8n_sent_at) {
          const payload = {
            produtoId: o.product_id,
            id: o.id,
            email: o.email,
            nome: o.nome,
            data_nascimento: o.data_nascimento,
            hora_nascimento: o.hora_nascimento,
            cidade_nascimento: o.cidade_nascimento,
          };

          try {
            const res = await sendToN8n(payload);

            await pool.query(
              `
              UPDATE public.orders
              SET n8n_sent_at = now(),
                  n8n_status = 'sent',
                  n8n_last_error = NULL,
                  updated_at = now()
              WHERE id = $1
              `,
              [o.id]
            );

            console.log(`[reconcile] order ${o.id} enviado ao n8n (${res.status})`);
          } catch (err) {
            const msg = String(err?.message || err);

            await pool.query(
              `
              UPDATE public.orders
              SET n8n_status = 'error',
                  n8n_last_error = $1,
                  updated_at = now()
              WHERE id = $2
              `,
              [msg, o.id]
            );

            console.error(`[reconcile] n8n erro order ${o.id}:`, msg);
          }
        }

        continue;
      }

      if (["rejected", "cancelled"].includes(mpStatus)) {
        await pool.query(
          `
          UPDATE public.orders
          SET status = 'payment_failed',
              mp_payment_id = COALESCE(mp_payment_id, $1),
              mp_payment_status = $2,
              updated_at = now()
          WHERE id = $3
            AND status = 'payment_pending'
          `,
          [mpId, mpStatus, o.id]
        );

        console.log(`[reconcile] order ${o.id} FALHOU (status=${mpStatus})`);
        continue;
      }

      await pool.query(
        `
        UPDATE public.orders
        SET mp_payment_id = COALESCE(mp_payment_id, $1),
            mp_payment_status = $2,
            updated_at = now()
        WHERE id = $3
          AND status = 'payment_pending'
        `,
        [mpId, mpStatus, o.id]
      );

      console.log(`[reconcile] order ${o.id} ainda ${mpStatus} (mp=${mpId})`);
    } catch (e) {
      console.error(`[reconcile] erro order ${o.id}:`, e?.message || e);
      await pool.query(
        `
        UPDATE public.orders
        SET n8n_last_error = $1, updated_at = now()
        WHERE id = $2
        `,
        [String(e?.message || e), o.id]
      );
    }
  }
}

async function main() {
  console.log("[reconcile] iniciado");
  await reconcileOnce();
  setInterval(() => reconcileOnce().catch((e) => console.error(e)), INTERVAL_MS);
}

main().catch((e) => {
  console.error("[reconcile] fatal:", e);
  process.exit(1);
});
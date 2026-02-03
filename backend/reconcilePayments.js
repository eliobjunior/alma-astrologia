// backend/reconcilePayments.js (ESM)
// Worker: busca orders payment_pending e consulta MP por external_reference
// Quando aprovado: marca paid e envia payload ao n8n (1x por pedido).

import { pool } from "./db.js";

/**
 * Resolve token do MP com tolerância a nomes diferentes no .env
 */
function resolveMpToken() {
  return (
    process.env.MP_ACCESS_TOKEN ||
    process.env.MERCADOPAGO_ACCESS_TOKEN ||
    process.env.MERCADO_PAGO_ACCESS_TOKEN || // <- seu .env usa este
    process.env.MP_TOKEN ||
    ""
  );
}

const MP_TOKEN = resolveMpToken();

if (!MP_TOKEN) {
  console.error(
    "[reconcile] MP token ausente (MP_ACCESS_TOKEN / MERCADOPAGO_ACCESS_TOKEN / MERCADO_PAGO_ACCESS_TOKEN)"
  );
  process.exit(1);
}

// N8N
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "";

// Header Auth do n8n (o seu é api-key-pagamento-aprovado)
const N8N_WEBHOOK_TOKEN = process.env.N8N_WEBHOOK_TOKEN || "";
const N8N_HEADER_NAME = process.env.N8N_HEADER_NAME || "api-key-pagamento-aprovado";

// Configs
const MIN_AGE_MINUTES = Number(process.env.RECONCILE_MIN_AGE_MINUTES || 5);
const LOOP_LIMIT = Number(process.env.RECONCILE_LIMIT || 50);
const INTERVAL_MS = Number(process.env.RECONCILE_INTERVAL_MS || 60_000);

/**
 * Consulta pagamentos no MP por external_reference (ex: order:8)
 */
async function mpSearchByExternalReference(externalReference) {
  const url =
    "https://api.mercadopago.com/v1/payments/search?external_reference=" +
    encodeURIComponent(externalReference);

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${MP_TOKEN}` },
  });

  const txt = await r.text().catch(() => "");
  if (!r.ok) {
    throw new Error(`[mp] search failed ${r.status} ${txt}`);
  }

  const data = txt ? JSON.parse(txt) : {};
  return Array.isArray(data?.results) ? data.results : [];
}

/**
 * Pega o "melhor" pagamento encontrado: aprovado primeiro; senão o mais recente.
 */
function pickBestPayment(payments) {
  if (!payments.length) return null;

  const approved = payments.find((p) => p?.status === "approved");
  if (approved) return approved;

  return payments
    .slice()
    .sort(
      (a, b) =>
        new Date(b?.date_created || 0).getTime() -
        new Date(a?.date_created || 0).getTime()
    )[0];
}

/**
 * Envia payload ao n8n com Header Auth
 */
async function sendToN8n(payload) {
  if (!N8N_WEBHOOK_URL) {
    console.log("[reconcile] N8N_WEBHOOK_URL vazio; pulando envio ao n8n.");
    return { skipped: true };
  }

  const headers = {
    "Content-Type": "application/json",
  };

  // Header Auth do Webhook node do n8n:
  // o n8n vai comparar NOME e VALOR.
  // Ex.: Name = api-key-pagamento-aprovado, Value = <token>
  if (N8N_WEBHOOK_TOKEN) {
    headers[N8N_HEADER_NAME] = N8N_WEBHOOK_TOKEN;
  }

  const r = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const txt = await r.text().catch(() => "");
  if (!r.ok) {
    throw new Error(`[n8n] webhook failed ${r.status} ${txt}`);
  }

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
            // 🔥 O n8n espera produtoId no seu fluxo
            produtoId: o.product_id,

            // extras úteis
            orderId: o.id,
            external_reference: o.external_reference,
            mp_payment_id: mpId,

            // dados do cliente
            email: o.email,
            nome: o.nome,
            data_nascimento: o.data_nascimento,
            hora_nascimento: o.hora_nascimento,
            cidade_nascimento: o.cidade_nascimento,
          };

          try {
            await sendToN8n(payload);

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

            console.log(`[reconcile] order ${o.id} enviado ao n8n`);
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
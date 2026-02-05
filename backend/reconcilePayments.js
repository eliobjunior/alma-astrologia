// reconcilePayments.js (ESM)
// Worker separado: pega orders payment_pending com +5min e consulta MP por external_reference
// Quando aprovado: marca paid e envia payload para webhook do n8n (1x por pedido).

import { pool } from "./db.js";

const MP_TOKEN =
  process.env.MP_ACCESS_TOKEN ||
  process.env.MERCADOPAGO_ACCESS_TOKEN ||
  process.env.MP_TOKEN;

if (!MP_TOKEN) {
  console.error(
    "[reconcile][fatal] MP token ausente (MP_ACCESS_TOKEN / MERCADOPAGO_ACCESS_TOKEN / MP_TOKEN)"
  );
  process.exit(1);
}

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "";

// 🔐 Credenciais do n8n
// Observação: você nos passou que o teste que funcionou foi com Basic Auth:
// Username: api-key-pagamento-aprovado
// Pass: <token>
// Para NÃO mudar o .env, vamos aproveitar:
// - N8N_AUTH_HEADER_NAME como USER
// - N8N_AUTH_HEADER_VALUE como PASS
const N8N_AUTH_USER =
  process.env.N8N_AUTH_USER ||
  process.env.N8N_AUTH_HEADER_NAME ||
  "api-key-pagamento-aprovado";

const N8N_AUTH_PASS =
  process.env.N8N_AUTH_PASS ||
  process.env.N8N_AUTH_HEADER_VALUE ||
  process.env.N8N_WEBHOOK_TOKEN || // fallback p/ compatibilidade
  "";

// ✅ Header Auth “legado” (caso seu webhook esteja configurado em Header Auth)
const N8N_HEADER_AUTH_NAME =
  process.env.N8N_AUTH_HEADER_NAME || "api-key-pagamento-aprovado";

const N8N_HEADER_AUTH_VALUE =
  process.env.N8N_AUTH_HEADER_VALUE || process.env.N8N_WEBHOOK_TOKEN || "";

// Configs
const MIN_AGE_MINUTES = Number(process.env.RECONCILE_MIN_AGE_MINUTES || 5);
const LOOP_LIMIT = Number(process.env.RECONCILE_LIMIT || 50);
const INTERVAL_MS = Number(process.env.RECONCILE_INTERVAL_MS || 60_000);

// Se quiser travar hard quando n8n não está configurado, mude para true.
function mustHaveN8nConfigured() {
  return false;
}

function makeBasicAuthHeader(user, pass) {
  if (!user || !pass) return "";
  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  return `Basic ${token}`;
}

async function mpSearchByExternalReference(externalReference) {
  const url =
    "https://api.mercadopago.com/v1/payments/search?external_reference=" +
    encodeURIComponent(externalReference);

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${MP_TOKEN}` },
  });

  const txt = await r.text().catch(() => "");
  if (!r.ok) {
    throw new Error(
      `[mp] search failed status=${r.status} response=${txt.slice(0, 400)}`
    );
  }

  let data;
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {
    data = {};
  }

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
        new Date(b?.date_created || 0).getTime() -
        new Date(a?.date_created || 0).getTime()
    );

  return sorted[0] || null;
}

async function sendToN8n(payload, orderId) {
  if (!N8N_WEBHOOK_URL) {
    if (mustHaveN8nConfigured())
      throw new Error("N8N_WEBHOOK_URL não configurado no .env");
    console.log(
      `[reconcile][n8n][skip] order=${orderId} reason=N8N_WEBHOOK_URL_empty`
    );
    return { skipped: true, status: 0, body: "" };
  }

  const headers = {
    "Content-Type": "application/json",
  };

  // ✅ 1) Basic Auth (o que você testou e funcionou)
  const basic = makeBasicAuthHeader(N8N_AUTH_USER, N8N_AUTH_PASS);
  if (basic) headers["Authorization"] = basic;

  // ✅ 2) Compatibilidade: também envia Header Auth, caso seu webhook esteja assim
  if (N8N_HEADER_AUTH_VALUE) {
    headers[N8N_HEADER_AUTH_NAME] = N8N_HEADER_AUTH_VALUE;
  }

  // Log do request (sem vazar segredo)
  console.log(
    `[reconcile][n8n][POST] order=${orderId} url=${N8N_WEBHOOK_URL} auth=basic(${Boolean(
      basic
    )}) headerAuth(${Boolean(N8N_HEADER_AUTH_VALUE)})`
  );

  const r = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const txt = await r.text().catch(() => "");

  console.log(
    `[reconcile][n8n][response] order=${orderId} status=${r.status} response=${txt.slice(
      0,
      300
    )}`
  );

  if (!r.ok) {
    throw new Error(
      `[n8n] webhook failed status=${r.status} response=${txt.slice(0, 600)}`
    );
  }

  return { ok: true, status: r.status, body: txt };
}

function normalizeMpStatus(status) {
  return status ? String(status).toLowerCase() : null;
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
            AND status = 'payment_pending'
          `,
          ["not_found", o.id]
        );
        console.log(`[reconcile][mp] order=${o.id} status=not_found`);
        continue;
      }

      const mpId = best?.id ? String(best.id) : null;
      const mpStatusRaw = best?.status || null;
      const mpStatus = normalizeMpStatus(mpStatusRaw);

      // ✅ UPDATE ÚNICO: grava mp_* sempre, e faz transição de status quando for terminal.
      // - approved => status 'paid' + pagamento_em
      // - rejected/cancelled => status 'payment_failed'
      // - demais => mantém payment_pending
      const upd = await pool.query(
        `
        UPDATE public.orders
        SET
          mp_payment_id = COALESCE(mp_payment_id, $1),
          mp_payment_status = $2,
          status = CASE
            WHEN $2 = 'approved' THEN 'paid'
            WHEN $2 IN ('rejected', 'cancelled') THEN 'payment_failed'
            ELSE status
          END,
          pagamento_em = CASE
            WHEN $2 = 'approved' THEN COALESCE(pagamento_em, now())
            ELSE pagamento_em
          END,
          updated_at = now()
        WHERE id = $3
          AND status = 'payment_pending'
        RETURNING
          id,
          status,
          n8n_sent_at,
          email,
          nome,
          data_nascimento,
          hora_nascimento,
          cidade_nascimento,
          product_id
        `,
        [mpId, mpStatus, o.id]
      );

      // Se não atualizou nada, alguém já moveu o status (ou não era mais pending).
      if (!upd.rowCount) {
        console.log(
          `[reconcile][skip] order=${o.id} reason=not_pending_anymore mpStatus=${mpStatus} mp=${mpId}`
        );
        continue;
      }

      const cur = upd.rows[0];

      if (cur.status === "paid") {
        console.log(`[reconcile] order ${cur.id} APROVADO (mp=${mpId})`);

        // envia 1x por pedido (agora usando o estado REAL pós-update)
        if (!cur.n8n_sent_at) {
          const payload = {
            produtoId: cur.product_id,
            id: cur.id,
            email: cur.email,
            nome: cur.nome,
            data_nascimento: cur.data_nascimento,
            hora_nascimento: cur.hora_nascimento,
            cidade_nascimento: cur.cidade_nascimento,
          };

          try {
            const res = await sendToN8n(payload, cur.id);

            await pool.query(
              `
              UPDATE public.orders
              SET n8n_sent_at = now(),
                  n8n_status = 'sent',
                  n8n_last_error = NULL,
                  updated_at = now()
              WHERE id = $1
              `,
              [cur.id]
            );

            console.log(
              `[reconcile] order ${cur.id} enviado ao n8n (status=${res.status})`
            );
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
              [msg, cur.id]
            );

            console.error(
              `[reconcile][n8n][error] order=${cur.id} error=${msg}`
            );
          }
        }

        continue;
      }

      if (cur.status === "payment_failed") {
        console.log(
          `[reconcile] order ${cur.id} FALHOU (status=${mpStatus}, mp=${mpId})`
        );
        continue;
      }

      console.log(`[reconcile][mp] order=${cur.id} status=${mpStatus} mp=${mpId}`);
    } catch (e) {
      const msg = String(e?.message || e);
      console.error(`[reconcile][error] order=${o.id} error=${msg}`);
      await pool.query(
        `
        UPDATE public.orders
        SET n8n_last_error = $1, updated_at = now()
        WHERE id = $2
        `,
        [msg, o.id]
      );
    }
  }
}

async function main() {
  console.log("[reconcile] iniciado");
  await reconcileOnce();
  setInterval(
    () =>
      reconcileOnce().catch((e) =>
        console.error("[reconcile][loop_error]", e)
      ),
    INTERVAL_MS
  );
}

main().catch((e) => {
  console.error("[reconcile][fatal]:", e);
  process.exit(1);
});
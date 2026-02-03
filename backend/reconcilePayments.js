// reconcilePayments.js (ESM)
// Worker: envia ao n8n todos os pedidos "paid" que ainda não foram enviados (n8n_sent_at IS NULL).
// Ele NÃO altera status para paid (isso deve vir do seu fluxo de pagamento/backoffice).
// Opcional: se você quiser "resgatar" pedidos payment_pending antigos, veja o bloco comentado mais abaixo.

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
const N8N_WEBHOOK_TOKEN = process.env.N8N_WEBHOOK_TOKEN || ""; // valor do Header Auth do n8n

// Configs
const LOOP_LIMIT = Number(process.env.RECONCILE_LIMIT || 50);
const INTERVAL_MS = Number(process.env.RECONCILE_INTERVAL_MS || 60_000);
const N8N_TIMEOUT_MS = Number(process.env.N8N_TIMEOUT_MS || 10_000);

// Se quiser tornar obrigatório ter N8N_WEBHOOK_URL, deixe true.
function mustHaveN8nConfigured() {
  return true;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Mercado Pago helpers (mantidos para debug / eventual fallback) ---
async function mpSearchByExternalReference(externalReference) {
  const url =
    "https://api.mercadopago.com/v1/payments/search?external_reference=" +
    encodeURIComponent(externalReference);

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15_000);

  try {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
      signal: ctrl.signal,
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      throw new Error(`[mp] search failed ${r.status} ${txt}`);
    }

    const data = await r.json();
    return Array.isArray(data?.results) ? data.results : [];
  } finally {
    clearTimeout(t);
  }
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

// --- Envio para n8n ---
async function sendToN8n(payload) {
  if (!N8N_WEBHOOK_URL) {
    if (mustHaveN8nConfigured()) {
      throw new Error("N8N_WEBHOOK_URL não configurado no .env");
    }
    console.log("[reconcile] N8N_WEBHOOK_URL vazio; pulando envio ao n8n.");
    return { skipped: true };
  }

  const headers = { "Content-Type": "application/json" };

  // ✅ n8n Webhook está com "Header Auth"
  // Pela sua configuração, o header esperado é: api-key-pagamento-aprovado: <token>
  // (você usou isso no curl e funcionou no teste)
  if (!N8N_WEBHOOK_TOKEN) {
    throw new Error("N8N_WEBHOOK_TOKEN não configurado no .env (Header Auth do n8n)");
  }
  headers["api-key-pagamento-aprovado"] = N8N_WEBHOOK_TOKEN;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), N8N_TIMEOUT_MS);

  try {
    const r = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });

    const txt = await r.text().catch(() => "");
    if (!r.ok) {
      throw new Error(`[n8n] webhook failed ${r.status} ${txt}`);
    }

    return { ok: true, status: r.status, body: txt };
  } finally {
    clearTimeout(t);
  }
}

async function reconcileOnce() {
  // ✅ OPÇÃO A: pega pedidos PAID ainda não enviados ao n8n
  const { rows } = await pool.query(
    `
    SELECT
      id,
      status,
      email,
      nome,
      data_nascimento,
      hora_nascimento,
      cidade_nascimento,
      product_id,
      external_reference,
      mp_payment_status,
      mp_payment_id,
      n8n_sent_at
    FROM public.orders
    WHERE status = 'paid'
      AND n8n_sent_at IS NULL
    ORDER BY created_at ASC
    LIMIT $1
    `,
    [LOOP_LIMIT]
  );

  if (!rows.length) {
    console.log("[reconcile] nada para enviar (paid sem n8n_sent_at)");
    return;
  }

  console.log(`[reconcile] enviando ${rows.length} orders (paid -> n8n)...`);

  for (const o of rows) {
    try {
      // Payload que o n8n espera
      const payload = {
        produtoId: o.product_id,
        id: o.id,
        email: o.email,
        nome: o.nome,
        data_nascimento: o.data_nascimento,
        hora_nascimento: o.hora_nascimento,
        cidade_nascimento: o.cidade_nascimento,

        // Extras úteis (não quebram nada no n8n; se quiser ignorar, ignore)
        status: o.status,
        external_reference: o.external_reference,
        mp_payment_status: o.mp_payment_status,
        mp_payment_id: o.mp_payment_id,
      };

      // Envia para n8n
      await sendToN8n(payload);

      // Marca como enviado
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

      console.log(`[reconcile] order ${o.id} enviado ao n8n ✅`);
      // Pequena pausa para evitar burst em listas grandes
      await sleep(200);
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
}

/**
 * (Opcional) Se você quiser também "resgatar" payment_pending antigos,
 * você pode criar outra rotina que:
 *  - busca payment_pending com external_reference
 *  - consulta MP por external_reference
 *  - se approved: marca paid + envia ao n8n
 *
 * Mas como você escolheu OPÇÃO A, mantivemos o worker estritamente como:
 * "paid sem n8n_sent_at" -> envia ao n8n.
 */

async function main() {
  console.log("[reconcile] iniciado (modo A: paid -> n8n)");
  await reconcileOnce();
  setInterval(() => reconcileOnce().catch((e) => console.error(e)), INTERVAL_MS);
}

main().catch((e) => {
  console.error("[reconcile] fatal:", e);
  process.exit(1);
});
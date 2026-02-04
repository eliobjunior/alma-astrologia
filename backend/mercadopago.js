// backend/mercadopago.js (ESM)
import mercadopago from "mercadopago";

/**
 * MP token
 * (mantém compatibilidade com seus nomes)
 */
const ACCESS_TOKEN =
  process.env.MP_ACCESS_TOKEN ||
  process.env.MERCADOPAGO_ACCESS_TOKEN ||
  process.env.MP_TOKEN;

export function getMpToken() {
  return ACCESS_TOKEN || "";
}

if (!ACCESS_TOKEN) {
  console.warn(
    "[mercadopago] ATENÇÃO: MP_ACCESS_TOKEN não definido no .env (pagamentos vão falhar)"
  );
} else {
  mercadopago.configure({ access_token: ACCESS_TOKEN });
}

/**
 * Normaliza produto vindo do frontend/products.js
 * Espera: { title|nome|name, preco_cents|price_cents|price|preco }
 */
function normalizeProduct(produto) {
  const title = produto?.title || produto?.nome || produto?.name || "Produto";

  const cents =
    Number(produto?.preco_cents ?? produto?.price_cents ?? null) ||
    Math.round(Number(produto?.price ?? produto?.preco ?? 0) * 100);

  const unit_price = Number((cents / 100).toFixed(2));

  if (!Number.isFinite(unit_price) || unit_price <= 0) {
    throw new Error("[mercadopago] Preço inválido do produto");
  }

  return { title, unit_price };
}

/**
 * Cria Preference no Mercado Pago e retorna init_point.
 *
 * IMPORTANTE: external_reference precisa bater com o banco.
 * Aqui usamos: external_reference = `order:${orderId}`
 */
export async function createPreference({
  orderId,
  produto, // objeto do produto (title/preço)
  payerEmail,
  backUrls = {},
}) {
  if (!ACCESS_TOKEN) {
    throw new Error("[mercadopago] MP access token ausente");
  }
  if (!orderId) {
    throw new Error("[mercadopago] orderId é obrigatório");
  }

  const { title, unit_price } = normalizeProduct(produto);

  // ✅ CHAVE DO SEU FLUXO: tem que ser igual ao que o reconcile busca
  const external_reference = `order:${orderId}`;

  const preference = {
    items: [
      {
        title,
        quantity: 1,
        currency_id: "BRL",
        unit_price,
      },
    ],

    // ✅ ESSENCIAL
    external_reference,

    // payer ajuda no MP, mas reconcile é pelo external_reference
    payer: payerEmail ? { email: payerEmail } : undefined,

    // opcional: retorno após pagamento
    back_urls: {
      success: backUrls?.success || undefined,
      failure: backUrls?.failure || undefined,
      pending: backUrls?.pending || undefined,
    },
    auto_return: "approved",
  };

  const res = await mercadopago.preferences.create(preference);

  const init_point = res?.body?.init_point;
  const sandbox_init_point = res?.body?.sandbox_init_point;
  const preferenceId = res?.body?.id;

  if (!init_point && !sandbox_init_point) {
    throw new Error("[mercadopago] Não recebi init_point do Mercado Pago");
  }

  return {
    init_point: init_point || sandbox_init_point,
    id: preferenceId, // ✅ para bater com seu index.js (pagamento?.id)
    preferenceId,
    external_reference,
  };
}

/**
 * ✅ Compatibilidade com seu backend/index.js atual:
 * index.js faz: import { criarPagamento, getMpToken } from "./mercadopago.js";
 * então criamos um wrapper que chama createPreference.
 */
export async function criarPagamento({ produto, orderId, customer }) {
  const payerEmail = customer?.email || undefined;

  // Se quiser usar back_urls via env, dá pra passar aqui (opcional)
  const backUrls = {
    success: process.env.MP_BACK_URL_SUCCESS || undefined,
    failure: process.env.MP_BACK_URL_FAILURE || undefined,
    pending: process.env.MP_BACK_URL_PENDING || undefined,
  };

  return await createPreference({
    orderId,
    produto,
    payerEmail,
    backUrls,
  });
}
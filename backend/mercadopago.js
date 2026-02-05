// backend/mercadopago.js (ESM) — compatível com mercadopago@^2.x
import { MercadoPagoConfig, Preference } from "mercadopago";

/**
 * MP token (compatibilidade com seus nomes)
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
}

/**
 * Cria client do Mercado Pago (SDK v2)
 */
function getMpClient() {
  if (!ACCESS_TOKEN) throw new Error("[mercadopago] MP access token ausente");
  return new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
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

function trimSlash(s) {
  return String(s || "").trim().replace(/\/+$/, "");
}

/**
 * Monta back_urls somente quando success existe (regra nova do MP).
 */
function buildBackUrlsFromEnv() {
  const success = process.env.MP_BACK_URL_SUCCESS?.trim();
  const failure = process.env.MP_BACK_URL_FAILURE?.trim();
  const pending = process.env.MP_BACK_URL_PENDING?.trim();

  if (success) {
    return {
      success,
      failure: failure || success,
      pending: pending || success,
    };
  }
  return null;
}

/**
 * Cria Preference no Mercado Pago e retorna init_point.
 * external_reference = `order:${orderId}`
 */
export async function createPreference({
  orderId,
  produto,
  payerEmail,
  backUrls = null, // pode passar manualmente
}) {
  if (!orderId) throw new Error("[mercadopago] orderId é obrigatório");

  const { title, unit_price } = normalizeProduct(produto);

  const external_reference = `order:${orderId}`;
  const client = getMpClient();
  const preference = new Preference(client);

  const resolvedBackUrls = backUrls?.success
    ? {
        success: backUrls.success,
        failure: backUrls.failure || backUrls.success,
        pending: backUrls.pending || backUrls.success,
      }
    : buildBackUrlsFromEnv();

  const body = {
    items: [
      {
        title,
        quantity: 1,
        currency_id: "BRL",
        unit_price,
      },
    ],

    external_reference,
    payer: payerEmail ? { email: payerEmail } : undefined,

    // ✅ Só manda back_urls + auto_return se tiver success válido
    ...(resolvedBackUrls
      ? {
          back_urls: resolvedBackUrls,
          auto_return: "approved",
        }
      : {
          // sem success => não envia auto_return para não quebrar na API do MP
          // o pagamento continua funcionando; só não tem auto redirect garantido
        }),

    // notification_url: process.env.MP_NOTIFICATION_URL || undefined,

    metadata: {
      orderId,
      produtoId: produto?.id || produto?.produtoId || produto?.slug || undefined,
      payerEmail: payerEmail || undefined,
    },
  };

  const res = await preference.create({ body });

  const init_point = res?.init_point;
  const sandbox_init_point = res?.sandbox_init_point;
  const preferenceId = res?.id;

  if (!init_point && !sandbox_init_point) {
    throw new Error("[mercadopago] Não recebi init_point do Mercado Pago");
  }

  return {
    init_point: init_point || sandbox_init_point,
    id: preferenceId,
    preferenceId,
    external_reference,
  };
}

/**
 * Wrapper esperado pelo seu backend/index.js
 */
export async function criarPagamento({ produto, orderId, customer }) {
  const payerEmail = customer?.email || undefined;

  // opcional: se você quiser montar via FRONTEND_URI automaticamente
  // mas o recomendado é setar MP_BACK_URL_SUCCESS no .env
  return await createPreference({
    orderId,
    produto,
    payerEmail,
    backUrls: null,
  });
}

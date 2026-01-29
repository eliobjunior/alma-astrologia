// backend/mercadopago.js
import "dotenv/config";
import mercadopago from "mercadopago";

/**
 * Lê token aceitando nomes antigos e novos.
 * NÃO logue o token.
 */
const ACCESS_TOKEN =
  process.env.MP_ACCESS_TOKEN ||
  process.env.MERCADOPAGO_ACCESS_TOKEN ||
  process.env.MERCADO_PAGO_ACCESS_TOKEN ||
  process.env.MP_TOKEN;

if (!ACCESS_TOKEN) {
  console.warn("[mercadopago] ATENÇÃO: token não definido (pagamentos vão falhar).");
} else {
  mercadopago.configure({ access_token: ACCESS_TOKEN });
}

function resolveNotificationUrl() {
  // prioridade: explícito
  const explicit =
    process.env.MP_WEBHOOK_URL ||
    process.env.MERCADO_PAGO_WEBHOOK_URL ||
    process.env.MERCADOPAGO_WEBHOOK_URL;

  if (explicit) return explicit;

  // fallback: monta a partir do base público
  const base = process.env.PUBLIC_BASE_URL;
  if (base) return `${base.replace(/\/+$/, "")}/webhook/mercadopago`;

  return null;
}

function resolveBackUrls() {
  const frontend =
    process.env.FRONTEND_URL ||
    process.env.FRONTEND_BASE_URL ||
    "https://almaliraramos.com.br";

  return {
    success: process.env.FRONTEND_SUCCESS_URL || `${frontend.replace(/\/+$/, "")}/sucesso`,
    failure: process.env.FRONTEND_FAILURE_URL || `${frontend.replace(/\/+$/, "")}/erro`,
    pending: process.env.FRONTEND_PENDING_URL || `${frontend.replace(/\/+$/, "")}/pendente`,
  };
}

/**
 * Cria uma Preference e devolve init_point.
 * - produto: { title|nome|name, preco_cents|price|preco }
 * - orderId: id do pedido no seu banco
 * - customer: { name, email }
 */
export async function criarPagamento({ produto, orderId, customer }) {
  if (!ACCESS_TOKEN) throw new Error("Token Mercado Pago ausente (MP_ACCESS_TOKEN / MERCADO_PAGO_ACCESS_TOKEN)");
  if (!produto) throw new Error("Produto é obrigatório");
  if (!orderId) throw new Error("orderId é obrigatório");
  if (!customer?.email) throw new Error("customer.email é obrigatório");

  const title = produto.title || produto.nome || produto.name || "Produto";

  let unitPrice = null;
  if (typeof produto.preco_cents === "number") unitPrice = produto.preco_cents / 100;
  else if (typeof produto.price === "number") unitPrice = produto.price;
  else if (typeof produto.preco === "number") unitPrice = produto.preco;

  if (typeof unitPrice !== "number" || Number.isNaN(unitPrice) || unitPrice <= 0) {
    throw new Error("Preço inválido para Mercado Pago (unit_price)");
  }

  const notificationUrl = resolveNotificationUrl();
  if (!notificationUrl) {
    console.warn("[mercadopago] Webhook URL não definida (MP_WEBHOOK_URL ou PUBLIC_BASE_URL). Webhook pode falhar.");
  }

  const back_urls = resolveBackUrls();

  const preference = {
    items: [
      {
        title,
        quantity: 1,
        currency_id: "BRL",
        unit_price: unitPrice,
      },
    ],
    payer: {
      name: customer.name || "Cliente",
      email: customer.email,
    },

    // chave principal para amarrar pagamento -> pedido
    external_reference: `order:${orderId}`,

    notification_url: notificationUrl || undefined,

    back_urls,
    auto_return: "approved",
  };

  try {
    const response = await mercadopago.preferences.create(preference);

    return {
      id: response.body?.id || null,
      init_point: response.body?.init_point || null,
      sandbox_init_point: response.body?.sandbox_init_point || null,
    };
  } catch (error) {
    console.log("========== ERRO MERCADO PAGO ==========");
    console.log(error?.message || error);
    console.log("status:", error?.response?.status);
    console.log("data:", error?.response?.data);
    console.log("======================================");
    throw error;
  }
}
// backend/mercadopago.js
import "dotenv/config";
import mercadopago from "mercadopago";

/**
 * Aceita QUALQUER uma dessas variáveis:
 * - MP_ACCESS_TOKEN (recomendado)
 * - MERCADOPAGO_ACCESS_TOKEN
 * - MP_TOKEN
 * - MERCADO_PAGO_ACCESS_TOKEN (compat com containers antigos)
 */
const ACCESS_TOKEN =
  process.env.MP_ACCESS_TOKEN ||
  process.env.MERCADOPAGO_ACCESS_TOKEN ||
  process.env.MP_TOKEN ||
  process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.warn("[mercadopago] ATENÇÃO: Access Token não definido no .env. Pagamentos vão falhar.");
} else {
  mercadopago.configure({ access_token: ACCESS_TOKEN });
}

function getNotificationUrl() {
  return (
    process.env.MP_WEBHOOK_URL ||
    process.env.MERCADO_PAGO_WEBHOOK_URL ||
    process.env.MERCADOPAGO_WEBHOOK_URL ||
    ""
  );
}

export async function criarPagamento({ produto, orderId, customer }) {
  if (!ACCESS_TOKEN) throw new Error("Access token do Mercado Pago ausente no backend");
  if (!produto) throw new Error("Produto é obrigatório");
  if (!orderId) throw new Error("orderId é obrigatório");
  if (!customer?.email) throw new Error("customer.email é obrigatório");

  const title = produto.title || produto.titulo || produto.nome || produto.name || "Produto";

  let unitPrice = null;
  if (typeof produto.preco_cents === "number") unitPrice = produto.preco_cents / 100;
  else if (typeof produto.price === "number") unitPrice = produto.price;
  else if (typeof produto.preco === "number") unitPrice = produto.preco;

  if (typeof unitPrice !== "number" || Number.isNaN(unitPrice) || unitPrice <= 0) {
    throw new Error("Preço inválido para Mercado Pago (unit_price)");
  }

  const notificationUrl = getNotificationUrl();
  if (!notificationUrl) {
    console.warn("[mercadopago] Webhook URL não definida (MP_WEBHOOK_URL / MERCADO_PAGO_WEBHOOK_URL).");
  }

  const frontendBase = process.env.FRONTEND_URL || "https://almaliraramos.com.br";

  const preference = {
    items: [
      {
        title,
        quantity: 1,
        currency_id: "BRL",
        unit_price: unitPrice
      }
    ],
    payer: {
      name: customer.name || customer.nome || "Cliente",
      email: customer.email
    },

    // Elo pagamento <-> order no banco
    external_reference: `order:${orderId}`,

    // Webhook do MP -> seu backend
    notification_url: notificationUrl || undefined,

    back_urls: {
      success: process.env.FRONTEND_SUCCESS_URL || `${frontendBase}/sucesso`,
      failure: process.env.FRONTEND_FAILURE_URL || `${frontendBase}/erro`,
      pending: process.env.FRONTEND_PENDING_URL || `${frontendBase}/pendente`
    },

    auto_return: "approved"
  };

  try {
    const response = await mercadopago.preferences.create(preference);

    return {
      id: response.body?.id || null,
      init_point: response.body?.init_point || null,
      sandbox_init_point: response.body?.sandbox_init_point || null
    };
  } catch (error) {
    console.log("========== ERRO MERCADO PAGO ==========");
    console.log("message:", error?.message);
    console.log("status:", error?.response?.status);
    console.log("data:", error?.response?.data);
    console.log("======================================");
    throw error;
  }
}
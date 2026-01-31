// backend/mercadopago.js
import "dotenv/config";
import { MercadoPagoConfig, Preference } from "mercadopago";

/**
 * Aceita QUALQUER uma dessas variáveis:
 * - MP_ACCESS_TOKEN (recomendado)
 * - MERCADOPAGO_ACCESS_TOKEN
 * - MP_TOKEN
 * - MERCADO_PAGO_ACCESS_TOKEN (compat)
 */
const ACCESS_TOKEN =
  process.env.MP_ACCESS_TOKEN ||
  process.env.MERCADOPAGO_ACCESS_TOKEN ||
  process.env.MP_TOKEN ||
  process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.warn("[mercadopago] ATENÇÃO: Access Token não definido no .env. Pagamentos vão falhar.");
}

const mpClient = ACCESS_TOKEN ? new MercadoPagoConfig({ accessToken: ACCESS_TOKEN }) : null;

function getNotificationUrl() {
  return (
    process.env.MP_WEBHOOK_URL ||
    process.env.MERCADO_PAGO_WEBHOOK_URL ||
    process.env.MERCADOPAGO_WEBHOOK_URL ||
    ""
  );
}

export function getMpToken() {
  return (
    process.env.MP_ACCESS_TOKEN ||
    process.env.MERCADOPAGO_ACCESS_TOKEN ||
    process.env.MP_TOKEN ||
    process.env.MERCADO_PAGO_ACCESS_TOKEN ||
    ""
  );
}

export async function criarPagamento({ produto, orderId, customer }) {
  if (!mpClient) throw new Error("Access token do Mercado Pago ausente no backend");
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

  const preferenceBody = {
    items: [
      {
        title,
        quantity: 1,
        currency_id: "BRL",
        unit_price: unitPrice,
      },
    ],
    payer: {
      name: customer.name || customer.nome || "Cliente",
      email: customer.email,
    },
    external_reference: `order:${orderId}`,

    // URL do BACKEND que recebe notificações do Mercado Pago
    notification_url: notificationUrl || undefined,

    back_urls: {
      success: process.env.FRONTEND_SUCCESS_URL || `${frontendBase}/sucesso`,
      failure: process.env.FRONTEND_FAILURE_URL || `${frontendBase}/erro`,
      pending: process.env.FRONTEND_PENDING_URL || `${frontendBase}/pendente`,
    },
    auto_return: "approved",
  };

  try {
    const preference = new Preference(mpClient);
    const response = await preference.create({ body: preferenceBody });

    const data = response?.body ?? response;

    return {
      id: data?.id || null,
      init_point: data?.init_point || null,
      sandbox_init_point: data?.sandbox_init_point || null,
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
// backend/mercadopago.js
import "dotenv/config";
import mercadopago from "mercadopago";

/**
 * ======================================================
 * CONFIG
 * ======================================================
 * Use UMA dessas variáveis no .env:
 * - MP_ACCESS_TOKEN (recomendado)
 * - MERCADOPAGO_ACCESS_TOKEN
 * - MP_TOKEN
 */
const ACCESS_TOKEN =
  process.env.MP_ACCESS_TOKEN ||
  process.env.MERCADOPAGO_ACCESS_TOKEN ||
  process.env.MP_TOKEN;

if (!ACCESS_TOKEN) {
  console.warn(
    "[mercadopago] ATENÇÃO: MP_ACCESS_TOKEN não definido no .env (pagamentos vão falhar)"
  );
} else {
  mercadopago.configure({ access_token: ACCESS_TOKEN });
}

/**
 * ======================================================
 * criarPagamento
 * ======================================================
 * Cria uma Preference no Mercado Pago e retorna init_point.
 *
 * Esperado:
 * - produto: { title|nome|name, preco_cents|price|preco }
 * - orderId: id do pedido no seu banco (curto/numérico)
 * - customer: { name, email }
 *
 * Retorna:
 * - { id, init_point, sandbox_init_point }
 */
export async function criarPagamento({ produto, orderId, customer }) {
  if (!produto) throw new Error("Produto é obrigatório");
  if (!orderId) throw new Error("orderId é obrigatório");
  if (!customer?.email) throw new Error("customer.email é obrigatório");

  const title = produto.title || produto.nome || produto.name || "Produto";

  let unitPrice = null;
  if (typeof produto.preco_cents === "number") unitPrice = produto.preco_cents / 100;
  else if (typeof produto.price === "number") unitPrice = produto.price;
  else if (typeof produto.preco === "number") unitPrice = produto.preco;

  if (typeof unitPrice !== "number" || Number.isNaN(unitPrice) || unitPrice <= 0) {
    throw new Error("Preço do produto inválido (unit_price)");
  }

  const notificationUrl = process.env.MP_WEBHOOK_URL;
  if (!notificationUrl) {
    console.warn("[mercadopago] MP_WEBHOOK_URL não definido. Webhook não vai receber eventos.");
  }

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

    // ✅ Padronizado: o webhook vai extrair orderId daqui
    external_reference: `order:${orderId}`,

    // ✅ URL pública HTTPS do seu webhook no backend
    notification_url: notificationUrl,

    // ✅ para o MP redirecionar o usuário após o checkout
    back_urls: {
      success: process.env.FRONTEND_SUCCESS_URL,
      failure: process.env.FRONTEND_FAILURE_URL,
      pending: process.env.FRONTEND_PENDING_URL,
    },

    auto_return: "approved",
  };

  try {
    const response = await mercadopago.preferences.create(preference);

    return {
      id: response.body?.id, // id da preference
      init_point: response.body?.init_point,
      sandbox_init_point: response.body?.sandbox_init_point,
    };
  } catch (error) {
    console.log("========== ERRO MERCADO PAGO (RAW) ==========");
    console.log(error);
    console.log("========== RESPONSE.DATA ==========");
    console.log(error?.response?.data);
    console.log("========== RESPONSE.STATUS ==========");
    console.log(error?.response?.status);
    console.log("=============================================");

    throw error;
  }
}
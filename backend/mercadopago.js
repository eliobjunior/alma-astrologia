// backend/mercadopago.js (ESM)
// Objetivo: criar pagamento no Mercado Pago SEMPRE com external_reference = `order:<orderId>`
// Isso é o que permite o worker reconcilePayments encontrar o pagamento depois.

import mercadopago from "mercadopago";

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

const ACCESS_TOKEN = resolveMpToken();

if (!ACCESS_TOKEN) {
  console.warn(
    "[mercadopago] ATENÇÃO: token ausente. Defina MP_ACCESS_TOKEN (ou MERCADO_PAGO_ACCESS_TOKEN)."
  );
} else {
  mercadopago.configure({ access_token: ACCESS_TOKEN });
}

/**
 * Cria uma preferência de pagamento e retorna init_point.
 * Esperado:
 * - produto: { id|produtoId, nome|title, preco|preco_reais|price }
 * - order: { id: number|string, email: string }
 *
 * IMPORTANTE: external_reference precisa existir e bater com o que o worker busca:
 *   external_reference = `order:${orderId}`
 */
export async function criarPagamentoPreference({ produto, order, backUrls }) {
  if (!ACCESS_TOKEN) throw new Error("MP access token não configurado.");

  const orderId = order?.id;
  if (!orderId) throw new Error("order.id é obrigatório para external_reference.");

  // preço (aceita float em reais)
  const unit_price =
    Number(produto?.preco_reais ?? produto?.preco ?? produto?.price ?? 0);

  if (!unit_price || Number.isNaN(unit_price)) {
    throw new Error("Preço do produto inválido.");
  }

  const title = produto?.nome ?? produto?.title ?? "Produto";

  const preference = {
    items: [
      {
        title,
        quantity: 1,
        unit_price,
        currency_id: "BRL",
      },
    ],

    // 🔴 CAUSA RAIZ DO SEU PROBLEMA: isso precisa estar SEMPRE presente
    external_reference: `order:${orderId}`,

    payer: {
      email: order?.email,
    },

    back_urls: {
      success: backUrls?.success || "https://almaliraramos.com.br/obrigado",
      failure: backUrls?.failure || "https://almaliraramos.com.br/erro",
      pending: backUrls?.pending || "https://almaliraramos.com.br/pending",
    },

    auto_return: "approved",
  };

  const resp = await mercadopago.preferences.create(preference);

  return {
    preferenceId: resp?.body?.id,
    init_point: resp?.body?.init_point,
    sandbox_init_point: resp?.body?.sandbox_init_point,
    external_reference: preference.external_reference,
  };
}
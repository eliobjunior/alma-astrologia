export async function criarPagamento({ produto, produtoId, dadosCliente }) {
  const externalReference = JSON.stringify({
    produtoId,
    dadosCliente,
    createdAt: new Date().toISOString(),
  });

  const preference = {
    items: [
      {
        title: produto.title,
        quantity: 1,
        currency_id: "BRL",
        unit_price: produto.price,
      },
    ],
    payer: {
      name: dadosCliente.nome,
      email: dadosCliente.email,
    },
    external_reference: externalReference,
    notification_url: process.env.MP_WEBHOOK_URL,
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
      init_point: response.body.init_point, // ✅ ÚNICO CAMPO CORRETO
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
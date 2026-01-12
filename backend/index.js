import express from "express";
import cors from "cors";
import { criarPagamento } from "./mercadopago.js";

const app = express();
const PORT = 3000;

/**
 * ===============================
 * MIDDLEWARES
 * ===============================
 */
app.use(cors());
app.use(express.json());

/**
 * ===============================
 * HEALTH CHECK
 * ===============================
 * Teste rápido para validar se o backend está no ar
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend ativo para testes"
  });
});

/**
 * ===============================
 * CREATE PAYMENT — TESTE REAL
 * ===============================
 * Fluxo:
 * 1. Valida payload
 * 2. Chama criarPagamento (Mercado Pago)
 * 3. Retorna init_point
 */
app.post("/api/create-payment", async (req, res) => {
  try {
    const { produto_id, cliente } = req.body;

    // 1️⃣ Validação mínima e objetiva
    if (
      !produto_id ||
      !cliente ||
      !cliente.nome ||
      !cliente.email
    ) {
      return res.status(400).json({
        error: "Payload inválido",
        esperado: {
          produto_id: "string",
          cliente: {
            nome: "string",
            email: "string"
          }
        }
      });
    }

    // 2️⃣ Chamada REAL ao Mercado Pago
    const pagamento = await criarPagamento({
      produtoId: produto_id,
      dadosCliente: cliente
    });

    // 3️⃣ Retorno controlado
    return res.json({
      success: true,
      init_point: pagamento.init_point
    });

  } catch (error) {
    console.error("❌ ERRO AO CRIAR PAGAMENTO");
    console.error(error?.response?.data || error.message);

    return res.status(500).json({
      error: "Erro interno ao criar pagamento"
    });
  }
});

/**
 * ===============================
 * START SERVER
 * ===============================
 */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend de TESTE rodando na porta ${PORT}`);
});
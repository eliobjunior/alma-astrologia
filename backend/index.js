import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";

// ========================
// CONFIGURAÇÃO INICIAL
// ========================
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ========================
// MIDDLEWARES
// ========================
app.use(cors());
app.use(express.json());

// ========================
// MERCADO PAGO CLIENT
// ========================
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

const preference = new Preference(mpClient);

// ========================
// ROTAS
// ========================

// Health check (IMPORTANTE para Hostinger)
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Backend Mercado Pago - Alma Ramos",
  });
});

// Criar pagamento
app.post("/create-payment", async (req, res) => {
  try {
    const { title, price, email } = req.body;

    if (!title || !price) {
      return res.status(400).json({
        error: "Título e preço são obrigatórios",
      });
    }

    const response = await preference.create({
      body: {
        items: [
          {
            title: title,
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(price),
          },
        ],
        payer: email
          ? {
              email: email,
            }
          : undefined,
        back_urls: {
          success: "https://almaliraramos.com.br/sucesso",
          failure: "https://almaliraramos.com.br/erro",
          pending: "https://almaliraramos.com.br/pendente",
        },
        auto_return: "approved",
      },
    });

    res.json({
      init_point: response.init_point,
    });
  } catch (error) {
    console.error("Erro Mercado Pago:", error);
    res.status(500).json({
      error: "Erro ao criar pagamento",
    });
  }
});

// ========================
// START SERVER
// ========================
app.listen(PORT, () => {
  console.log(`🚀 Backend Mercado Pago rodando na porta ${PORT}`);
});
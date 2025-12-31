import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ✅ Cliente Mercado Pago CORRETO
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

app.post("/create-payment", async (req, res) => {
  try {
    const {
      productName,
      paymentType,
      nomeCompleto,
      cidadeNascimento,
      estadoNascimento,
      pais,
      dataNascimento,
      horaNascimento,
    } = req.body;

    const preference = new Preference(mpClient);

    const result = await preference.create({
      items: [
        {
          title: productName,
          quantity: 1,
          unit_price: 49.9,
        },
      ],
      metadata: {
        productName,
        paymentType,
        nomeCompleto,
        cidadeNascimento,
        estadoNascimento,
        pais,
        dataNascimento,
        horaNascimento,
      },
      payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: 12,
      },
      back_urls: {
        success: "http://localhost:5173/sucesso",
        failure: "http://localhost:5173/erro",
        pending: "http://localhost:5173/pendente",
      },
      auto_return: "approved",
    });

    res.json({ init_point: result.init_point });
  } catch (error) {
    console.error("Erro Mercado Pago:", error);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend Mercado Pago rodando na porta ${PORT}`);
});
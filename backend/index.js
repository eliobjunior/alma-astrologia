// backend/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";

import { ensureSchema, pool } from "./db.js";
import {
  getProduct,
  resolveProductId,
  isActiveProduct,
  priceFromCents,
} from "./products.js";
import { criarPagamento, getMpToken } from "./mercadopago.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);

/**
 * =========================
 * CORS
 * =========================
 */
const allowedOrigins = [
  "https://www.almaliraramos.com.br",
  "https://almaliraramos.com.br",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, true); // (mantém permissivo como você já estava)
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());
app.use(express.json({ limit: "1mb" }));

/**
 * =========================
 * HELPERS
 * =========================
 */
function normalizeFrontPayload(body) {
  const produtoId =
    body?.produtoId || body?.produtoID || body?.productId || body?.produto_id;
  if (!produtoId) return null;

  const client = {
    nome: body?.nome ? String(body.nome) : "",
    email: body?.email ? String(body.email) : "",
    dataNascimento: body?.dataNascimento ? String(body.dataNascimento) : "",
    horaNascimento: body?.horaNascimento ? String(body.horaNascimento) : "",
    cidadeNascimento: body?.cidadeNascimento ? String(body.cidadeNascimento) : "",
  };

  return { produtoId: String(produtoId), client };
}

function parseOrderIdFromExternalRef(externalRef) {
  if (!externalRef) return null;

  if (typeof externalRef === "string" && externalRef.startsWith("order:")) {
    const n = Number(externalRef.replace("order:", ""));
    return Number.isFinite(n) ? n : null;
  }

  if (typeof externalRef === "string" && /^[0-9]+$/.test(externalRef.trim())) {
    const n = Number(externalRef.trim());
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

function mpPaymentToOrderStatus(mpStatus) {
  if (!mpStatus) return "payment_pending";
  if (["approved", "authorized"].includes(mpStatus)) return "paid";
  if (["rejected", "cancelled", "refunded", "charged_back"].includes(mpStatus))
    return "failed";
  if (["in_process", "pending"].includes(mpStatus)) return "payment_pending";
  return "payment_pending";
}

/**
 * Garante número (numeric) para gravar no Postgres.
 * Ex.: 500 cents -> 5.00
 */
function numericPriceFromCents(amountCents) {
  const n = Number(amountCents);
  if (!Number.isFinite(n)) return null;
  return n / 100;
}

/**
 * =========================
 * ROUTES
 * =========================
 */
app.get("/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT 1 as ok");
    res.json({
      status: "ok",
      service: "alma-backend",
      db: r?.rows?.[0]?.ok === 1 ? "ok" : "unknown",
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({
      status: "error",
      service: "alma-backend",
      db: "error",
      message: e?.message || "DB error",
    });
  }
});

/**
 * =========================
 * CHECKOUT (ÚNICO)
 * POST /orders | POST /checkout
 * =========================
 */
async function checkoutHandler(req, res) {
  const normalized = normalizeFrontPayload(req.body);

  if (!normalized) {
    return res.status(400).json({
      status: "error",
      message: "Payload inválido",
      esperado: {
        produtoId: "string",
        nome: "string",
        email: "string",
        dataNascimento: "yyyy-mm-dd",
        horaNascimento: "HH:mm",
        cidadeNascimento: "string",
      },
    });
  }

  const produtoIdResolved = resolveProductId(normalized.produtoId);
  const produto = getProduct(produtoIdResolved);

  if (!produto) {
    return res.status(400).json({
      status: "error",
      message: "produtoId inválido",
      produtoId: normalized.produtoId,
      sugestao:
        produtoIdResolved !== normalized.produtoId ? produtoIdResolved : undefined,
    });
  }

  if (!isActiveProduct(produto)) {
    return res.status(400).json({
      status: "error",
      message: "Produto inativo",
      produtoId: produtoIdResolved,
    });
  }

  const { client } = normalized;

  const missing = [];
  if (!client.nome) missing.push("nome");
  if (!client.email) missing.push("email");
  if (!client.dataNascimento) missing.push("dataNascimento");
  if (!client.horaNascimento) missing.push("horaNascimento");
  if (!client.cidadeNascimento) missing.push("cidadeNascimento");

  if (missing.length) {
    return res
      .status(400)
      .json({ status: "error", message: "Dados obrigatórios ausentes", missing });
  }

  if (typeof produto.preco_cents !== "number" || produto.preco_cents <= 0) {
    return res.status(500).json({
      status: "error",
      message: "Produto sem preco_cents configurado",
      produtoId: produtoIdResolved,
    });
  }

  const amountCents = produto.preco_cents;

  // Usado para o front (string / formatado)
  const price = priceFromCents(amountCents);

  // Usado para gravar no Postgres (numeric)
  const priceNumeric = numericPriceFromCents(amountCents);
  if (priceNumeric === null) {
    return res.status(500).json({
      status: "error",
      message: "Preço inválido para persistência",
      amountCents,
    });
  }

  const clientDb = {
    ...client,
    produtoId: produtoIdResolved,
    produtoTitulo: produto.titulo,
    produtoTipo: produto.tipo,
  };

  const dbClient = await pool.connect();

  try {
    await dbClient.query("BEGIN");

    /**
     * ✅ FIX PRINCIPAL
     * Sua tabela orders exige:
     * - title NOT NULL
     * - price NOT NULL
     * - email NOT NULL
     *
     * Então inserimos esses campos também.
     *
     * Observação: mantemos também os campos "product_*" e "amount_cents" que você já usa.
     */
    const insert = await dbClient.query(
      `
        INSERT INTO public.orders
          (
            title,
            price,
            email,
            status,
            product_id,
            product_title,
            product_type,
            amount_cents,
            currency,
            client_json
          )
        VALUES
          (
            $1, $2, $3, 'created',
            $4, $5, $6, $7, 'BRL', $8
          )
        RETURNING id;
      `,
      [
        produto.titulo,          // title (NOT NULL)
        priceNumeric,            // price (NOT NULL) -> numeric
        client.email,            // email (NOT NULL)
        produtoIdResolved,
        produto.titulo,
        produto.tipo,
        amountCents,
        clientDb,                // jsonb
      ]
    );

    const orderId = insert.rows[0].id;

    // 2) salva external_reference (será enviado ao MP)
    const external_reference = `order:${orderId}`;
    await dbClient.query(
      `UPDATE public.orders SET external_reference = $1 WHERE id = $2`,
      [external_reference, orderId]
    );

    await dbClient.query("COMMIT");

    // 3) cria pagamento no MP (preference)
    const pagamento = await criarPagamento({
      produto: { title: produto.titulo, preco_cents: produto.preco_cents },
      orderId,
      customer: { name: client.nome, email: client.email },
    });

    if (!pagamento?.init_point) {
      return res.status(500).json({
        status: "error",
        message: "Mercado Pago não retornou init_point",
        debug: pagamento || null,
      });
    }

    // 4) atualiza pedido com preference e init_point
    await pool.query(
      `
        UPDATE public.orders
        SET mp_preference_id = $1,
            mp_init_point = $2,
            status = 'payment_pending'
        WHERE id = $3;
      `,
      [pagamento?.id || null, pagamento.init_point, orderId]
    );

    // 5) devolve pro frontend redirecionar
    return res.json({
      status: "success",
      orderId,
      init_point: pagamento.init_point,
      produto: {
        produtoId: produtoIdResolved,
        titulo: produto.titulo,
        tipo: produto.tipo,
        price, // string/formatado pro front
      },
    });
  } catch (e) {
    await dbClient.query("ROLLBACK").catch(() => {});
    console.error("checkoutHandler error:", e?.response?.data || e?.message || e);
    return res.status(500).json({
      status: "error",
      message: "Erro interno no checkout",
      detail: e?.message || "unknown",
    });
  } finally {
    dbClient.release();
  }
}

app.post("/checkout", checkoutHandler);
app.post("/orders", checkoutHandler);

/**
 * =========================
 * WEBHOOK MERCADO PAGO -> DISPARA N8N SÓ QUANDO APPROVED
 * ROTA DO BACKEND: POST /webhook/mercadopago
 * =========================
 */
app.post("/webhook/mercadopago", async (req, res) => {
  // responde rápido pro MP
  res.status(200).send("OK");

  try {
    // MP pode mandar "type" ou "topic" (e às vezes vem em querystring)
    const type = req.body?.type || req.body?.topic || req.query?.type || req.query?.topic;

    const dataId =
      req.body?.data?.id ||
      req.body?.id ||
      req.query?.["data.id"] ||
      req.query?.id ||
      null;

    if ((type !== "payment" && type !== "payments") || !dataId) {
      console.warn("Webhook ignorado (sem payment/type ou sem data.id)", { type, dataId });
      return;
    }

    const token = getMpToken();
    if (!token) {
      console.error("Token MP não configurado; não dá pra consultar payment.");
      return;
    }

    // consulta o pagamento no MP para confirmar status REAL
    const mpRes = await axios.get(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    });

    const payment = mpRes.data;
    const mpStatus = payment?.status || null;
    const externalRef = payment?.external_reference || null;

    const orderId = parseOrderIdFromExternalRef(externalRef);
    if (!orderId) {
      console.error("Não consegui extrair orderId do external_reference:", externalRef);
      return;
    }

    const newOrderStatus = mpPaymentToOrderStatus(mpStatus);

    // atualiza order com status do MP
    await pool.query(
      `
        UPDATE public.orders
        SET mp_payment_id = $1,
            mp_payment_status = $2,
            status = $3
        WHERE id = $4
      `,
      [String(dataId), mpStatus, newOrderStatus, orderId]
    );

    // só dispara n8n quando aprovado
    if (!["approved", "authorized"].includes(mpStatus)) {
      console.log("Pagamento não aprovado ainda. Não dispara n8n.", { orderId, mpStatus });
      return;
    }

    // busca order e checa se já enviou pro n8n
    const orderRes = await pool.query(
      `
        SELECT *
        FROM public.orders
        WHERE id = $1
        LIMIT 1;
      `,
      [orderId]
    );

    const order = orderRes.rows?.[0];
    if (!order) {
      console.error("Order não encontrada:", orderId);
      return;
    }

    if (order.n8n_sent_at) {
      console.log("n8n já disparado anteriormente. Ignorando webhook repetido.", {
        orderId,
        mpStatus,
      });
      return;
    }

    // ✅ ESTA URL PRECISA SER DO WEBHOOK NODE DO N8N
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      console.warn("N8N_WEBHOOK_URL não configurado. Pedido pago sem disparo n8n.");
      return;
    }

    const payloadN8n = {
      source: "mercadopago_webhook",
      order,
      payment,
    };

    try {
      const n8nRes = await axios.post(n8nUrl, payloadN8n, {
        headers: { "Content-Type": "application/json" },
        timeout: 20000,
      });

      await pool.query(
        `
          UPDATE public.orders
          SET n8n_sent_at = now(),
              n8n_status = 'sent',
              n8n_last_error = NULL
          WHERE id = $1
        `,
        [orderId]
      );

      console.log("✅ n8n disparado com sucesso", {
        orderId,
        mpStatus,
        n8nStatus: n8nRes.status,
      });
    } catch (err) {
      const msg = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message || "n8n error";

      await pool.query(
        `
          UPDATE public.orders
          SET n8n_status = 'error',
              n8n_last_error = $2
          WHERE id = $1
        `,
        [orderId, msg]
      );

      console.error("Falha ao enviar para n8n:", msg);
    }
  } catch (e) {
    console.error("Webhook handler error:", e?.response?.data || e?.message || e);
  }
});

/**
 * =========================
 * START
 * =========================
 */
(async () => {
  try {
    await ensureSchema();
    console.log("✅ DB schema ok");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Backend rodando na porta ${PORT}`);
      console.log(`   Rotas: POST /checkout | POST /orders`);
      console.log(`   Health: GET /health`);
      console.log(`   Webhook: POST /webhook/mercadopago`);
    });
  } catch (e) {
    console.error("❌ Falha ao iniciar:", e?.message || e);
    process.exit(1);
  }
})();
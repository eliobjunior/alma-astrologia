// backend/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { Pool } from "pg";
import { getProduct, resolveProductId, isActiveProduct, priceFromCents } from "./products.js";
import { criarPagamento, mpStatus } from "./mercadopago.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);

/**
 * ======================================================
 * CORS
 * ======================================================
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
      return cb(null, true);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());
app.use(express.json({ limit: "1mb" }));

/**
 * ======================================================
 * DB (Postgres)
 * Preferência: DATABASE_URL
 * ======================================================
 */
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || "alma_ramos",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
    });

/**
 * ======================================================
 * MIGRATION LIGHT (idempotente)
 * ======================================================
 */
async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.orders (
      id BIGSERIAL PRIMARY KEY,
      product_id TEXT,
      product_title TEXT,
      product_type TEXT,
      amount_cents INTEGER,
      currency TEXT DEFAULT 'BRL',

      email TEXT,
      client_json JSONB,

      status TEXT NOT NULL DEFAULT 'created',

      external_reference TEXT,
      mp_preference_id TEXT,
      mp_init_point TEXT,
      mp_payment_id TEXT,
      mp_payment_status TEXT,

      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at_orders'
      ) THEN
        CREATE OR REPLACE FUNCTION set_updated_at_orders()
        RETURNS trigger AS $fn$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $fn$ LANGUAGE plpgsql;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_orders'
      ) THEN
        CREATE TRIGGER trg_set_updated_at_orders
        BEFORE UPDATE ON public.orders
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at_orders();
      END IF;
    END $$;
  `);

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_orders_external_reference ON public.orders(external_reference);`
  );
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(email);`);
}

/**
 * ======================================================
 * HELPERS
 * ======================================================
 */
function normalizeFrontPayload(body) {
  const produtoId = body?.produtoId || body?.productId || body?.produto_id;
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

  try {
    const obj = JSON.parse(externalRef);
    if (obj?.orderId && Number.isFinite(Number(obj.orderId))) return Number(obj.orderId);
  } catch (_) {}

  return null;
}

function mpPaymentToOrderStatus(mpStatus) {
  if (!mpStatus) return "payment_pending";
  if (["approved", "authorized"].includes(mpStatus)) return "paid";
  if (["rejected", "cancelled", "refunded", "charged_back"].includes(mpStatus)) return "failed";
  if (["in_process", "pending"].includes(mpStatus)) return "payment_pending";
  return "payment_pending";
}

/**
 * ======================================================
 * ROUTES
 * ======================================================
 */
app.get("/health", async (_req, res) => {
  try {
    const r = await pool.query("SELECT 1 as ok");
    res.json({
      status: "ok",
      service: "alma-backend",
      db: r?.rows?.[0]?.ok === 1 ? "ok" : "unknown",
      mp: mpStatus(),
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
 * ======================================================
 * CHECKOUT (ÚNICO)
 * POST /orders | POST /checkout
 * ======================================================
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
      sugestao: produtoIdResolved !== normalized.produtoId ? produtoIdResolved : undefined,
    });
  }

  if (!isActiveProduct(produto)) {
    return res.status(400).json({
      status: "error",
      message: "Produto inativo",
      produtoId: produtoIdResolved,
    });
  }

  // IMPORTANTE: mensal (assinatura) tem webhook diferente (preapproval)
  // Para não prometer automação errada, bloqueio aqui por enquanto.
  if (produto.tipo === "mensal") {
    return res.status(400).json({
      status: "error",
      message:
        "Produto mensal (assinatura) requer webhook de preapproval. Este backend está configurado para pagamentos (payment) via preference.",
      sugestao:
        "Se quiser, eu gero a implementação de assinatura (preapproval) + webhook específico.",
      checkout_url: produto?.payment?.mensal || null,
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
    return res.status(400).json({
      status: "error",
      message: "Dados obrigatórios ausentes",
      missing,
    });
  }

  if (typeof produto.preco_cents !== "number" || produto.preco_cents <= 0) {
    return res.status(500).json({
      status: "error",
      message: "Produto sem preco_cents configurado",
      produtoId: produtoIdResolved,
    });
  }

  const amountCents = produto.preco_cents;
  const price = priceFromCents(amountCents);

  const clientDb = {
    ...client,
    produtoId: produtoIdResolved,
    produtoTitulo: produto.titulo,
    produtoTipo: produto.tipo,
  };

  const dbClient = await pool.connect();

  try {
    await dbClient.query("BEGIN");

    // 1) cria order
    const insert = await dbClient.query(
      `
        INSERT INTO public.orders
          (product_id, product_title, product_type, amount_cents, currency, email, client_json, status)
        VALUES
          ($1, $2, $3, $4, 'BRL', $5, $6, 'created')
        RETURNING id;
      `,
      [produtoIdResolved, produto.titulo, produto.tipo, amountCents, client.email, clientDb]
    );

    const orderId = insert.rows[0].id;

    // 2) external_reference
    const external_reference = `order:${orderId}`;
    await dbClient.query(`UPDATE public.orders SET external_reference = $1 WHERE id = $2`, [
      external_reference,
      orderId,
    ]);

    await dbClient.query("COMMIT");

    // 3) cria preference no MP
    const pagamento = await criarPagamento({
      produto: { titulo: produto.titulo, preco_cents: produto.preco_cents },
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

    // 4) salva dados MP
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

    // 5) responde pro front
    return res.json({
      status: "success",
      orderId,
      init_point: pagamento.init_point,
      produto: {
        produtoId: produtoIdResolved,
        titulo: produto.titulo,
        tipo: produto.tipo,
        price,
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
 * ======================================================
 * WEBHOOK MERCADO PAGO (payment)
 * ======================================================
 *
 * Aceita formatos comuns:
 * - body: { type: "payment", data: { id } }
 * - query: ?topic=payment&id=123
 * - query: ?type=payment&data.id=123
 */
app.post("/webhook/mercadopago", async (req, res) => {
  // responde rápido pro MP
  res.status(200).send("OK");

  try {
    const type = req.body?.type || req.query?.type || req.query?.topic;
    const dataId =
      req.body?.data?.id ||
      req.query?.["data.id"] ||
      req.query?.id ||
      req.body?.id ||
      null;

    if (type !== "payment" || !dataId) {
      console.warn("Webhook ignorado (não é payment ou sem id)", { type, dataId });
      return;
    }

    const token =
      process.env.MP_ACCESS_TOKEN ||
      process.env.MERCADOPAGO_ACCESS_TOKEN ||
      process.env.MP_TOKEN;

    if (!token) {
      console.error("MP_ACCESS_TOKEN não configurado; não dá pra consultar pagamento.");
      return;
    }

    // Consulta pagamento (fonte de verdade)
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const payment = await mpRes.json();
    if (!mpRes.ok) {
      console.error("Erro ao consultar payment no MP:", mpRes.status, payment);
      return;
    }

    const mpStatusValue = payment?.status || null;
    const externalRef = payment?.external_reference || null;

    const orderId = parseOrderIdFromExternalRef(externalRef);
    if (!orderId) {
      console.error("Não consegui extrair orderId do external_reference:", externalRef);
      return;
    }

    const newOrderStatus = mpPaymentToOrderStatus(mpStatusValue);

    // Atualiza pedido
    await pool.query(
      `
        UPDATE public.orders
        SET mp_payment_id = $1,
            mp_payment_status = $2,
            status = $3
        WHERE id = $4
      `,
      [String(dataId), mpStatusValue, newOrderStatus, orderId]
    );

    // Só dispara n8n quando aprovado/autorizado
    if (!["approved", "authorized"].includes(mpStatusValue)) {
      console.log("Pagamento ainda não aprovado. Não dispara n8n.", { orderId, mpStatusValue });
      return;
    }

    // Busca pedido com dados do cliente
    const orderRes = await pool.query(
      `
        SELECT id, product_id, product_title, product_type, amount_cents, currency,
               email, client_json, status, mp_payment_id, mp_payment_status,
               external_reference, created_at, updated_at
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

    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      console.warn("N8N_WEBHOOK_URL não configurado. Pedido pago atualizado sem disparo n8n.");
      return;
    }

    const payloadN8n = {
      source: "mercadopago_webhook",
      order,
      payment,
    };

    const n8nRes = await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadN8n),
    });

    if (!n8nRes.ok) {
      const txt = await n8nRes.text().catch(() => "");
      console.error("Falha ao enviar para n8n:", n8nRes.status, txt);
      return;
    }

    console.log("✅ n8n disparado com sucesso", { orderId, mpStatusValue });
  } catch (e) {
    console.error("Webhook handler error:", e?.message || e);
  }
});

/**
 * ======================================================
 * START
 * ======================================================
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
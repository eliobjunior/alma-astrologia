// backend/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";
import crypto from "crypto";

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

// ✅ Importante quando roda atrás do Traefik / proxy reverso
app.set("trust proxy", 1);

/**
 * =========================
 * SECURITY HEADERS (API)
 * =========================
 */
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'"
  );
  next();
});

// Aceita JSON e URL encoded (MP pode mandar query/body diferentes)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

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
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS: origin not allowed"), false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Session-Token"],
    credentials: true,
  })
);

app.options("*", cors());

function getOrigin(req) {
  return req.headers.origin || "";
}

function isAllowedOrigin(req) {
  const origin = getOrigin(req);
  return Boolean(origin && allowedOrigins.includes(origin));
}

/**
 * =========================
 * RATE LIMIT (simples)
 * =========================
 */
function makeRateLimiter({ windowMs, max, keyPrefix }) {
  const hits = new Map(); // key -> { count, resetAt }
  return function rateLimit(req, res, next) {
    const ip =
      String(req.headers["cf-connecting-ip"] || "").trim() ||
      String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "unknown";

    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const cur = hits.get(key);
    if (!cur || now > cur.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    cur.count += 1;

    if (cur.count > max) {
      const retrySec = Math.ceil((cur.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retrySec));
      return res.status(429).json({
        status: "error",
        message: "Muitas tentativas. Tente novamente em instantes.",
        retry_after_seconds: retrySec,
      });
    }

    return next();
  };
}

const limitSessionToken = makeRateLimiter({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_SESSION_MAX || 60),
  keyPrefix: "session-token",
});

const limitCheckout = makeRateLimiter({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_CHECKOUT_MAX || 30),
  keyPrefix: "checkout",
});

const limitWebhook = makeRateLimiter({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_WEBHOOK_MAX || 120),
  keyPrefix: "mp-webhook",
});

/**
 * =========================
 * ANTI-CLONE: SESSION TOKEN
 * =========================
 */
const SESSION_TOKEN_SECRET = process.env.SESSION_TOKEN_SECRET || "";
const SESSION_TOKEN_TTL_SECONDS = Number(process.env.SESSION_TOKEN_TTL_SECONDS || 120);

if (!SESSION_TOKEN_SECRET) {
  console.warn(
    "[security] SESSION_TOKEN_SECRET ausente. Anti-clone desativado (configure em produção)."
  );
}

function b64urlEncode(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlDecode(str) {
  const pad = str.length % 4 ? "=".repeat(4 - (str.length % 4)) : "";
  const s = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(s, "base64").toString("utf8");
}

function sign(data) {
  return b64urlEncode(
    crypto.createHmac("sha256", SESSION_TOKEN_SECRET).update(data).digest()
  );
}

function createSessionToken() {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TOKEN_TTL_SECONDS;
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = b64urlEncode(JSON.stringify({ exp, nonce }));
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function verifySessionToken(token) {
  if (!SESSION_TOKEN_SECRET) return { ok: true, skipped: true };
  if (!token || typeof token !== "string") return { ok: false, reason: "missing" };

  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "format" };

  const [payload, sig] = parts;
  const expected = sign(payload);

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "signature" };
  }

  let decoded;
  try {
    decoded = JSON.parse(b64urlDecode(payload));
  } catch {
    return { ok: false, reason: "payload" };
  }

  const exp = Number(decoded?.exp || 0);
  const now = Math.floor(Date.now() / 1000);
  if (!exp || now > exp) return { ok: false, reason: "expired" };

  return { ok: true };
}

function requireSessionToken(req, res, next) {
  const bypass = String(process.env.SESSION_TOKEN_BYPASS || "").toLowerCase() === "true";
  if (bypass) return next();

  const originOk = isAllowedOrigin(req);
  const token =
    req.headers["x-session-token"] ||
    req.body?.sessionToken ||
    "";

  const v = verifySessionToken(String(token));

  if (!originOk || !v.ok) {
    return res.status(403).json({
      status: "error",
      message: "Acesso negado (proteção anti-clone).",
      origin_ok: originOk,
      token_ok: v.ok,
      token_reason: v.ok ? undefined : v.reason,
    });
  }

  return next();
}

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

function numericPriceFromCents(amountCents) {
  const n = Number(amountCents);
  if (!Number.isFinite(n)) return null;
  return Math.round(n) / 100;
}

/**
 * =========================
 * N8N AUTH (compatível com seu .env)
 * =========================
 */
function makeBasicAuthHeader(user, pass) {
  if (!user || !pass) return "";
  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  return `Basic ${token}`;
}

function buildN8nHeaders() {
  const N8N_AUTH_USER =
    process.env.N8N_AUTH_USER ||
    process.env.N8N_AUTH_HEADER_NAME ||
    process.env.N8N_HEADER_NAME ||
    "api-key-pagamento-aprovado";

  const N8N_AUTH_PASS =
    process.env.N8N_AUTH_PASS ||
    process.env.N8N_AUTH_HEADER_VALUE ||
    process.env.N8N_WEBHOOK_TOKEN ||
    "";

  const headerName =
    process.env.N8N_AUTH_HEADER_NAME ||
    process.env.N8N_HEADER_NAME ||
    "api-key-pagamento-aprovado";

  const headerValue =
    process.env.N8N_AUTH_HEADER_VALUE ||
    process.env.N8N_WEBHOOK_TOKEN ||
    "";

  const headers = { "Content-Type": "application/json" };

  const basic = makeBasicAuthHeader(N8N_AUTH_USER, N8N_AUTH_PASS);
  if (basic) headers["Authorization"] = basic;

  if (headerValue) headers[headerName] = headerValue;

  return headers;
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
 * SESSION TOKEN (ANTI-CLONE)
 * =========================
 */
app.get("/session-token", limitSessionToken, (req, res) => {
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ status: "error", message: "Origin não permitido." });
  }
  if (!SESSION_TOKEN_SECRET) {
    return res.status(501).json({
      status: "error",
      message: "Anti-clone não configurado (SESSION_TOKEN_SECRET ausente).",
    });
  }

  return res.json({
    status: "success",
    sessionToken: createSessionToken(),
    ttlSeconds: SESSION_TOKEN_TTL_SECONDS,
  });
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

            client_json,

            nome,
            data_nascimento,
            hora_nascimento,
            cidade_nascimento
          )
        VALUES
          (
            $1, $2, $3, 'created',
            $4, $5, $6, $7, 'BRL',
            $8,
            $9, $10, $11, $12
          )
        RETURNING id;
      `,
      [
        produto.titulo,
        priceNumeric,
        client.email,
        produtoIdResolved,
        produto.titulo,
        produto.tipo,
        amountCents,
        clientDb,
        client.nome,
        client.dataNascimento,
        client.horaNascimento,
        client.cidadeNascimento,
      ]
    );

    const orderId = insert.rows[0].id;

    const external_reference = `order:${orderId}`;
    await dbClient.query(
      `UPDATE public.orders SET external_reference = $1 WHERE id = $2`,
      [external_reference, orderId]
    );

    await dbClient.query("COMMIT");

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

// ✅ Protegendo rotas sensíveis
app.post("/checkout", limitCheckout, requireSessionToken, checkoutHandler);
app.post("/orders", limitCheckout, requireSessionToken, checkoutHandler);

/**
 * =========================
 * WEBHOOK MERCADO PAGO
 * POST /webhook/mercadopago
 * =========================
 */
app.post("/webhook/mercadopago", limitWebhook, async (req, res) => {
  res.status(200).send("OK");

  try {
    const type =
      req.body?.type || req.body?.topic || req.query?.type || req.query?.topic;

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

    const mpRes = await axios.get(
      `https://api.mercadopago.com/v1/payments/${dataId}`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
    );

    const payment = mpRes.data;
    const mpStatus = payment?.status || null;
    const externalRef = payment?.external_reference || null;
    const amountPaid = Number(payment?.transaction_amount || 0);

    const orderId = parseOrderIdFromExternalRef(externalRef);
    if (!orderId) {
      console.error("Não consegui extrair orderId do external_reference:", externalRef);
      return;
    }

    // ✅ Validação anti-fraude: valor do payment deve bater com o pedido
    const orderRes = await pool.query(
      `SELECT id, amount_cents, n8n_sent_at, product_id, email, nome, data_nascimento, hora_nascimento, cidade_nascimento
       FROM public.orders WHERE id = $1 LIMIT 1`,
      [orderId]
    );
    const order = orderRes.rows?.[0];
    if (!order) {
      console.error("Order não encontrada:", orderId);
      return;
    }

    const expected = Number(order.amount_cents || 0) / 100;
    const okValue = expected > 0 ? Math.abs(amountPaid - expected) < 0.01 : true;

    if (!okValue) {
      console.error("Webhook MP com valor divergente. Ignorando.", { orderId, expected, amountPaid });
      return;
    }

    const newOrderStatus = mpPaymentToOrderStatus(mpStatus);

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

    if (!["approved", "authorized"].includes(mpStatus)) {
      console.log("Pagamento não aprovado ainda. Não dispara n8n.", { orderId, mpStatus });
      return;
    }

    if (order.n8n_sent_at) {
      console.log("n8n já disparado. Ignorando webhook repetido.", { orderId, mpStatus });
      return;
    }

    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      console.warn("N8N_WEBHOOK_URL não configurado. Pedido pago sem disparo n8n.");
      return;
    }

    const payloadN8n = {
      produtoId: order.product_id,
      id: order.id,
      email: order.email,
      nome: order.nome,
      data_nascimento: order.data_nascimento,
      hora_nascimento: order.hora_nascimento,
      cidade_nascimento: order.cidade_nascimento,
    };

    try {
      const headers = buildN8nHeaders();

      const n8nRes = await axios.post(n8nUrl, payloadN8n, {
        headers,
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

      console.log("✅ n8n disparado com sucesso", { orderId, mpStatus, n8nStatus: n8nRes.status });
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
 * 404
 * =========================
 */
app.use((req, res) => {
  res.status(404).send("404 page not found");
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
      console.log(`   Sessão: GET /session-token`);
      console.log(`   Rotas: POST /checkout | POST /orders`);
      console.log(`   Health: GET /health`);
      console.log(`   Webhook: POST /webhook/mercadopago`);
    });
  } catch (e) {
    console.error("❌ Falha ao iniciar:", e?.message || e);
    process.exit(1);
  }
})();
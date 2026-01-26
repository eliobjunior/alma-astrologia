// backend/index.js
import express from "express";
import cors from "cors";
import { Pool } from "pg";
import { criarPagamento } from "./mercadopago.js";

/**
 * ======================================================
 * APP
 * ======================================================
 */
const app = express();
const PORT = Number(process.env.PORT || 3000);

/**
 * ======================================================
 * MIDDLEWARES
 * ======================================================
 */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));

/**
 * ======================================================
 * DB (Postgres)
 * Env esperado (mesmo padrão que você já tem no container):
 *  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 * ======================================================
 */
const pool = new Pool({
  host: process.env.DB_HOST || "postgres",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "alma_ramos",
  user: process.env.DB_USER || "eliobj",
  password: process.env.DB_PASSWORD || "",
});

/**
 * ======================================================
 * MIGRATION LIGHT (cria/ajusta tabela se necessário)
 * - Não quebra se a tabela já existir
 * - Adiciona colunas úteis p/ vincular pagamento e enviar p/ n8n
 * ======================================================
 */
async function ensureSchema() {
  // 1) cria tabela base se não existir
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.orders (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // 2) adiciona colunas extras (idempotente) — sem exigir drop/recreate
  // (Se já tiver, ignora.)
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='orders' AND column_name='client_json'
      ) THEN
        ALTER TABLE public.orders ADD COLUMN client_json JSONB;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='orders' AND column_name='mp_preference_id'
      ) THEN
        ALTER TABLE public.orders ADD COLUMN mp_preference_id TEXT;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='orders' AND column_name='mp_init_point'
      ) THEN
        ALTER TABLE public.orders ADD COLUMN mp_init_point TEXT;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='orders' AND column_name='mp_payment_id'
      ) THEN
        ALTER TABLE public.orders ADD COLUMN mp_payment_id TEXT;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='orders' AND column_name='mp_payment_status'
      ) THEN
        ALTER TABLE public.orders ADD COLUMN mp_payment_status TEXT;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='orders' AND column_name='external_reference'
      ) THEN
        ALTER TABLE public.orders ADD COLUMN external_reference TEXT;
      END IF;
    END $$;
  `);

  // 3) trigger simples de updated_at (opcional, mas útil)
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
}

/**
 * ======================================================
 * HELPERS
 * ======================================================
 */

// Normaliza payload vindo do FRONT.
// Suporta dois formatos:
//  A) (legado) { title, price, email, ... }
//  B) (novo) { produto_id, cliente: { nome, email, ... }, ... }
function normalizeCheckoutPayload(body) {
  // Formato A (legado)
  if (body?.title && body?.price && body?.email) {
    return {
      title: String(body.title),
      price: Number(body.price),
      email: String(body.email),
      client: {
        name: body?.name ? String(body.name) : undefined,
        birthDate: body?.birthDate ? String(body.birthDate) : undefined,
        birthTime: body?.birthTime ? String(body.birthTime) : undefined,
        birthCity: body?.birthCity ? String(body.birthCity) : undefined,
      },
      raw: body,
    };
  }

  // Formato B (novo)
  if (body?.produto_id && body?.cliente?.email) {
    const title = body?.produto_nome
      ? String(body.produto_nome)
      : String(body.produto_id);

    const price = body?.price != null ? Number(body.price) : Number(body?.valor);

    return {
      title,
      price,
      email: String(body.cliente.email),
      client: {
        name: body?.cliente?.nome ? String(body.cliente.nome) : undefined,
        birthDate: body?.cliente?.data_nascimento
          ? String(body.cliente.data_nascimento)
          : body?.birthDate
          ? String(body.birthDate)
          : undefined,
        birthTime: body?.cliente?.hora_nascimento
          ? String(body.cliente.hora_nascimento)
          : body?.birthTime
          ? String(body.birthTime)
          : undefined,
        birthCity: body?.cliente?.cidade
          ? String(body.cliente.cidade)
          : body?.birthCity
          ? String(body.birthCity)
          : undefined,
      },
      raw: body,
    };
  }

  return null;
}

function isValidPrice(n) {
  return Number.isFinite(n) && n > 0;
}

/**
 * ======================================================
 * ROUTES
 * ======================================================
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
 * Checkout Handler único
 * - Salva no BD (orders)
 * - Cria preference MP (init_point)
 * - Retorna init_point p/ o front redirecionar
 */
async function checkoutHandler(req, res) {
  try {
    const normalized = normalizeCheckoutPayload(req.body);

    if (!normalized) {
      return res.status(400).json({
        status: "error",
        error: "Payload inválido",
        esperado: [
          { title: "string", price: "number", email: "string" },
          { produto_id: "string", cliente: { email: "string" } },
        ],
      });
    }

    const { title, price, email, client, raw } = normalized;

    if (!title || !email || !isValidPrice(price)) {
      return res.status(400).json({
        status: "error",
        error: "Campos obrigatórios ausentes ou inválidos",
        details: { title, price, email },
      });
    }

    // 1) cria order no BD (pending)
    // external_reference: usamos "order:<id>" para vincular no MP
    const insert = await pool.query(
      `
        INSERT INTO public.orders (title, price, email, status, client_json)
        VALUES ($1, $2, $3, 'pending', $4)
        RETURNING id;
      `,
      [title, price, email, client ? client : null]
    );

    const orderId = insert.rows[0].id;
    const external_reference = `order:${orderId}`;

    await pool.query(
      `UPDATE public.orders SET external_reference = $1 WHERE id = $2`,
      [external_reference, orderId]
    );

    // 2) cria pagamento no Mercado Pago
    // IMPORTANTe: mercadopago.js precisa usar MP_ACCESS_TOKEN internamente.
    // Incluímos external_reference para conseguir relacionar no webhook.
    const pagamento = await criarPagamento({
      title,
      price,
      email,
      orderId,
      external_reference,
      client,
      raw,
    });

    if (!pagamento?.init_point) {
      return res.status(500).json({
        status: "error",
        error: "Mercado Pago não retornou init_point",
        debug: pagamento || null,
      });
    }

    // 3) salva metadados da preference no BD (se houver)
    const mpPreferenceId = pagamento?.id || pagamento?.preference_id || null;

    await pool.query(
      `
        UPDATE public.orders
        SET mp_preference_id = $1,
            mp_init_point = $2
        WHERE id = $3
      `,
      [mpPreferenceId, pagamento.init_point, orderId]
    );

    // 4) retorna pro front redirecionar
    return res.json({
      status: "success",
      orderId,
      init_point: pagamento.init_point,
    });
  } catch (error) {
    console.error("Checkout error:", error?.response?.data || error?.message || error);
    return res.status(500).json({
      status: "error",
      error: error?.message || "Erro interno no checkout",
    });
  }
}

/**
 * Rotas compatíveis com o seu front e com seus testes
 */
app.post("/orders", checkoutHandler);
app.post("/checkout", checkoutHandler);

// Mantém a rota antiga do seu arquivo (se algum lugar ainda chamar)
app.post("/api/create-payment", checkoutHandler);

/**
 * ======================================================
 * WEBHOOK MERCADO PAGO
 * - MP notifica e envia { type: "payment", data: { id } }
 * - Aqui buscamos pagamento no MP, pegamos external_reference
 * - Atualizamos order e disparamos n8n (se configurado)
 * ======================================================
 */
app.post("/webhook/mercadopago", async (req, res) => {
  try {
    // MP pode enviar querystring também: ?type=payment&data.id=123
    const type = req.body?.type || req.query?.type;
    const dataId =
      req.body?.data?.id ||
      req.query?.["data.id"] ||
      req.query?.id ||
      null;

    // responde rápido para o MP não re-tentar por timeout
    res.status(200).send("OK");

    if (type !== "payment" || !dataId) {
      console.warn("Webhook ignorado: payload sem payment/data.id");
      return;
    }

    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!MP_ACCESS_TOKEN) {
      console.error("MP_ACCESS_TOKEN não configurado; não é possível consultar pagamento.");
      return;
    }

    // Busca detalhes do pagamento
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const payment = await mpRes.json();

    if (!mpRes.ok) {
      console.error("MP payment fetch erro:", mpRes.status, payment);
      return;
    }

    const payment_status = payment?.status || null;
    const external_reference = payment?.external_reference || null;

    if (!external_reference || !external_reference.startsWith("order:")) {
      console.error("Pagamento sem external_reference esperado:", external_reference);
      return;
    }

    const orderId = Number(external_reference.replace("order:", ""));
    if (!Number.isFinite(orderId)) {
      console.error("orderId inválido a partir de external_reference:", external_reference);
      return;
    }

    // Atualiza order com status do pagamento
    await pool.query(
      `
        UPDATE public.orders
        SET mp_payment_id = $1,
            mp_payment_status = $2,
            status = CASE
              WHEN $2 IN ('approved', 'authorized') THEN 'paid'
              WHEN $2 IN ('rejected', 'cancelled') THEN 'failed'
              ELSE status
            END
        WHERE id = $3
      `,
      [String(dataId), payment_status, orderId]
    );

    // Busca order + dados do cliente p/ n8n
    const orderRes = await pool.query(
      `SELECT id, title, price, email, status, client_json, mp_payment_id, mp_payment_status, created_at
       FROM public.orders WHERE id = $1 LIMIT 1`,
      [orderId]
    );

    const order = orderRes.rows?.[0];
    if (!order) {
      console.error("Order não encontrada para orderId:", orderId);
      return;
    }

    // Dispara n8n (se configurado)
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    if (N8N_WEBHOOK_URL) {
      const payloadN8n = {
        source: "mercadopago_webhook",
        order,
        payment,
      };

      const n8nRes = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadN8n),
      });

      if (!n8nRes.ok) {
        const txt = await n8nRes.text().catch(() => "");
        console.error("Falha ao enviar para n8n:", n8nRes.status, txt);
      }
    } else {
      console.warn("N8N_WEBHOOK_URL não configurado; webhook processado sem disparo ao n8n.");
    }
  } catch (e) {
    // webhook já respondeu 200, então só logamos
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
      console.log(`   Rotas: POST /orders | POST /checkout | POST /api/create-payment`);
      console.log(`   Webhook: POST /webhook/mercadopago`);
    });
  } catch (e) {
    console.error("❌ Falha ao iniciar:", e?.message || e);
    process.exit(1);
  }
})();
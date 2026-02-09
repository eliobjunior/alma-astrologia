// backend/db.js
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

/**
 * Helpers
 */
function boolFromEnv(v, def = false) {
  if (v === undefined || v === null || v === "") return def;
  return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
}

function strFromEnv(name, fallback = undefined) {
  const v = process.env[name];
  if (v === undefined || v === null || String(v).trim() === "") return fallback;
  return String(v);
}

function intFromEnv(name, fallback) {
  const v = strFromEnv(name, undefined);
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Config
 * - Prefer DATABASE_URL (ideal para produção)
 * - Caso não exista, usa DB_* (para compatibilidade)
 */
const DATABASE_URL = strFromEnv("DATABASE_URL", undefined);

const DB_HOST = strFromEnv("DB_HOST", undefined);
// Atenção: em container, localhost aponta pro próprio container.
// Então: se NÃO tiver DATABASE_URL e NÃO tiver DB_HOST, falha com mensagem clara.
const DB_PORT = intFromEnv("DB_PORT", 5432);
const DB_NAME = strFromEnv("DB_NAME", "alma_ramos");
const DB_USER = strFromEnv("DB_USER", "postgres");
const DB_PASSWORD = strFromEnv("DB_PASSWORD", "");
const DB_SSL = boolFromEnv(process.env.DB_SSL, false);

// Falha rápida (importante pra evitar “rodar quebrado” e ficar em loop)
if (!DATABASE_URL && (!DB_HOST || DB_HOST.trim() === "")) {
  throw new Error(
    "[db] DB_HOST não definido e DATABASE_URL ausente. " +
      "Em Docker, NÃO use localhost. Use DB_HOST=host.docker.internal (com extra_hosts) " +
      "ou forneça DATABASE_URL."
  );
}

/**
 * Pool
 */
export const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: DB_SSL ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
      ssl: DB_SSL ? { rejectUnauthorized: false } : false,
    });

/**
 * Ping simples (útil pra healthcheck/diagnóstico)
 */
export async function pingDb() {
  const r = await pool.query("select 1 as ok");
  return r?.rows?.[0]?.ok === 1;
}

/**
 * MIGRATION LIGHT (robusta)
 * - Cria tabela public.orders se não existir
 * - Garante colunas em tabela antiga
 * - Trigger updated_at
 * - Índices úteis
 */
export async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.orders (
      id BIGSERIAL PRIMARY KEY,

      -- campos clássicos (compat com versões antigas)
      title TEXT,
      price NUMERIC,

      nome TEXT,
      data_nascimento TEXT,
      hora_nascimento TEXT,
      cidade_nascimento TEXT,

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

      -- compat com rotas antigas que salvavam "payment_id"
      payment_id TEXT,

      n8n_sent_at TIMESTAMPTZ,
      n8n_status TEXT,
      n8n_last_error TEXT,

      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // garante colunas (caso a tabela exista antiga)
  await pool.query(`
    DO $$
    BEGIN
      -- title / price (se o banco antigo tem NOT NULL em title, o código já garante; aqui só cria se faltar)
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='title') THEN
        ALTER TABLE public.orders ADD COLUMN title TEXT;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='price') THEN
        ALTER TABLE public.orders ADD COLUMN price NUMERIC;
      END IF;

      -- dados do cliente (compat)
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='nome') THEN
        ALTER TABLE public.orders ADD COLUMN nome TEXT;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='data_nascimento') THEN
        ALTER TABLE public.orders ADD COLUMN data_nascimento TEXT;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='hora_nascimento') THEN
        ALTER TABLE public.orders ADD COLUMN hora_nascimento TEXT;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='cidade_nascimento') THEN
        ALTER TABLE public.orders ADD COLUMN cidade_nascimento TEXT;
      END IF;

      -- produto/pagamento
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='product_id') THEN
        ALTER TABLE public.orders ADD COLUMN product_id TEXT;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='product_title') THEN
        ALTER TABLE public.orders ADD COLUMN product_title TEXT;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='product_type') THEN
        ALTER TABLE public.orders ADD COLUMN product_type TEXT;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='amount_cents') THEN
        ALTER TABLE public.orders ADD COLUMN amount_cents INTEGER;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='currency') THEN
        ALTER TABLE public.orders ADD COLUMN currency TEXT DEFAULT 'BRL';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='email') THEN
        ALTER TABLE public.orders ADD COLUMN email TEXT;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='client_json') THEN
        ALTER TABLE public.orders ADD COLUMN client_json JSONB;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='status') THEN
        ALTER TABLE public.orders ADD COLUMN status TEXT NOT NULL DEFAULT 'created';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='external_reference') THEN
        ALTER TABLE public.orders ADD COLUMN external_reference TEXT;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='mp_preference_id') THEN
        ALTER TABLE public.orders ADD COLUMN mp_preference_id TEXT;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='mp_init_point') THEN
        ALTER TABLE public.orders ADD COLUMN mp_init_point TEXT;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='mp_payment_id') THEN
        ALTER TABLE public.orders ADD COLUMN mp_payment_id TEXT;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='mp_payment_status') THEN
        ALTER TABLE public.orders ADD COLUMN mp_payment_status TEXT;
      END IF;

      -- compat rota antiga: payment_id
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='payment_id') THEN
        ALTER TABLE public.orders ADD COLUMN payment_id TEXT;
      END IF;

      -- n8n
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='n8n_sent_at') THEN
        ALTER TABLE public.orders ADD COLUMN n8n_sent_at TIMESTAMPTZ;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='n8n_status') THEN
        ALTER TABLE public.orders ADD COLUMN n8n_status TEXT;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='n8n_last_error') THEN
        ALTER TABLE public.orders ADD COLUMN n8n_last_error TEXT;
      END IF;

      -- timestamps (caso tabela antiga não tenha)
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='created_at') THEN
        ALTER TABLE public.orders ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='updated_at') THEN
        ALTER TABLE public.orders ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      END IF;

    END $$;
  `);

  // Trigger updated_at
  await pool.query(`
    DO $$
    BEGIN
      CREATE OR REPLACE FUNCTION set_updated_at_orders()
      RETURNS trigger AS $fn$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $fn$ LANGUAGE plpgsql;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_orders') THEN
        CREATE TRIGGER trg_set_updated_at_orders
        BEFORE UPDATE ON public.orders
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at_orders();
      END IF;
    END $$;
  `);

  // Índices úteis
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_orders_external_reference ON public.orders(external_reference);`
  );
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(email);`);
}
// backend/db.js
import "dotenv/config";
import { Pool } from "pg";

export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || "alma_ramos",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
    });

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

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='n8n_sent_at') THEN
        ALTER TABLE public.orders ADD COLUMN n8n_sent_at TIMESTAMPTZ;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='n8n_status') THEN
        ALTER TABLE public.orders ADD COLUMN n8n_status TEXT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='n8n_last_error') THEN
        ALTER TABLE public.orders ADD COLUMN n8n_last_error TEXT;
      END IF;
    END $$;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at_orders') THEN
        CREATE OR REPLACE FUNCTION set_updated_at_orders()
        RETURNS trigger AS $fn$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $fn$ LANGUAGE plpgsql;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_orders') THEN
        CREATE TRIGGER trg_set_updated_at_orders
        BEFORE UPDATE ON public.orders
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at_orders();
      END IF;
    END $$;
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_external_reference ON public.orders(external_reference);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(email);`);
}
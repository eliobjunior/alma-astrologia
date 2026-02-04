// backend/pagamento.routes.js (ESM)
import express from "express";
import { pool } from "./db.js";
import { createPreference } from "./mercadopago.js";
import { PRODUCTS } from "./products.js";

const router = express.Router();

/**
 * POST /pagamento/criar
 * Body esperado (do frontend):
 * {
 *   produtoId,
 *   nome,
 *   email,
 *   dataNascimento, // dd/mm/aaaa
 *   horaNascimento, // HH:mm
 *   cidadeNascimento
 * }
 */
router.post("/pagamento/criar", async (req, res) => {
  try {
    const {
      produtoId,
      nome,
      email,
      dataNascimento,
      horaNascimento,
      cidadeNascimento,
    } = req.body || {};

    if (!produtoId || !nome || !email || !dataNascimento || !horaNascimento || !cidadeNascimento) {
      return res.status(400).json({
        error: "Campos obrigatórios ausentes",
        missing: {
          produtoId: !produtoId,
          nome: !nome,
          email: !email,
          dataNascimento: !dataNascimento,
          horaNascimento: !horaNascimento,
          cidadeNascimento: !cidadeNascimento,
        },
      });
    }

    const produto = PRODUCTS?.[produtoId];
    if (!produto) {
      return res.status(400).json({ error: "produtoId inválido", produtoId });
    }

    // 1) Cria order no banco
    const insert = await pool.query(
      `
      INSERT INTO public.orders
        (nome, email, data_nascimento, hora_nascimento, cidade_nascimento,
         product_id, status, created_at, updated_at)
      VALUES
        ($1, $2, $3, $4, $5,
         $6, 'payment_pending', now(), now())
      RETURNING id
      `,
      [nome, email, dataNascimento, horaNascimento, cidadeNascimento, produtoId]
    );

    const orderId = insert.rows?.[0]?.id;
    if (!orderId) throw new Error("Falha ao criar order no banco");

    // 2) Define external_reference no banco (padrão que você já usa)
    const externalReference = `order:${orderId}`;

    await pool.query(
      `
      UPDATE public.orders
      SET external_reference = $1, updated_at = now()
      WHERE id = $2
      `,
      [externalReference, orderId]
    );

    // 3) Cria pagamento no MP com external_reference idêntico ao banco
    const pref = await createPreference({
      orderId,
      produto,
      payerEmail: email,
      backUrls: {
        // se quiser, você pode apontar para seu domínio
        // success: "https://almaliraramos.com.br/obrigado",
        // failure: "https://almaliraramos.com.br/erro",
        // pending: "https://almaliraramos.com.br/pagamento-pendente",
      },
    });

    // 4) Salva referência do pagamento (aqui: preferenceId)
    await pool.query(
      `
      UPDATE public.orders
      SET payment_id = $1, updated_at = now()
      WHERE id = $2
      `,
      [pref.preferenceId || null, orderId]
    );

    return res.json({
      ok: true,
      orderId,
      external_reference: pref.external_reference,
      init_point: pref.init_point,
    });
  } catch (err) {
    console.error("[pagamento] erro:", err?.message || err);
    return res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

export default router;
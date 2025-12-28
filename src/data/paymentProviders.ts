// src/data/paymentProviders.ts

/**
 * Estrutura genérica de links de pagamento.
 * Agnóstica de gateway (atualmente Mercado Pago).
 * Permite troca futura sem refatorar componentes.
 */

export type PaymentLink = {
  avulso?: string;
  mensal?: string;
  semestral?: string;
  precoAvulso?: string;
  precoMensal?: string;
  precoSemestral?: string;
};

export const PAYMENT_PROVIDERS: Record<string, PaymentLink> = {
  // ─────────────────────────────
  // PRODUTOS AVULSOS
  // ─────────────────────────────

  "Sinastria Amorosa": {
    avulso: "https://mpago.la/2wXmuVh",
    precoAvulso: "R$ 19,00",
  },

  "Mapa Astral Personalizado": {
    avulso: "https://mpago.la/1Nw214R",
    precoAvulso: "R$ 14,00",
  },

  "Horóscopo Personalizado": {
    avulso: "https://mpago.la/2mZLA9c",
    precoAvulso: "R$ 14,00",
  },

  "Tarot Direto": {
    avulso: "https://mpago.la/1m4CVUU",
    precoAvulso: "R$ 14,00",
  },

  "Numerologia – Mapa do Ano": {
    avulso: "https://mpago.la/1ABpCGt",
    precoAvulso: "R$ 14,00",
  },

  "Mapa Infantil": {
    avulso: "https://mpago.la/1p6QHPx",
    precoAvulso: "R$ 14,00",
  },

  "Mapa Sexual": {
    avulso: "https://mpago.la/1FpDFcx",
    precoAvulso: "R$ 14,00",
  },

  "Tarot Mensal Premium": {
    avulso: "https://mpago.la/25cfApk",
    precoAvulso: "R$ 19,00",
  },

  "Mapa Profissional": {
    avulso: "https://mpago.la/31ppWN3",
    precoAvulso: "R$ 19,00",
  },

  "Diagnóstico do Amor": {
    avulso: "https://mpago.la/12LAHQK",
    precoAvulso: "R$ 7,00",
  },

  "Missão de Vida 2026": {
    avulso: "https://mpago.la/2jh4bmN",
    precoAvulso: "R$ 12,00",
  },

  "Seu Ano em 3 Palavras": {
    avulso: "https://mpago.la/2apjLgx",
    precoAvulso: "R$ 5,00",
  },

  "Análise Secreta do Seu Signo": {
    avulso: "https://mpago.la/2jLqcjz",
    precoAvulso: "R$ 7,00",
  },

  // ─────────────────────────────
  // PLANOS / ASSINATURAS
  // ─────────────────────────────

  "Plano Total Mensal": {
    mensal:
      "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=cae38c4aa0934b819d5b0dedfbd8fa43",
    precoMensal: "R$ 29,00/mês",
  },

  // ⚠️ ATENÇÃO:
  // Manter exatamente o hífen longo (–) no nome da chave
  "Clube Alma Ramos – Completo": {
    semestral: "https://mpago.la/2fgiUGu",
    precoSemestral: "R$ 129,00 a cada 6 meses",
  },

  "Terapia de Bem-Estar com I.A": {
    semestral: "https://mpago.la/25inWJZ",
    precoSemestral: "R$ 114,00 a cada 6 meses",
  },
};
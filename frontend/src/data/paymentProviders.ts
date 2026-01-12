// src/data/paymentProviders.ts

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
  // PRODUTOS AVULSOS (15 ATIVOS)
  // ─────────────────────────────

  mapa_astral_personalizado: {
    avulso: "https://mpago.la/1Nw214R",
    precoAvulso: "R$ 14,00",
  },

  mapa_profissional: {
    avulso: "https://mpago.la/31ppWN3",
    precoAvulso: "R$ 19,00",
  },

  horoscopo_personalizado: {
    avulso: "https://mpago.la/2mZLA9c",
    precoAvulso: "R$ 14,00",
  },

  tarot_direto: {
    avulso: "https://mpago.la/1m4CVUU",
    precoAvulso: "R$ 14,00",
  },

  numerologia_mapa_ano: {
    avulso: "https://mpago.la/1ABpCGt",
    precoAvulso: "R$ 14,00",
  },

  mapa_infantil: {
    avulso: "https://mpago.la/1p6QHPx",
    precoAvulso: "R$ 14,00",
  },

  sinastria_amorosa: {
    avulso: "https://mpago.la/2wXmuVh",
    precoAvulso: "R$ 19,00",
  },

  mapa_sexual: {
    avulso: "https://mpago.la/1FpDFcx",
    precoAvulso: "R$ 14,00",
  },

  diagnostico_amor: {
    avulso: "https://mpago.la/12LAHQK",
    precoAvulso: "R$ 7,00",
  },

  analise_secreta_signo: {
    avulso: "https://mpago.la/2jLqcjz",
    precoAvulso: "R$ 7,00",
  },

  seu_ano_3_palavras: {
    avulso: "https://mpago.la/2apjLgx",
    precoAvulso: "R$ 5,00",
  },

  missao_vida_2026: {
    avulso: "https://mpago.la/2jh4bmN",
    precoAvulso: "R$ 12,00",
  },

  tarot_mensal_premium: {
    avulso: "https://mpago.la/25cfApk",
    precoAvulso: "R$ 19,00",
  },

  // ─────────────────────────────
  // PLANOS / ASSINATURAS
  // ─────────────────────────────

  plano_total_mensal: {
    mensal:
      "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=cae38c4aa0934b819d5b0dedfbd8fa43",
    precoMensal: "R$ 29,00/mês",
  },

  clube_alma_ramos: {
    semestral: "https://mpago.la/2fgiUGu",
    precoSemestral: "R$ 129,00 a cada 6 meses",
  },

  terapia_bem_estar: {
    semestral: "https://mpago.la/25inWJZ",
    precoSemestral: "R$ 114,00 a cada 6 meses",
  },
};
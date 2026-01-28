// backend/products.js
export const PRODUCTS = {
  // ─────────────────────────────
  // PRODUTOS AVULSOS
  // ─────────────────────────────

  mapa_astral_personalizado: {
    titulo: "Mapa Astral Personalizado",
    tipo: "avulso",
    status: "ativo",
    preco_cents: 1400,
    payment: {
      avulso: "https://mpago.la/1Nw214R",
      precoAvulso: "R$ 14,00",
    },
  },

  mapa_profissional: {
    titulo: "Mapa Profissional",
    tipo: "avulso",
    status: "ativo",
    preco_cents: 1900,
    payment: {
      avulso: "https://mpago.la/31ppWN3",
      precoAvulso: "R$ 19,00",
    },
  },

  horoscopo_personalizado: {
    titulo: "Horóscopo Personalizado",
    tipo: "avulso",
    status: "ativo",
    preco_cents: 1400,
    payment: {
      avulso: "https://mpago.la/2mZLA9c",
      precoAvulso: "R$ 14,00",
    },
  },

  tarot_direto: {
    titulo: "Tarot Direto",
    tipo: "avulso",
    status: "ativo",
    preco_cents: 1400,
    payment: {
      avulso: "https://mpago.la/1m4CVUU",
      precoAvulso: "R$ 14,00",
    },
  },

  numerologia_mapa_ano: {
    titulo: "Numerologia – Mapa do Ano",
    tipo: "avulso",
    status: "ativo",
    preco_cents: 1400,
    payment: {
      avulso: "https://mpago.la/1ABpCGt",
      precoAvulso: "R$ 14,00",
    },
  },

  mapa_infantil: {
    titulo: "Mapa Infantil",
    tipo: "avulso",
    status: "ativo",
    preco_cents: 1400,
    payment: {
      avulso: "https://mpago.la/1p6QHPx",
      precoAvulso: "R$ 14,00",
    },
  },

  sinastria_amorosa: {
    titulo: "Sinastria Amorosa",
    tipo: "avulso",
    status: "ativo",
    preco_cents: 1900,
    payment: {
      avulso: "https://mpago.la/2wXmuVh",
      precoAvulso: "R$ 19,00",
    },
  },

  mapa_sexual: {
    titulo: "Mapa Sexual",
    tipo: "avulso",
    status: "ativo",
    preco_cents: 1400,
    payment: {
      avulso: "https://mpago.la/1FpDFcx",
      precoAvulso: "R$ 14,00",
    },
  },

  diagnostico_amor: {
    titulo: "Diagnóstico do Amor",
    tipo: "avulso",
    status: "ativo",
    preco_cents: 700,
    payment: {
      avulso: "https://mpago.la/12LAHQK",
      precoAvulso: "R$ 7,00",
    },
  },

  analise_secreta_signo: {
    titulo: "Análise Secreta do Seu Signo",
    tipo: "avulso",
    status: "ativo",
    preco_cents: 700,
    payment: {
      avulso: "https://mpago.la/2jLqcjz",
      precoAvulso: "R$ 7,00",
    },
  },

  seu_ano_3_palavras: {
    titulo: "Seu Ano em 3 Palavras",
    tipo: "avulso",
    status: "ativo",
    preco_cents: 500,
    payment: {
      avulso: "https://mpago.la/2apjLgx",
      precoAvulso: "R$ 5,00",
    },
  },

  // alias que já apareceu nos seus testes
  seu_ano_em_3_palavras: {
    titulo: "Seu Ano em 3 Palavras",
    tipo: "avulso",
    status: "ativo",
    preco_cents: 500,
    payment: {
      avulso: "https://mpago.la/2apjLgx",
      precoAvulso: "R$ 5,00",
    },
  },

  missao_vida_2026: {
    titulo: "Missão de Vida 2026",
    tipo: "avulso",
    status: "ativo",
    preco_cents: 1200,
    payment: {
      avulso: "https://mpago.la/2jh4bmN",
      precoAvulso: "R$ 12,00",
    },
  },

  tarot_mensal_premium: {
    titulo: "Tarot Mensal Premium",
    tipo: "avulso",
    status: "ativo",
    preco_cents: 1900,
    payment: {
      avulso: "https://mpago.la/25cfApk",
      precoAvulso: "R$ 19,00",
    },
  },

  // ─────────────────────────────
  // PLANOS / ASSINATURAS
  // Observação:
  // - Para "mensal" via preapproval_plan, o webhook é diferente (preapproval).
  // - Neste backend, ainda tratamos pagamento como preference (pagamento único),
  //   mas os preços estão aqui para você decidir como quer fazer.
  // ─────────────────────────────

  plano_total_mensal: {
    titulo: "Plano Total Mensal",
    tipo: "mensal",
    status: "ativo",
    preco_cents: 2900,
    payment: {
      mensal:
        "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=cae38c4aa0934b819d5b0dedfbd8fa43",
      precoMensal: "R$ 29,00/mês",
    },
  },

  clube_alma_ramos: {
    titulo: "Clube Alma Ramos – Completo",
    tipo: "semestral",
    status: "ativo",
    preco_cents: 12900,
    payment: {
      semestral: "https://mpago.la/2fgiUGu",
      precoSemestral: "R$ 129,00 a cada 6 meses",
    },
  },

  terapia_bem_estar: {
    titulo: "Terapia de Bem-Estar com I.A",
    tipo: "semestral",
    status: "inativo",
    preco_cents: 11400,
    payment: {
      semestral: "https://mpago.la/25inWJZ",
      precoSemestral: "R$ 114,00 a cada 6 meses",
    },
  },
};
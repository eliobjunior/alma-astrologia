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

  // ✅ ID OFICIAL
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

// ✅ Aliases consolidados (compatibilidade com ids antigos do front)
const ALIAS_MAP = {
  // oficial
  seu_ano_em_3_palavras: "seu_ano_em_3_palavras",

  // ✅ compat: seu_ano_3_palavras (sem "em") -> oficial
  seu_ano_3_palavras: "seu_ano_em_3_palavras",

  numerologia_mapa_do_ano: "numerologia_mapa_ano",
  diagnostico_do_amor: "diagnostico_amor",
  analise_secreta_do_signo: "analise_secreta_signo",
  missao_de_vida_2026: "missao_vida_2026",
};

export function resolveProductId(produtoId) {
  if (!produtoId) return null;

  const raw = String(produtoId).trim();

  // normaliza alguns formatos comuns
  const id = raw
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .toLowerCase();

  if (PRODUCTS[id]) return id;

  const aliased = ALIAS_MAP[id];
  if (aliased && PRODUCTS[aliased]) return aliased;

  return id; // devolve normalizado (ajuda debug)
}

export function getProduct(produtoId) {
  const resolved = resolveProductId(produtoId);
  if (!resolved) return null;
  return PRODUCTS[resolved] || null;
}

export function isActiveProduct(produto) {
  return !!produto && produto.status === "ativo";
}

// string/formatado pro front (usado só para exibição)
export function priceFromCents(preco_cents) {
  if (typeof preco_cents !== "number" || preco_cents <= 0) return null;
  return (preco_cents / 100).toFixed(2);
}
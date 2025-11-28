// src/data/stripeLinks.ts

export npm install sharp
const STRIPE_LINKS: Record<
  string,
  {
    avulso?: string;
    mensal?: string;
    semestral?: string;
  }
> = {
  // 🔮 Produtos virais
  "Análise Secreta do Seu Signo": {
    avulso: "https://buy.stripe.com/dRmdRb2Os03v1u8euR2cg0c",
  },

  "Seu Ano em 3 Palavras": {
    avulso: "https://buy.stripe.com/4gM6oJ1Ko4jLb4IaeB2cg0d",
  },

  "Missão de Vida 2026": {
    avulso: "https://buy.stripe.com/9B67sN3SwcQh3CgfyV2cg0e",
  },

  "Diagnóstico do Amor": {
    avulso: "https://buy.stripe.com/bJe00l88M9E5fkYeuR2cg0f",
  },

  // 💎 Assinaturas
  "Clube Alma Ramos - O mais completo": {
    semestral: "https://buy.stripe.com/5kQ8wRexa17z3CgbiF2cg0g",
  },

  "Plano Total Mensal": {
    mensal: "https://buy.stripe.com/7sY8wR2OsbMdfkY4Uh2cg0h",
  },

  // Agora "Total Mensal Premium" também aponta para o Plano Total Mensal
  "Plano Total Mensal Premium": {
    mensal: "https://buy.stripe.com/cNibJ34WAaI93Cg2M92cg0k",
  },

  "Tarot Mensal Premium": {
    mensal: "https://buy.stripe.com/cNibJ34WAaI93Cg2M92cg0k",
  },

  // 🌙 Mapas
  "Mapa Profissional": {
    avulso: "https://buy.stripe.com/9B6bJ34WAcQh8WA86t2cg0i",
  },

  "Sinastria Amorosa": {
    avulso: "https://buy.stripe.com/28E00l2OseYp2yc72p2cg0j",
  },

  "Mapa Sexual": {
    avulso: "https://buy.stripe.com/eVq3cxdt62bD5Ko86t2cg0l",
  },

  "Mapa Infantil": {
    avulso: "https://buy.stripe.com/fZu3cxgFi17zfkYeuR2cg0m",
  },

  "Numerologia - Mapa do Ano": {
    avulso: "https://buy.stripe.com/8x2dRb9cQeYpdcQ9ax2cg0n",
  },

  "Tarot Direto": {
    avulso: "https://buy.stripe.com/14A5kF88McQhegUbiF2cg0o",
  },

  "Horóscopo Personalizado": {
    avulso: "https://buy.stripe.com/aFa6oJcp28A1dcQdqN2cg0p",
  },

  "Mapa Astral Personalizado": {
    avulso: "https://buy.stripe.com/28E6oJ88M5nP5Ko0E12cg0q",
  },

  // 🧘 Terapia / bem-estar
  "Terapia de Bem-Estar com I.A": {
    semestral: "https://buy.stripe.com/8x28wRdt64jLdcQ86t2cg0r",
  },
};
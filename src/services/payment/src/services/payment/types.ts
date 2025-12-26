// src/services/payment/types.ts

export type ProductCode =
  | 'CLUBE_ALMA_RAMOS'
  | 'ANALISE_SIGNO'
  | 'ANO_3_PALAVRAS'
  | 'MISSAO_VIDA_2026'
  | 'DIAGNOSTICO_AMOR'
  | 'MAPA_PROFISSIONAL'
  | 'TAROT_MENSAL'
  | 'MAPA_SEXUAL'
  | 'MAPA_INFANTIL'
  | 'NUMEROLOGIA_ANO'
  | 'TAROT_DIRETO'
  | 'HOROSCOPO_PERSONALIZADO'
  | 'MAPA_ASTRAL'
  | 'SINASTRIA'
  | 'TERAPIA_IA_6M'
  | 'PLANO_TOTAL_MENSAL';

export interface PaymentGateway {
  getCheckoutUrl(product: ProductCode): string;
}
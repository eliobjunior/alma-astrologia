// src/services/payment/mercadopago.ts

import { PaymentGateway, ProductCode } from './types';

const MERCADO_PAGO_LINKS: Record<ProductCode, string> = {
  CLUBE_ALMA_RAMOS: 'https://mpago.la/2fgiUGu',
  ANALISE_SIGNO: 'https://mpago.la/2jLqcjz',
  ANO_3_PALAVRAS: 'https://mpago.la/2apjLgx',
  MISSAO_VIDA_2026: 'https://mpago.la/2jh4bmN',

  DIAGNOSTICO_AMOR: 'https://mpago.la/12LAHQK',
  MAPA_PROFISSIONAL: 'https://mpago.la/31ppWN3',
  TAROT_MENSAL: 'https://mpago.la/25cfApk',
  MAPA_SEXUAL: 'https://mpago.la/1FpDFcx',
  MAPA_INFANTIL: 'https://mpago.la/1p6QHPx',
  NUMEROLOGIA_ANO: 'https://mpago.la/1ABpCGt',
  TAROT_DIRETO: 'https://mpago.la/1m4CVUU',
  HOROSCOPO_PERSONALIZADO: 'https://mpago.la/2mZLA9c',
  MAPA_ASTRAL: 'https://mpago.la/1Nw214R',
  SINASTRIA: 'https://mpago.la/2wXmuVh',

  TERAPIA_IA_6M: 'https://mpago.la/25inWJZ',

  PLANO_TOTAL_MENSAL:
    'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=cae38c4aa0934b819d5b0dedfbd8fa43',
};

export const MercadoPagoGateway: PaymentGateway = {
  getCheckoutUrl(product: ProductCode) {
    const url = MERCADO_PAGO_LINKS[product];
    if (!url) {
      throw new Error(`Produto não configurado no Mercado Pago: ${product}`);
    }
    return url;
  },
};
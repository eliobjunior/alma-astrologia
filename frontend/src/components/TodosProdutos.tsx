import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/Images/images";
import { PAYMENT_PROVIDERS } from "@/data/paymentProviders";
import { FormDadosCliente } from "@/components/FormDadosCliente";

type Produto = {
  titulo: string;
  produtoId: string; // 🔑 CHAVE TÉCNICA
  descricao: string;
  imagem: string;
  emBreve?: boolean;
};

export function TodosProdutos() {
  const [produtoSelecionado, setProdutoSelecionado] = useState<string | null>(null);

  const produtos: Produto[] = [
    {
      titulo: "Mapa Astral Personalizado",
      produtoId: "mapa_astral_personalizado",
      descricao: "Seu mapa completo revelando potenciais e missão de alma.",
      imagem: IMAGES.mapaAstral,
    },
    {
      titulo: "Mapa Profissional",
      produtoId: "mapa_profissional",
      descricao: "Indicado para quem busca propósito e carreira.",
      imagem: IMAGES.mapaProfissional,
    },
    {
      titulo: "Horóscopo Personalizado",
      produtoId: "horoscopo_personalizado",
      descricao: "Seu horóscopo completo e personalizado para sua jornada.",
      imagem: IMAGES.horoscopoPersonalizado,
    },
    {
      titulo: "Plano Total Mensal",
      produtoId: "plano_total_mensal",
      descricao: "Acesso ilimitado mensal às leituras e ferramentas.",
      imagem: IMAGES.planoTotalMensal,
    },
    {
      titulo: "Tarot Direto",
      produtoId: "tarot_direto",
      descricao: "Uma resposta clara e direta do Tarot para a sua vida.",
      imagem: IMAGES.tarotDireto,
    },
    {
      titulo: "Clube Alma Ramos – Completo",
      produtoId: "clube_alma_ramos",
      descricao: "Pode utilizar todos os produtos avulso, uma vez por mês.",
      imagem: IMAGES.clubeAlmaRamos,
    },
    {
      titulo: "Numerologia – Mapa do Ano",
      produtoId: "numerologia_mapa_ano",
      descricao: "A vibração numerológica que irá guiar seu ano.",
      imagem: IMAGES.numerologiaAno,
    },
    {
      titulo: "Mapa Infantil",
      produtoId: "mapa_infantil",
      descricao: "Compreenda talentos, desafios e perfil de cada criança.",
      imagem: IMAGES.mapaInfantil,
    },
    {
      titulo: "Sinastria Amorosa",
      produtoId: "sinastria_amorosa",
      descricao: "Compatibilidade energética entre você e outra pessoa.",
      imagem: IMAGES.sinastriaAmorosa,
    },
    {
      titulo: "Mapa Sexual",
      produtoId: "mapa_sexual",
      descricao: "Entenda sua energia sexual e sua influência nos relacionamentos.",
      imagem: IMAGES.mapaSexual,
    },
    {
      titulo: "Diagnóstico do Amor",
      produtoId: "diagnostico_amor",
      descricao: "Descubra como sua energia afetiva está atuando.",
      imagem: IMAGES.diagnosticoAmor,
    },
    {
      titulo: "Análise Secreta do Seu Signo",
      produtoId: "analise_secreta_signo",
      descricao: "Revelações profundas sobre sua energia única.",
      imagem: IMAGES.analiseSecreta,
    },
    {
      titulo: "Seu Ano em 3 Palavras",
      produtoId: "seu_ano_3_palavras",
      descricao: "Os três pilares que vão guiar seu próximo ano.",
      imagem: IMAGES.seuAno3Palavras,
    },
    {
      titulo: "Missão de Vida 2026",
      produtoId: "missao_vida_2026",
      descricao: "Entenda seu propósito para 2026 com clareza espiritual.",
      imagem: IMAGES.missaoVida2026,
    },
    {
      titulo: "Tarot Mensal Premium",
      produtoId: "tarot_mensal_premium",
      descricao: "Previsões profundas para cada área do seu mês.",
      imagem: IMAGES.tarotMensalDireto,
    },
    {
      titulo: "Terapia de Bem-Estar com I.A",
      produtoId: "terapia_bem_estar",
      descricao: "Sessões profundas assistidas por inteligência artificial.",
      imagem: IMAGES.terapiaLeve,
      emBreve: true,
    },
  ];

  return (
    <section className="px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">
        🔮 Todos os Produtos
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {produtos.map((produto) => {
          const payment = PAYMENT_PROVIDERS[produto.produtoId];

          const preco =
            payment?.precoAvulso ||
            payment?.precoMensal ||
            payment?.precoSemestral ||
            "";

          const isPlano = ["plano_total_mensal", "clube_alma_ramos", "terapia_bem_estar"].includes(
            produto.produtoId
          );

          return (
            <div key={produto.produtoId} className="h-[420px] flex flex-col bg-[#0A0A1A] border border-[#1f1f2e] rounded-2xl">
              <div className="h-[210px] flex items-center justify-center">
                <img src={produto.imagem} alt={produto.titulo} className="object-contain h-full w-full" />
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h2 className="text-lg font-semibold text-white">{produto.titulo}</h2>
                <p className="text-sm text-gray-300 mb-4">{produto.descricao}</p>

                <Button
                  disabled={produto.emBreve}
                  onClick={() => setProdutoSelecionado(produto.produtoId)}
                  className="mt-auto w-full rounded-full bg-yellow-400 text-black"
                >
                  {produto.emBreve
                    ? "Em breve"
                    : isPlano
                    ? `Assinar — ${preco}`
                    : `Comprar Avulso — ${preco}`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {produtoSelecionado && (
        <FormDadosCliente
          produtoId={produtoSelecionado}
          onClose={() => setProdutoSelecionado(null)}
        />
      )}
    </section>
  );
}
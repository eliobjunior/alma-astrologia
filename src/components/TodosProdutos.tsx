import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/Images/images";
import { PAYMENT_PROVIDERS } from "@/data/paymentProviders";

export function TodosProdutos() {
  const produtos = [
    {
      titulo: "Mapa Astral Personalizado",
      descricao: "Seu mapa completo revelando potenciais e missão de alma.",
      imagem: IMAGES.mapaAstral,
    },
    {
      titulo: "Mapa Profissional",
      descricao: "Indicado para quem busca propósito e carreira.",
      imagem: IMAGES.mapaProfissional,
    },
    {
      titulo: "Horóscopo Personalizado",
      descricao: "Seu horóscopo completo e personalizado para sua jornada.",
      imagem: IMAGES.horoscopoPersonalizado,
    },
    {
      titulo: "Plano Total Mensal",
      descricao: "Acesso ilimitado mensal às leituras e ferramentas.",
      imagem: IMAGES.planoTotalMensal,
    },
    {
      titulo: "Tarot Direto",
      descricao: "Uma resposta clara e direta do Tarot para a sua vida.",
      imagem: IMAGES.tarotDireto,
    },
    {
      titulo: "Clube Alma Ramos – Completo",
      descricao: "Pode utilizar todos os produtos avulso, uma vez por mês.",
      imagem: IMAGES.clubeAlmaRamos,
    },
    {
      titulo: "Numerologia – Mapa do Ano",
      descricao: "A vibração numerológica que irá guiar seu ano.",
      imagem: IMAGES.numerologiaAno,
    },
    {
      titulo: "Mapa Infantil",
      descricao: "Compreenda talentos, desafios e perfil de cada criança.",
      imagem: IMAGES.mapaInfantil,
    },
    {
      titulo: "Sinastria Amorosa",
      descricao: "Compatibilidade energética entre você e outra pessoa.",
      imagem: IMAGES.sinastriaAmorosa,
    },
    {
      titulo: "Mapa Sexual",
      descricao: "Entenda sua energia sexual e sua influência nos relacionamentos.",
      imagem: IMAGES.mapaSexual,
    },
    {
      titulo: "Diagnóstico do Amor",
      descricao: "Descubra como sua energia afetiva está atuando.",
      imagem: IMAGES.diagnosticoAmor,
    },
    {
      titulo: "Análise Secreta do Seu Signo",
      descricao: "Revelações profundas sobre sua energia única.",
      imagem: IMAGES.analiseSecreta,
    },
    {
      titulo: "Seu Ano em 3 Palavras",
      descricao: "Os três pilares que vão guiar seu próximo ano.",
      imagem: IMAGES.seuAno3Palavras,
    },
    {
      titulo: "Missão de Vida 2026",
      descricao: "Entenda seu propósito para 2026 com clareza espiritual.",
      imagem: IMAGES.missaoVida2026,
    },
    {
      titulo: "Tarot Mensal Premium",
      descricao: "Previsões profundas para cada área do seu mês.",
      imagem: IMAGES.tarotMensalDireto,
    },

    // 🔒 PRODUTO DESATIVADO — SEM LINK / SEM PAGAMENTO
    {
      titulo: "Terapia de Bem-Estar com I.A",
      descricao: "Sessões profundas assistidas por inteligência artificial.",
      imagem: IMAGES.terapiaLeve,
      emBreve: true,
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">
        🔮 Todos os Produtos
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {produtos.map((produto) => {
          const payment = PAYMENT_PROVIDERS[produto.titulo];

          const preco =
            payment?.precoAvulso ||
            payment?.precoMensal ||
            payment?.precoSemestral ||
            "";

          const url =
            payment?.avulso ||
            payment?.mensal ||
            payment?.semestral ||
            "#";

          const isEmBreve = produto.emBreve === true;

          return (
            <Card
              key={produto.titulo}
              className="bg-[#0A0A1A] text-white border border-[#222] shadow-md hover:scale-[1.02] transition"
            >
              <div className="h-56 w-full flex items-center justify-center bg-gradient-to-b from-[#0f1025] to-[#05040D] rounded-t-lg overflow-hidden">
                <img
                  src={produto.imagem}
                  alt={produto.titulo}
                  className="w-full h-full object-contain"
                />
              </div>

              <CardContent className="p-4">
                <h2 className="text-lg font-bold mb-2">
                  {produto.titulo}
                </h2>

                <p className="text-sm text-gray-300 mb-4">
                  {produto.descricao}
                </p>

                <Button
                  disabled={isEmBreve}
                  onClick={() => {
                    if (!isEmBreve) {
                      window.open(url, "_blank");
                    }
                  }}
                  className={`w-full font-semibold ${
                    isEmBreve
                      ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                      : "bg-yellow-400 text-black hover:bg-yellow-300"
                  }`}
                >
                  {isEmBreve
                    ? "Em breve"
                    : ["Plano Total Mensal", "Clube Alma Ramos – Completo"].includes(
                        produto.titulo
                      )
                    ? `Assinar — ${preco}`
                    : preco
                    ? `Comprar Avulso — ${preco}`
                    : "Comprar"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
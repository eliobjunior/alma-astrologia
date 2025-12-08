import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/Images/images";
import { STRIPE_LINKS } from "@/data/stripeLinks";

export function TodosProdutos() {
  const produtos = [
    // 🧘 1. Terapia
    {
      titulo: "Terapia de Bem-Estar com I.A",
      descricao: "Sessões profundas assistidas por inteligência artificial.",
      imagem: IMAGES.terapiaLeve,
    },

    // 🌙 2. Mapa Astral
    {
      titulo: "Mapa Astral Personalizado",
      descricao: "Seu mapa completo revelando potenciais e missão de alma.",
      imagem: IMAGES.mapaAstral,
    },

    // 💼 3. Mapa Profissional
    {
      titulo: "Mapa Profissional",
      descricao: "Indicado para quem busca propósito e carreira.",
      imagem: IMAGES.mapaProfissional,
    },

    // 🌟 4. Horóscopo Personalizado
    {
      titulo: "Horóscopo Personalizado",
      descricao: "Seu horóscopo completo e personalizado para sua jornada.",
      imagem: IMAGES.horoscopoPersonalizado,
    },

    // ⭐ 5. Plano Total Mensal
    {
      titulo: "Plano Total Mensal",
      descricao: "Acesso ilimitado mensal às leituras e ferramentas.",
      imagem: IMAGES.planoTotalMensal,
    },

    // 🔮 6. Tarot Direto
    {
      titulo: "Tarot Direto",
      descricao: "Uma resposta clara e direta do Tarot para a sua vida.",
      imagem: IMAGES.tarotDireto,
    },

    // 🌟 7. Clube Alma Ramos
    {
      titulo: "Clube Alma Ramos – Completo",
      descricao: "Pode utilizar todos os produtos avulso, uma vez por mês.",
      imagem: IMAGES.clubeAlmaRamos,
    },

    // 🔢 8. Numerologia – Mapa do Ano
    {
      titulo: "Numerologia – Mapa do Ano",
      descricao: "A vibração numerológica que irá guiar seu ano.",
      imagem: IMAGES.numerologiaAno,
    },

    // 👶 9. Mapa Infantil
    {
      titulo: "Mapa Infantil",
      descricao: "Compreenda talentos, desafios e perfil de cada criança.",
      imagem: IMAGES.mapaInfantil,
    },

    // ❤️ 10. Sinastria Amorosa
    {
      titulo: "Sinastria Amorosa",
      descricao: "Compatibilidade energética entre você e outra pessoa.",
      imagem: IMAGES.sinastriaAmorosa,
    },

    // 🔥 11. Mapa Sexual
    {
      titulo: "Mapa Sexual",
      descricao: "Entenda sua energia sexual e sua influência nos relacionamentos.",
      imagem: IMAGES.mapaSexual,
    },

    // 💗 12. Diagnóstico do Amor
    {
      titulo: "Diagnóstico do Amor",
      descricao: "Descubra como sua energia afetiva está atuando.",
      imagem: IMAGES.diagnosticoAmor,
    },

    // ✨ 13. Análise Secreta
    {
      titulo: "Análise Secreta do Seu Signo",
      descricao: "Revelações profundas sobre sua energia única.",
      imagem: IMAGES.analiseSecreta,
    },

    // ✍️ 14. Seu Ano em 3 Palavras
    {
      titulo: "Seu Ano em 3 Palavras",
      descricao: "Os três pilares que vão guiar seu próximo ano.",
      imagem: IMAGES.seuAno3Palavras,
    },

    // 🎯 15. Missão de Vida 2026
    {
      titulo: "Missão de Vida 2026",
      descricao: "Entenda seu propósito para 2026 com clareza espiritual.",
      imagem: IMAGES.missaoVida2026,
    },

    // 🗓 16. Tarot Mensal Premium
    {
      titulo: "Tarot Mensal Premium",
      descricao: "Previsões profundas para cada área do seu mês.",
      imagem: IMAGES.tarotMensalDireto,
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">🔮 Todos os Produtos</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {produtos.map((p) => {
          const stripe = STRIPE_LINKS[p.titulo];

          const preco =
            stripe?.precoAvulso ||
            stripe?.precoMensal ||
            stripe?.precoSemestral ||
            "";

          const url =
            stripe?.avulso ||
            stripe?.mensal ||
            stripe?.semestral ||
            "#";

          return (
            <Card
              key={p.titulo}
              className="bg-[#0A0A1A] text-white border border-[#222] shadow-md hover:scale-[1.02] transition"
            >
              <img
                src={p.imagem}
                alt={p.titulo}
                className="rounded-t-lg object-cover w-full h-56"
              />

              <CardContent className="p-4">
                <h2 className="text-lg font-bold mb-2">{p.titulo}</h2>
                <p className="text-sm text-gray-300 mb-4">{p.descricao}</p>

<Button
  onClick={() => window.open(url, "_blank")}
  className="w-full bg-yellow-400 text-black font-semibold hover:bg-yellow-300"
>

  {[
    "Terapia de Bem-Estar com I.A",
    "Clube Alma Ramos — Completo",
    "Plano Total Mensal"
  ].includes(p.titulo)
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
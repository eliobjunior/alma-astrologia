import React from "react";
import { ProductCard } from "@/components/ProductCard";

export default function IndexPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-12">

      {/* ⭐ PRODUTOS VIRAIS */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-primary">
          🔥 Produtos Virais
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductCard
            title="Análise Secreta do Seu Signo"
            description="Descubra revelações profundas sobre sua energia única e como ela afeta seus relacionamentos e futuro."
            price=""
          />
          <ProductCard
            title="Seu Ano em 3 Palavras"
            description="Receba uma leitura certeira que resume o ano de 2026 em apenas três palavras-chave poderosas."
            price=""
          />
          <ProductCard
            title="Missão de Vida 2026"
            description="Revele o propósito central do seu ano e saiba como se alinhar à sua jornada pessoal."
            price=""
          />
          <ProductCard
            title="Diagnóstico do Amor"
            description="Entenda sua energia amorosa e receba um diagnóstico claro sobre sua vida afetiva."
            price=""
          />
        </div>
      </section>

      {/* 💎 ASSINATURAS PRINCIPAIS */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-primary">
          💎 Assinaturas Premium
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductCard
            title="Clube Alma Ramos"
            description="Tenha tudo em um só lugar por 6 meses: mapas, análises, previsões, terapia leve e muito mais."
            price=""
          />

          <ProductCard
            title="Plano Total Mensal"
            description="Acesso mensal completo a previsões, ferramentas astrológicas e relatórios personalizados."
            price=""
          />

          <ProductCard
            title="Tarot Mensal Premium"
            description="Versão premium com benefícios extras e análises mais profundas."
            price=""
          />
        </div>
      </section>

      {/* 🌙 MAPAS ASTROLÓGICOS */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-primary">
          🌙 Mapas Astrológicos
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          <ProductCard
            title="Mapa Astral Personalizado"
            description="Entenda quem você realmente é com um mapa completo e detalhado."
          />

          <ProductCard
            title="Mapa Profissional"
            description="Descubra talentos, habilidades e o caminho ideal para sua carreira."
          />

          <ProductCard
            title="Mapa Infantil"
            description="Compreenda a personalidade da criança e como guiá-la com mais leveza."
          />

          <ProductCard
            title="Mapa Sexual"
            description="Aprenda sobre seus desejos, compatibilidades e energia íntima."
          />

          <ProductCard
            title="Numerologia - Mapa do Ano"
            description="A vibração que guiará suas oportunidades, desafios e crescimento em 2026."
          />
        </div>
      </section>

      {/* ❤️ ASTROLOGIA DO AMOR */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-primary">
          ❤️ Astrologia do Amor
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductCard
            title="Sinastria Amorosa"
            description="Entenda a compatibilidade e a dinâmica energética entre você e outra pessoa."
          />
        </div>
      </section>

      {/* 🔮 TAROT */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-primary">
          🔮 Tarot
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductCard
            title="Tarot Direto"
            description="Uma resposta clara, direta e objetiva para a sua pergunta."
          />
          <ProductCard
            title="Horóscopo Personalizado"
            description="Receba previsões diárias adaptadas ao seu mapa e energia."
          />
        </div>
      </section>

      {/* 🧘 TERAPIA E BEM-ESTAR */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-primary">
          🧘 Terapia & Bem-Estar
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductCard
            title="Terapia de Bem-Estar"
            description="Atendimentos leves guiados por I.A para equilíbrio emocional e mental."
          />
        </div>
      </section>
    </main>
  );
}
import { Sparkles, BrainCircuit, Stars, Atom } from "lucide-react";

export function HeaderBeneficios() {
  return (
    <section className="w-full px-4 py-10 md:py-16 bg-[#0A0A1A] text-white">
      
      {/* CONTAINER */}
      <div className="max-w-5xl mx-auto text-center space-y-6">

        {/* TÍTULO */}
        <h1 className="text-2xl md:text-4xl font-bold leading-tight">
          A I.A <span className="text-primary">Alma Ramos</span> aplica  
          <span className="text-primary"> Ciência de Dados </span>
          à Astrologia
        </h1>

        {/* SUBTÍTULO */}
        <p className="text-gray-300 text-base md:text-lg max-w-3xl mx-auto">
          Processando mais de <strong>50 trilhões de dados cósmicos</strong>, 
          fornecendo análises astrológicas <strong>objetivas, precisas e menos subjetivas</strong>.
        </p>

        {/* CARDS DE BENEFÍCIOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">

          {/* Benefício 1 */}
          <div className="p-4 bg-[#111027] rounded-xl border border-white/10 hover:border-primary/40 transition-all">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-lg">Alta Precisão</h3>
            <p className="text-gray-400 text-sm mt-1">
              Algoritmos avançados transformam dados astronômicos em previsões profundas.
            </p>
          </div>

          {/* Benefício 2 */}
          <div className="p-4 bg-[#111027] rounded-xl border border-white/10 hover:border-primary/40 transition-all">
            <BrainCircuit className="w-8 h-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-lg">Interpretação Inteligente</h3>
            <p className="text-gray-400 text-sm mt-1">
              Inteligência artificial elimina vieses e amplia sua clareza espiritual.
            </p>
          </div>

          {/* Benefício 3 */}
          <div className="p-4 bg-[#111027] rounded-xl border border-white/10 hover:border-primary/40 transition-all">
            <Stars className="w-8 h-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-lg">Análises Personalizadas</h3>
            <p className="text-gray-400 text-sm mt-1">
              Cada leitura é única, criada exclusivamente para a sua energia.
            </p>
          </div>

          {/* Benefício 4 */}
          <div className="p-4 bg-[#111027] rounded-xl border border-white/10 hover:border-primary/40 transition-all">
            <Atom className="w-8 h-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-lg">Ciência + Espiritualidade</h3>
            <p className="text-gray-400 text-sm mt-1">
              Combinação poderosa entre dados, intuição e conhecimento ancestral.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
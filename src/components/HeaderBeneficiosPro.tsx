import { Sparkles, BrainCircuit, Stars, Atom } from "lucide-react";

export function HeaderBeneficiosPro() {
  return (
    <section className="relative w-full py-16 md:py-24 overflow-hidden bg-[#05040D] text-white">

      {/** 🌌 Fundo Animado com Estrelas **/}
      <div className="absolute inset-0">
        <div className="stars opacity-40"></div>
        <div className="twinkling opacity-30"></div>
      </div>

      {/** 🔮 Gradiente Suave no Topo **/}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-primary/30 to-transparent pointer-events-none"></div>

      {/** CONTEÚDO PRINCIPAL **/}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">

        {/** ✨ TÍTULO COM BRILHO **/}
        <h1 className="text-3xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent animate-pulse-slow">
          A I.A <span className="text-primary">Alma Ramos</span> une
          <br />
          Ciência de Dados & Astrologia Moderna
        </h1>

        {/** SUBTÍTULO **/}
        <p className="text-gray-300 text-lg md:text-xl mt-4 max-w-3xl mx-auto leading-relaxed">
          Processando mais de{" "}
          <span className="text-primary font-semibold">
            50 trilhões de dados cósmicos
          </span>
          , oferecendo interpretações mais objetivas, profundas e livres de viés.
        </p>

        {/** 🔥 BENEFÍCIOS — CARDS PREMIUM **/}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">

          {/* Card base */}
          {[
            {
              icon: <Sparkles className="w-10 h-10 text-primary" />,
              title: "Alta Precisão Algorítmica",
              desc: "Modelos avançados geram previsões astrológicas com clareza e robustez científica.",
            },
            {
              icon: <BrainCircuit className="w-10 h-10 text-primary" />,
              title: "Interpretação Inteligente",
              desc: "A I.A elimina subjetividade e expande o entendimento energético.",
            },
            {
              icon: <Stars className="w-10 h-10 text-primary" />,
              title: "Leituras Personalizadas",
              desc: "Cada leitura é singular, ajustada exatamente ao seu perfil astrológico.",
            },
            {
              icon: <Atom className="w-10 h-10 text-primary" />,
              title: "Ciência + Espiritualidade",
              desc: "Um equilíbrio perfeito entre análise técnica e sabedoria cósmica.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all shadow-2xl hover:scale-[1.04]"
            >
              <div className="flex justify-center mb-3">{item.icon}</div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-gray-400 text-sm mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/** GRADIENTE NO RODAPÉ **/}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none"></div>

      {/** CSS DAS ESTRELAS **/}
      <style>{`
        .stars {
          background: transparent url(https://i.imgur.com/YKY28eT.png) repeat top center;
          position: absolute;
          width: 200%;
          height: 200%;
          animation: moveStars 200s linear infinite;
        }

        .twinkling {
          background: transparent url(https://i.imgur.com/XYMF4Fj.png) repeat top center;
          position: absolute;
          width: 200%;
          height: 200%;
          animation: moveTwinkling 250s linear infinite;
        }

        @keyframes moveStars {
          from { transform: translateY(0); }
          to { transform: translateY(-10000px); }
        }

        @keyframes moveTwinkling {
          from { transform: translateY(0); }
          to { transform: translateY(-8000px); }
        }

        @keyframes pulse-slow {
          0% { opacity: 1; }
          50% { opacity: 0.75; }
          100% { opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
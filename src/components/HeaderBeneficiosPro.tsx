import { Sparkles, BrainCircuit, Stars, Atom } from "lucide-react";

export function HeaderBeneficiosPro() {
  const signos = [
    "♈ ÁRIES",
    "♉ TOURO",
    "♊ GÊMEOS",
    "♋ CÂNCER",
    "♌ LEÃO",
    "♍ VIRGEM",
    "♎ LIBRA",
    "♏ ESCORPIÃO",
    "♐ SAGITÁRIO",
    "♑ CAPRICÓRNIO",
    "♒ AQUÁRIO",
    "♓ PEIXES",
  ];

  return (
    <section className="relative w-full py-20 md:py-28 overflow-hidden bg-[#05040D] text-white">

      {/* 🌌 FUNDO ESTRELADO */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="stars" />
        <div className="twinkling" />
      </div>

      {/* ♈ SIGNOS — PARALLAX VERTICAL */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="signos-parallax">
          {Array.from({ length: 7 }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={`signos-coluna coluna-${colIndex}`}
            >
              {Array.from({ length: 22 }).map((_, i) => (
                <span key={i} className="signo">
                  {signos[Math.floor(Math.random() * signos.length)]}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 🌈 GRADIENTES DE CONTENÇÃO */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-primary/20 to-transparent" />

      {/* ✨ CONTEÚDO PRINCIPAL */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">

        <h1 className="text-3xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent animate-pulse-slow">
          A I.A <span className="text-primary">Alma Ramos</span> une
          <br />
          Ciência de Dados & Astrologia Moderna
        </h1>

        <p className="text-gray-300 text-lg md:text-xl mt-5 max-w-3xl mx-auto leading-relaxed">
          Processando mais de{" "}
          <span className="text-primary font-semibold">
            50 trilhões de dados cósmicos
          </span>
          , oferecendo interpretações mais objetivas, profundas e livres de viés.
        </p>

        {/* BENEFÍCIOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
          {[
            {
              icon: <Sparkles className="w-10 h-10 text-primary" />,
              title: "Alta Precisão Algorítmica",
              desc: "Modelos avançados geram previsões com robustez científica.",
            },
            {
              icon: <BrainCircuit className="w-10 h-10 text-primary" />,
              title: "Interpretação Inteligente",
              desc: "A I.A elimina subjetividade e expande o entendimento energético.",
            },
            {
              icon: <Stars className="w-10 h-10 text-primary" />,
              title: "Leituras Personalizadas",
              desc: "Cada leitura é ajustada exatamente ao seu perfil.",
            },
            {
              icon: <Atom className="w-10 h-10 text-primary" />,
              title: "Ciência + Espiritualidade",
              desc: "Equilíbrio entre análise técnica e sabedoria cósmica.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 shadow-2xl hover:scale-[1.04] hover:bg-white/10 transition-all"
            >
              <div className="flex justify-center mb-3">{item.icon}</div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-gray-400 text-sm mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CSS LOCAL — PARALLAX */}
      <style>{`
        .stars {
          background: radial-gradient(white 1px, transparent 1px);
          background-size: 3px 3px;
          position: absolute;
          width: 200%;
          height: 200%;
          animation: moveStars 180s linear infinite;
          opacity: 0.18;
        }

        .twinkling {
          background: radial-gradient(white 1px, transparent 1px);
          background-size: 2px 2px;
          position: absolute;
          width: 200%;
          height: 200%;
          animation: moveTwinkling 240s linear infinite;
          opacity: 0.1;
        }

        .signos-parallax {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          padding: 2rem;
        }

        .signos-coluna {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          font-family: "JetBrains Mono", "Courier New", monospace;
          font-size: 1.7rem;
          font-weight: 600;
          color: rgba(0, 255, 180, 0.18);
          text-shadow: 0 0 6px rgba(0, 255, 180, 0.35);
          animation: subirSignos 34s linear infinite;
        }

        .coluna-0 { animation-duration: 44s; opacity: 0.12; }
        .coluna-1 { animation-duration: 40s; opacity: 0.14; }
        .coluna-2 { animation-duration: 36s; opacity: 0.16; }
        .coluna-3 { animation-duration: 32s; opacity: 0.18; }
        .coluna-4 { animation-duration: 36s; opacity: 0.16; }
        .coluna-5 { animation-duration: 40s; opacity: 0.14; }
        .coluna-6 { animation-duration: 44s; opacity: 0.12; }

        .signo {
          letter-spacing: 0.25em;
          white-space: nowrap;
        }

        @keyframes subirSignos {
          from { transform: translateY(100%); }
          to { transform: translateY(-120%); }
        }

        @keyframes moveStars {
          from { transform: translateY(0); }
          to { transform: translateY(-1600px); }
        }

        @keyframes moveTwinkling {
          from { transform: translateY(0); }
          to { transform: translateY(-1200px); }
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
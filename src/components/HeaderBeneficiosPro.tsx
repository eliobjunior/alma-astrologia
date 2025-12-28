import { Sparkles, BrainCircuit, Stars, Atom } from "lucide-react";

export function HeaderBeneficiosPro() {
  return (
    <section className="relative w-full py-20 md:py-28 overflow-hidden bg-[#05040D] text-white">
      {/* FUNDO DE ESTRELAS */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="stars" />
        <div className="twinkling" />
      </div>

      {/* SIGNOS – VISÍVEIS DESDE O LOAD */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="signos-grid">
          {SIGNOS_FLAT.map((signo, i) => (
            <span key={i} className="signo">
              {signo}
            </span>
          ))}
        </div>
      </div>

      {/* GRADIENTES SUPERIOR / INFERIOR */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-primary/20 to-transparent" />

      {/* CONTEÚDO PRINCIPAL */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent animate-pulse-slow">
          A I.A <span className="text-primary">Alma Ramos</span> une
          <br />
          Ciência de Dados &amp; Astrologia Moderna
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
          {BENEFICIOS.map((b, i) => (
            <div
              key={i}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 shadow-2xl hover:scale-[1.04] hover:bg-white/10 transition-all"
            >
              <div className="flex justify-center mb-3 text-primary">
                {b.icon}
              </div>
              <h3 className="text-lg font-semibold">{b.title}</h3>
              <p className="text-gray-400 text-sm mt-2">{b.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ESTILOS LOCAIS */}
      <style>{`
        /* ===== ESTRELAS ===== */
        .stars {
          background: radial-gradient(white 1px, transparent 1px);
          background-size: 3px 3px;
          position: absolute;
          width: 200%;
          height: 200%;
          animation: moveStars 160s linear infinite;
          opacity: 0.16;
        }

        .twinkling {
          background: radial-gradient(white 1px, transparent 1px);
          background-size: 2px 2px;
          position: absolute;
          width: 200%;
          height: 200%;
          animation: moveTwinkling 200s linear infinite;
          opacity: 0.08;
        }

        /* ===== SIGNOS ===== */
        .signos-grid {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 3rem;
          padding: 2.5rem;
          animation: subirSignos 18s linear infinite; /* +50% velocidade */
        }

        .signo {
          font-family: "JetBrains Mono", "Courier New", monospace;
          font-size: 1.35rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          color: rgba(120, 255, 210, 0.15); /* +30% translucidez */
          text-shadow:
            0 0 1px rgba(120, 255, 210, 0.25),
            0 0 4px rgba(120, 255, 210, 0.15);
          white-space: nowrap;
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
        }

        /* ===== PROFUNDIDADE POR LINHA ===== */
        .signos-grid .signo:nth-child(6n + 1),
        .signos-grid .signo:nth-child(6n + 2) {
          opacity: 0.22;
        }

        .signos-grid .signo:nth-child(6n + 3),
        .signos-grid .signo:nth-child(6n + 4) {
          opacity: 0.16;
        }

        .signos-grid .signo:nth-child(6n + 5),
        .signos-grid .signo:nth-child(6n + 6) {
          opacity: 0.11;
        }

        /* ===== ANIMAÇÕES ===== */
        @keyframes subirSignos {
          from { transform: translateY(0); }
          to { transform: translateY(-55%); }
        }

        @keyframes moveStars {
          from { transform: translateY(0); }
          to { transform: translateY(-1400px); }
        }

        @keyframes moveTwinkling {
          from { transform: translateY(0); }
          to { transform: translateY(-1000px); }
        }

        @keyframes pulse-slow {
          0% { opacity: 1; }
          50% { opacity: 0.8; }
          100% { opacity: 1; }
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}

/* ===== DADOS ===== */

const SIGNOS_FLAT = [
  "♈ ÁRIES","♉ TOURO","♊ GÊMEOS","♋ CÂNCER","♌ LEÃO","♍ VIRGEM",
  "♎ LIBRA","♏ ESCORPIÃO","♐ SAGITÁRIO","♑ CAPRICÓRNIO","♒ AQUÁRIO","♓ PEIXES",
  "♈ ÁRIES","♉ TOURO","♊ GÊMEOS","♋ CÂNCER","♌ LEÃO","♍ VIRGEM",
  "♎ LIBRA","♏ ESCORPIÃO","♐ SAGITÁRIO","♑ CAPRICÓRNIO","♒ AQUÁRIO","♓ PEIXES",
  "♈ ÁRIES","♉ TOURO","♊ GÊMEOS","♋ CÂNCER","♌ LEÃO","♍ VIRGEM",
  "♎ LIBRA","♏ ESCORPIÃO","♐ SAGITÁRIO","♑ CAPRICÓRNIO","♒ AQUÁRIO","♓ PEIXES",
];

const BENEFICIOS = [
  {
    title: "Alta Precisão Algorítmica",
    text: "Modelos avançados geram previsões com robustez científica.",
    icon: <Sparkles size={40} strokeWidth={1.8} />,
  },
  {
    title: "Interpretação Inteligente",
    text: "A I.A elimina subjetividade e expande o entendimento energético.",
    icon: <BrainCircuit size={40} strokeWidth={1.8} />,
  },
  {
    title: "Leituras Personalizadas",
    text: "Cada leitura é ajustada exatamente ao seu perfil.",
    icon: <Stars size={40} strokeWidth={1.8} />,
  },
  {
    title: "Ciência + Espiritualidade",
    text: "Equilíbrio entre análise técnica e sabedoria cósmica.",
    icon: <Atom size={40} strokeWidth={1.8} />,
  },
];
import { Sparkles, BrainCircuit, Stars, Atom } from "lucide-react";


export function HeaderBeneficios() {
  return (
    <section className="relative w-full py-20 md:py-28 overflow-hidden text-white">
      {/* GRADIENTE */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#5a4300] via-[#0a0a1a] to-[#05040d]" />


      {/* TEXTURA */}
      <div
        className="absolute inset-0 opacity-[0.08]
        bg-[radial-gradient(#ffffff_1px,transparent_1px)]
        [background-size:3px_3px]"
      />


      {/* SIGNOS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="signos-grid">
          {SIGNOS.map((s, i) => (
            <span key={i} className="signo">
              {s}
            </span>
          ))}
        </div>
      </div>


      {/* CONTEÚDO */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <h1 className="text-[2.6rem] md:text-[3.4rem] font-extrabold leading-tight">
          <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-pink-400 bg-clip-text text-transparent">
            A I.A Alma Ramos
          </span>
          <br />
          <span className="bg-gradient-to-r from-yellow-300 to-pink-400 bg-clip-text text-transparent">
            Ciência de Dados & Astrologia Moderna
          </span>
        </h1>


        <p className="text-gray-300 text-lg md:text-xl mt-6 max-w-3xl mx-auto">
          Processando mais de{" "}
          <span className="text-yellow-300 font-semibold">
            50 trilhões de dados cósmicos
          </span>
          , oferecendo interpretações mais objetivas, profundas e livres de viés.
        </p>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
          {BENEFICIOS.map((b, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex justify-center mb-3 text-yellow-300">
                {b.icon}
              </div>
              <h3 className="text-lg font-semibold">{b.title}</h3>
              <p className="text-gray-400 text-sm mt-2">{b.text}</p>
            </div>
          ))}
        </div>
      </div>


      <style>{`
        .signos-grid {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 3rem;
          padding: 3rem;
          animation: subir 24s linear infinite;
        }


        .signo {
          font-family: monospace;
          letter-spacing: 0.22em;
          color: rgba(255,215,120,0.08);
        }


        @keyframes subir {
          from { transform: translateY(0); }
          to { transform: translateY(-55%); }
        }
      `}</style>
    </section>
  );
}


const SIGNOS = [
  "ÁRIES","TOURO","GÊMEOS","CÂNCER","LEÃO","VIRGEM",
  "LIBRA","ESCORPIÃO","SAGITÁRIO","CAPRICÓRNIO","AQUÁRIO","PEIXES",
  "ÁRIES","TOURO","GÊMEOS","CÂNCER","LEÃO","VIRGEM",
  "LIBRA","ESCORPIÃO","SAGITÁRIO","CAPRICÓRNIO","AQUÁRIO","PEIXES",
];


const BENEFICIOS = [
  {
    title: "Alta Precisão Algorítmica",
    text: "Modelos avançados geram previsões com robustez científica.",
    icon: <Sparkles size={34} />,
  },
  {
    title: "Interpretação Inteligente",
    text: "A I.A elimina subjetividade e amplia o entendimento energético.",
    icon: <BrainCircuit size={34} />,
  },
  {
    title: "Leituras Personalizadas",
    text: "Cada leitura é ajustada exatamente ao seu perfil.",
    icon: <Stars size={34} />,
  },
  {
    title: "Ciência + Espiritualidade",
    text: "Equilíbrio entre análise técnica e sabedoria cósmica.",
    icon: <Atom size={34} />,
  },
];
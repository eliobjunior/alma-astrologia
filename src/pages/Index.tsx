import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { Heart, Map, Stars, Sparkles, Baby, Flame, Smile, Calendar, TrendingUp, Wand2 } from "lucide-react";

const Index = () => {
  const freeProducts = [
    {
      title: "Leitura Resumida do Horóscopo Hoje",
      description: "Receba uma leitura personalizada do seu horóscopo diário. Gratuito pela primeira vez!",
      icon: <Stars className="w-6 h-6" />,
    },
    {
      title: "Mini Mapa Astral",
      description: "Uma página resumida com os principais aspectos do seu mapa astral. Gratuito pela primeira vez!",
      icon: <Map className="w-6 h-6" />,
    },
  ];

  const paidProducts = [
    {
      title: "Mapa Astral",
      description: "Estudo pessoal completo (~20 páginas) sobre sua personalidade, talentos, desafios e potencial com base em data, hora e local de nascimento.",
      icon: <Sparkles className="w-6 h-6" />,
    },
    {
      title: "Horóscopo Personalizado",
      description: "Relatório periódico (mensal ou trimestral) com as tendências astrológicas para você, com foco em amor, carreira, saúde, espiritualidade.",
      icon: <Calendar className="w-6 h-6" />,
    },
    {
      title: "Sinastria Amorosa",
      description: "Comparação entre dois mapas astrais para entender afinidades, desafios e dinâmica de relacionamento.",
      icon: <Heart className="w-6 h-6" />,
    },
    {
      title: "Tarot Direto",
      description: "Tiragem de tarot com foco numa pergunta específica (carreira, amor, finanças) + interpretação detalhada.",
      icon: <Wand2 className="w-6 h-6" />,
    },
    {
      title: "Tarot Mensal",
      description: "Tiragem mensal de 13 cartas cobrindo amor, trabalho, saúde, espiritualidade + orientações para o mês.",
      icon: <Stars className="w-6 h-6" />,
    },
    {
      title: "Numerologia – Mapa do Ano",
      description: "Estudo numerológico para o ano pessoal, destacando ciclos, oportunidades, desafios e como aproveitar.",
      icon: <TrendingUp className="w-6 h-6" />,
    },
    {
      title: "Mapa Profissional",
      description: "Análise focada na carreira, propósito de vida, talentos profissionais, ambientes ideais, desafios.",
      icon: <TrendingUp className="w-6 h-6" />,
    },
    {
      title: "Mapa Infantil",
      description: "Relatório voltado a crianças/adolescentes – personalidade, potencialidades, forma de aprender, suportes para desenvolvimento.",
      icon: <Baby className="w-6 h-6" />,
    },
    {
      title: "Mapa Sexual",
      description: "Estudo da sexualidade, desejos, expressão íntima, bloqueios e como explorar de forma saudável.",
      icon: <Flame className="w-6 h-6" />,
    },
    {
      title: "Consulta de Bem-Estar / Terapia Leve",
      description: "Sessão de suporte focada em bem-estar, equilíbrio emocional, stress, autoconhecimento.",
      icon: <Smile className="w-6 h-6" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      
      <section id="produtos-gratuitos" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Experimente Gratuitamente
            </h2>
            <p className="text-muted-foreground text-lg">
              Descubra o poder da astrologia com nossos produtos gratuitos
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {freeProducts.map((product, index) => (
              <ProductCard
                key={index}
                title={product.title}
                description={product.description}
                icon={product.icon}
                isFree
              />
            ))}
          </div>
        </div>
      </section>

      <section id="produtos-pagos" className="py-20 px-4 bg-celestial/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Serviços Completos
            </h2>
            <p className="text-muted-foreground text-lg">
              Relatórios detalhados entregues por WhatsApp, PDF e Áudio
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paidProducts.map((product, index) => (
              <ProductCard
                key={index}
                title={product.title}
                description={product.description}
                icon={product.icon}
              />
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground">
          <p className="mb-4">© 2024 Alma Ramos - Todos os direitos reservados</p>
          <p className="text-sm">
            Os serviços oferecidos têm caráter de entretenimento e autoconhecimento.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

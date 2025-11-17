import { Sparkles } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[var(--gradient-celestial)]" />
      
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <div className="flex justify-center mb-6">
          <Sparkles className="w-16 h-16 text-primary animate-pulse" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-mystic to-primary bg-clip-text text-transparent">
          Alma Ramos
        </h1>
        
        <p className="text-xl md:text-2xl text-foreground/90 mb-8 max-w-2xl mx-auto">
          Descubra os segredos do universo através da astrologia, tarot e autoconhecimento
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="#produtos-gratuitos" 
            className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold hover:shadow-[var(--shadow-glow)] transition-all duration-300"
          >
            Experimente Grátis
          </a>
          <a 
            href="#produtos-pagos" 
            className="px-8 py-4 border-2 border-primary text-primary rounded-full font-semibold hover:bg-primary/10 transition-all duration-300"
          >
            Ver Serviços
          </a>
        </div>
      </div>
    </section>
  );
};

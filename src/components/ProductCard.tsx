import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";
import { Sparkles } from "lucide-react";

// Links Stripe por produto (compra avulsa)
const PRODUCT_STRIPE_LINKS: Record<string, string> = {
  "Mapa Astral Personalizado": "https://buy.stripe.com/aFa9AVagU7vXgp272p2cg09",
  "Horóscopo Personalizado": "https://buy.stripe.com/5kQ7sN1KodUl5Ko4Uh2cg08",
  "Sinastria Amorosa": "https://buy.stripe.com/14AdRbfBe6rTgp24Uh2cg07",
  "Tarot Direto": "https://buy.stripe.com/28EdRbcp24jL2yc4Uh2cg06",
  "Tarot Mensal": "https://buy.stripe.com/8x26oJ9cQ17zgp2fyV2cg05",
  "Numerologia - Mapa do Ano": "https://buy.stripe.com/8x200lbkYaI9a0EgCZ2cg04",
  "Mapa Profissional": "https://buy.stripe.com/fZueVfgFi03vgp2aeB2cg03",
  "Mapa Infantil": "https://buy.stripe.com/14AbJ3bkYaI9fkY3Qd2cg02",
  "Mapa Sexual": "https://buy.stripe.com/4gMeVfbkY5nP6Os9ax2cg01",
  "Consulta de Bem-Estar / Terapia Leve": "https://buy.stripe.com/28EbJ360E4jLb4IbiF2cg00",
};

// Links Stripe de assinaturas
const STRIPE_MENSAL = "https://buy.stripe.com/28EeVf60E2bDgp272p2cg0a";
const STRIPE_SEMESTRAL = "https://buy.stripe.com/7sY14p60EbMd8WA1I52cg0b";

interface ProductCardProps {
  title: string;
  description: string;
  isFree?: boolean;
  icon?: React.ReactNode;
}

export const ProductCard = ({ title, description, isFree = false, icon }: ProductCardProps) => {
  return (
    <Card className="group hover:shadow-[var(--shadow-card)] hover:border-primary/50 transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            {icon || <Sparkles className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
            {isFree && (
              <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                GRATUITO
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-muted-foreground">
          {description}
        </CardDescription>
        
        {!isFree ? (
          <div className="space-y-3 pt-4 border-t border-border">
            {/* Compra avulsa por produto */}
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => handleOpenStripe(avulsoUrl)}
              disabled={!avulsoUrl}
            >
              ✅ Comprar avulso — R$ 12,00
            </Button>

            {/* Assinatura mensal (link fixo) */}
            <Button
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary/10"
              onClick={() => handleOpenStripe(STRIPE_MENSAL)}
            >
              📅 Assinatura mensal — R$ 39,00
            </Button>

            {/* Assinatura semestral (link fixo) */}
            <Button
              variant="outline"
              className="w-full border-accent text-accent hover:bg-accent/10"
              onClick={() => handleOpenStripe(STRIPE_SEMESTRAL)}
            >
              📆 Assinatura semestral — R$ 114,00
            </Button>
          </div>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Solicitar Agora
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                  Preencha seus dados para receber seu {title.toLowerCase()} gratuito
                </DialogDescription>
              </DialogHeader>
              <ProductForm productName={title} paymentType="gratuito" />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

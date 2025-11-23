import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";
import { Sparkles } from "lucide-react";

interface ProductCardProps {
  title: string;
  description: string;
  isFree?: boolean;
  icon?: React.ReactNode;
  image?: string;
}

export const ProductCard = ({ title, description, isFree = false, icon, image}: ProductCardProps) => {
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

        {image && (
            <div className="w-full h-48 rounded-xl overflow-hidden bg-background flex items-center justify-center">
              <img 
                src={image}
                alt={title}
                className="max-w-full max-h-full object-contain"
              />
            </div>
        )}
        
        {!isFree ? (
          <div className="space-y-3 pt-4 border-t border-border">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  ✅ Comprar avulso — R$ 12,00
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{title} - Compra Avulsa</DialogTitle>
                  <DialogDescription>
                    Preencha seus dados para receber seu {title.toLowerCase()}
                  </DialogDescription>
                </DialogHeader>
                <ProductForm productName={title} paymentType="avulso" />
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                  📅 Assinatura mensal — R$ 39,00
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{title} - Assinatura Mensal</DialogTitle>
                  <DialogDescription>
                    Acesso mensal por R$ 39,00/mês
                  </DialogDescription>
                </DialogHeader>
                <ProductForm productName={title} paymentType="mensal" />
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent/10">
                  📆 Assinatura semestral — R$ 114,00
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{title} - Assinatura Semestral</DialogTitle>
                  <DialogDescription>
                    Acesso por 6 meses por R$ 114,00
                  </DialogDescription>
                </DialogHeader>
                <ProductForm productName={title} paymentType="semestral" />
              </DialogContent>
            </Dialog>
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

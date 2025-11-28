import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";
import { Sparkles } from "lucide-react";
import { STRIPE_LINKS } from "@/data/stripeLinks";

interface ProductCardProps {
  title: string;
  description: string;
  isFree?: boolean;
  icon?: React.ReactNode;
}

export const ProductCard = ({
  title,
  description,
  isFree = false,
  icon,
}: ProductCardProps) => {
  // Busca os links do produto pelo título
  const stripe = STRIPE_LINKS[title] || {};
  const avulsoUrl = stripe.avulso;
  const mensalUrl = stripe.mensal;
  const semestralUrl = stripe.semestral;

  const handleOpenStripe = (url?: string) => {
    if (url) window.open(url, "_blank");
  };

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

        {/* Produto Pago */}
        {!isFree ? (
          <div className="space-y-3 pt-4 border-t border-border">

            {/* Compra Avulsa */}
            {avulsoUrl && (
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => handleOpenStripe(avulsoUrl)}
              >
                🔮 Comprar avulso
              </Button>
            )}

            {/* Assinatura Mensal */}
            {mensalUrl && (
              <Button
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary/10"
                onClick={() => handleOpenStripe(mensalUrl)}
              >
                📅 Assinatura Mensal
              </Button>
            )}

            {/* Assinatura Semestral */}
            {semestralUrl && (
              <Button
                variant="outline"
                className="w-full border-accent text-accent hover:bg-accent/10"
                onClick={() => handleOpenStripe(semestralUrl)}
              >
                📆 Assinatura Semestral
              </Button>
            )}
          </div>
        ) : (
          /* Produto Gratuito */
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
                  Preencha seus dados para receber seu{" "}
                  {title.toLowerCase()} gratuitamente.
                </DialogDescription>
              </DialogHeader>

              <ProductForm
                productName={title}
                paymentType="gratuito"
              />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};
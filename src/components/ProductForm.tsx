import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ProductFormProps {
  productName: string;
  paymentType: "gratuito" | "avulso" | "mensal" | "semestral";
}

export const ProductForm = ({ productName, paymentType }: ProductFormProps) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nomeCompleto: "",
    dataNascimento: "",
    hora: "",
    cidade: "",
    estado: "",
    pais: "Brasil",
    whatsapp: "",
    email: "",
  });

  // ------------------------------------------------------------
  // HANDLE SUBMIT — Envia diretamente para o n8n via webhook
  // ------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      produto: productName,
      tipoPagamento: paymentType,
      ...formData,
    };

    try {
      // 🔥 ENVIO DIRETO PARA O N8N (substitua pelo seu webhook!)
      await fetch("https://SEU_WEBHOOK_DO_N8N", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      toast({
        title: "Solicitação enviada!",
        description: "Em breve você receberá seu relatório por WhatsApp e e-mail.",
      });

      // Se for produto pago, você redirecionará para o Stripe aqui:
      if (paymentType !== "gratuito") {
        // redirecione para sua página de checkout
        // window.location.href = "/checkout/" + productName.toLowerCase();
      }

    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar os dados. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // ------------------------------------------------------------
  // HANDLE CHANGE — Atualiza campos
  // ------------------------------------------------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ------------------------------------------------------------
  // FORMULÁRIO — JSX
  // ------------------------------------------------------------
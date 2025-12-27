import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ProductFormProps {
  productName: string;
  paymentType: "gratuito" | "avulso" | "mensal" | "semestral";
}

type FormData = {
  nomeCompleto: string;
  dataNascimento: string;
  horaNascimento: string;
  cidade: string;
  estado: string;
  pais: string;
  whatsapp: string;
  email: string;
};

export const ProductForm = ({ productName, paymentType }: ProductFormProps) => {
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    nomeCompleto: "",
    dataNascimento: "",
    horaNascimento: "",
    cidade: "",
    estado: "",
    pais: "Brasil",
    whatsapp: "",
    email: "",
  });

  // ------------------------------------------------------------
  // HANDLE SUBMIT — Envia dados para o n8n
  // ------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload = {
      produto: productName,
      tipoPagamento: paymentType,
      origem: "site-alma-ramos",
      dadosCliente: {
        ...formData,
      },
      timestamp: new Date().toISOString(),
    };

    try {
      await fetch("https://SEU_WEBHOOK_DO_N8N", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      toast({
        title: "Solicitação enviada!",
        description:
          "Recebemos seus dados. Em breve você receberá instruções por WhatsApp e e-mail.",
      });

      // Limpa formulário após envio
      setFormData({
        nomeCompleto: "",
        dataNascimento: "",
        horaNascimento: "",
        cidade: "",
        estado: "",
        pais: "Brasil",
        whatsapp: "",
        email: "",
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar seus dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------
  // HANDLE CHANGE — Atualiza campos
  // ------------------------------------------------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ------------------------------------------------------------
  // FORMULÁRIO — JSX
  // ------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div>
        <Label htmlFor="nomeCompleto">Nome completo</Label>
        <Input
          id="nomeCompleto"
          name="nomeCompleto"
          value={formData.nomeCompleto}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="dataNascimento">Data de nascimento</Label>
        <Input
          id="dataNascimento"
          name="dataNascimento"
          type="date"
          value={formData.dataNascimento}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="horaNascimento">Hora de nascimento</Label>
        <Input
          id="horaNascimento"
          name="horaNascimento"
          type="time"
          value={formData.horaNascimento}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="cidade">Cidade</Label>
        <Input
          id="cidade"
          name="cidade"
          value={formData.cidade}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="estado">Estado</Label>
        <Input
          id="estado"
          name="estado"
          value={formData.estado}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="pais">País</Label>
        <Input
          id="pais"
          name="pais"
          value={formData.pais}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          placeholder="(DDD) 99999-9999"
          value={formData.whatsapp}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Enviando..." : "Enviar dados"}
      </Button>
    </form>
  );
};
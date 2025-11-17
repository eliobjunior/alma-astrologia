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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aqui será integrado com n8n/OpenAI no futuro
    console.log("Dados do formulário:", {
      produto: productName,
      tipoPagamento: paymentType,
      ...formData
    });

    toast({
      title: "Solicitação enviada!",
      description: "Em breve você receberá seu relatório por WhatsApp e e-mail.",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nomeCompleto">Nome Completo</Label>
        <Input
          id="nomeCompleto"
          name="nomeCompleto"
          value={formData.nomeCompleto}
          onChange={handleChange}
          required
          className="bg-muted/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dataNascimento">Data de Nascimento</Label>
          <Input
            id="dataNascimento"
            name="dataNascimento"
            type="date"
            value={formData.dataNascimento}
            onChange={handleChange}
            required
            className="bg-muted/50"
          />
        </div>
        
        <div>
          <Label htmlFor="hora">Hora de Nascimento</Label>
          <Input
            id="hora"
            name="hora"
            type="time"
            value={formData.hora}
            onChange={handleChange}
            required
            className="bg-muted/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            name="cidade"
            value={formData.cidade}
            onChange={handleChange}
            required
            className="bg-muted/50"
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
            className="bg-muted/50"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="pais">País</Label>
        <Input
          id="pais"
          name="pais"
          value={formData.pais}
          onChange={handleChange}
          required
          className="bg-muted/50"
        />
      </div>

      <div>
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          placeholder="+55 (11) 99999-9999"
          value={formData.whatsapp}
          onChange={handleChange}
          required
          className="bg-muted/50"
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
          className="bg-muted/50"
        />
      </div>

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
        {paymentType === "gratuito" ? "Solicitar Gratuitamente" : "Confirmar Solicitação"}
      </Button>

      {paymentType !== "gratuito" && (
        <p className="text-xs text-muted-foreground text-center">
          Você será redirecionado para o pagamento após confirmar
        </p>
      )}
    </form>
  );
};

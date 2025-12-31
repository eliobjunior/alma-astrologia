import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductFormProps {
  productName: string;
  paymentType: "avulso" | "mensal" | "semestral";
}

export function ProductForm({ productName, paymentType }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nomeCompleto: "",
    cidadeNascimento: "",
    estadoNascimento: "",
    pais: "",
    dataNascimento: "",
    horaNascimento: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    setLoading(true);

    const response = await fetch("http://localhost:3001/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName,
        paymentType,
        ...form,
      }),
    });

    const data = await response.json();

    if (data.init_point) {
      window.location.href = data.init_point;
    } else {
      alert("Erro ao iniciar pagamento");
    }

    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Nome completo</Label>
        <Input name="nomeCompleto" onChange={handleChange} required />
      </div>

      <div>
        <Label>Cidade de nascimento</Label>
        <Input name="cidadeNascimento" onChange={handleChange} required />
      </div>

      <div>
        <Label>Estado de nascimento</Label>
        <Input name="estadoNascimento" onChange={handleChange} required />
      </div>

      <div>
        <Label>País</Label>
        <Input name="pais" defaultValue="Brasil" onChange={handleChange} required />
      </div>

      <div>
        <Label>Data de nascimento</Label>
        <Input type="date" name="dataNascimento" onChange={handleChange} required />
      </div>

      <div>
        <Label>Horário de nascimento (opcional)</Label>
        <Input type="time" name="horaNascimento" onChange={handleChange} />
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={loading}>
        {loading ? "Redirecionando..." : "Continuar para pagamento"}
      </Button>
    </div>
}
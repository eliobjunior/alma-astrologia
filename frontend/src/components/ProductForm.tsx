import { useState } from "react";


interface ProductFormProps {
  productName: string;
  paymentType: "gratuito" | "avulso" | "assinatura";
}


/**
 * API URL
 * Dev  → .env              (VITE_API_URL=http://localhost:3000)
 * Prod → .env.production   (VITE_API_URL=https://api.almaliraramos.com.br)
 */
const API_URL = import.meta.env.VITE_API_URL;


export function ProductForm({ productName, paymentType }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);


    const formData = new FormData(e.currentTarget);


    const payload = {
      produto: productName,
      tipo_pagamento: paymentType,
      nome: String(formData.get("nome")),
      email: String(formData.get("email")),
      data_nascimento: String(formData.get("data_nascimento")),
      hora_nascimento: String(formData.get("hora_nascimento")),
      cidade: String(formData.get("cidade")),
      pais: String(formData.get("pais")),
    };


    try {
      const response = await fetch(`${API_URL}/api/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });


      if (!response.ok) {
        throw new Error("Erro ao iniciar o pagamento");
      }


      const data = await response.json();


      // Produtos gratuitos não redirecionam
      if (paymentType === "gratuito") {
        alert("Pedido recebido com sucesso!");
        setLoading(false);
        return;
      }


      if (!data?.payment_url) {
        throw new Error("Link de pagamento não retornado");
      }


      // 🔁 Redireciona para o Mercado Pago
      window.location.href = data.payment_url;
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
      setLoading(false);
    }
  }


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <input
        name="nome"
        placeholder="Nome completo"
        required
        className="w-full p-3 rounded bg-black text-white border border-gray-700"
      />


      <input
        name="email"
        type="email"
        placeholder="E-mail"
        required
        className="w-full p-3 rounded bg-black text-white border border-gray-700"
      />


      <input
        name="data_nascimento"
        type="date"
        required
        className="w-full p-3 rounded bg-black text-white border border-gray-700"
      />


      <input
        name="hora_nascimento"
        type="time"
        required
        className="w-full p-3 rounded bg-black text-white border border-gray-700"
      />


      <input
        name="cidade"
        placeholder="Cidade de nascimento"
        required
        className="w-full p-3 rounded bg-black text-white border border-gray-700"
      />


      <input
        name="pais"
        defaultValue="Brasil"
        required
        className="w-full p-3 rounded bg-black text-white border border-gray-700"
      />


      {error && (
        <p className="text-red-400 text-sm text-center">
          {error}
        </p>
      )}


      <button
        type="submit"
        disabled={loading}
        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-3 rounded transition"
      >
        {loading ? "Redirecionando..." : "Continuar para pagamento"}
      </button>
    </form>
  );
};
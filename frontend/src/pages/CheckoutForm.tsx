import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

/**
 * API
 * Dev:  http://localhost:3000
 * Prod: https://api.almaliraramos.com.br
 */
const API_URL = import.meta.env.VITE_API_URL;

type TipoCheckout = "avulso" | "mensal" | "semestral";

interface CheckoutPayload {
  produto: string;
  tipo: TipoCheckout;
  nome: string;
  email: string;
  data_nascimento: string;
  hora_nascimento: string;
  cidade: string;
  pais: string;
}

export default function CheckoutForm() {
  const { produtoSlug } = useParams<{ produtoSlug: string }>();
  const [searchParams] = useSearchParams();

  const tipo = (searchParams.get("tipo") || "avulso") as TipoCheckout;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const payload: CheckoutPayload = {
      produto: produtoSlug || "",
      tipo,
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Erro ao iniciar pagamento");
      }

      const data = await response.json();

      if (!data?.payment_url) {
        throw new Error("Link de pagamento não retornado");
      }

      // 🔁 Redireciona para Mercado Pago
      window.location.href = data.payment_url;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro inesperado");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05040D] text-white px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#0B0A1A] p-6 rounded-xl shadow-lg space-y-4"
      >
        <h1 className="text-xl font-semibold text-center">
          Finalize seu pedido
        </h1>

        <p className="text-center text-sm text-gray-400">
          Tipo de compra:{" "}
          <strong className="text-yellow-400 capitalize">{tipo}</strong>
        </p>

        {error && (
          <div className="bg-red-600/20 text-red-400 text-sm p-3 rounded">
            {error}
          </div>
        )}

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
          placeholder="País"
          required
          className="w-full p-3 rounded bg-black text-white border border-gray-700"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded transition"
        >
          {loading ? "Redirecionando..." : "Continuar para pagamento"}
        </button>
      </form>
    </div>
  );
}
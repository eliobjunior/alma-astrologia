import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PAYMENT_PROVIDERS } from "@/data/paymentProviders";

interface FormDadosClienteProps {
  produtoId: string; // 🔑 CHAVE TÉCNICA (EX: mapa_astral_personalizado)
  onClose: () => void;
}

export function FormDadosCliente({
  produtoId,
  onClose,
}: FormDadosClienteProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    dataNascimento: "",
    horaNascimento: "",
    cidadeNascimento: "",
  });

  /* =========================
     HANDLERS
  ========================= */

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    // Máscara de data dd/mm/aaaa
    if (name === "dataNascimento") {
      const onlyNumbers = value.replace(/\D/g, "");
      let formatted = onlyNumbers;

      if (onlyNumbers.length > 2) {
        formatted = `${onlyNumbers.slice(0, 2)}/${onlyNumbers.slice(2)}`;
      }
      if (onlyNumbers.length > 4) {
        formatted = `${onlyNumbers.slice(0, 2)}/${onlyNumbers.slice(
          2,
          4
        )}/${onlyNumbers.slice(4, 8)}`;
      }

      setForm({ ...form, dataNascimento: formatted });
      return;
    }

    setForm({ ...form, [name]: value });
  }

  function validarFormulario(): boolean {
    const camposFaltantes: string[] = [];

    if (!form.nome) camposFaltantes.push("Nome completo");
    if (!form.email) camposFaltantes.push("E-mail");
    if (!form.dataNascimento || form.dataNascimento.length !== 10)
      camposFaltantes.push("Data de nascimento");
    if (!form.horaNascimento) camposFaltantes.push("Hora do nascimento");
    if (!form.cidadeNascimento)
      camposFaltantes.push("Cidade de nascimento");

    if (camposFaltantes.length > 0) {
      setErro(
        `Preencha os seguintes campos: ${camposFaltantes.join(", ")}.`
      );
      return false;
    }

    setErro(null);
    return true;
  }

  function handlePagar() {
    if (!validarFormulario()) return;

    // 🔗 BUSCA CORRETA PELO ID DO PRODUTO
    const payment = PAYMENT_PROVIDERS[produtoId];

    const url =
      payment?.avulso ||
      payment?.mensal ||
      payment?.semestral;

    if (!url) {
      setErro("Link de pagamento indisponível para este produto.");
      return;
    }

    setLoading(true);

    // ✅ REDIRECIONAMENTO DIRETO PARA O MERCADO PAGO
    window.location.href = url;
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <Card className="w-full max-w-lg bg-[#0A0A1A] text-white border border-[#222] rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Informe seus dados</h2>

          <p className="text-sm text-gray-400">
            Essas informações são necessárias para personalizar sua leitura
            antes do pagamento.
          </p>

          <input
            name="nome"
            placeholder="Nome completo"
            value={form.nome}
            onChange={handleChange}
            className="w-full p-3 rounded bg-[#05040D] border border-[#333]"
          />

          <input
            name="email"
            type="email"
            placeholder="E-mail"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 rounded bg-[#05040D] border border-[#333]"
          />

          <input
            name="dataNascimento"
            placeholder="Data de Nascimento (dd/mm/aaaa)"
            value={form.dataNascimento}
            onChange={handleChange}
            maxLength={10}
            className="w-full p-3 rounded bg-[#05040D] border border-[#333]"
          />

          <input
            name="horaNascimento"
            type="time"
            placeholder="Hora do Nascimento"
            value={form.horaNascimento}
            onChange={handleChange}
            className="w-full p-3 rounded bg-[#05040D] border border-[#333]"
          />

          <input
            name="cidadeNascimento"
            placeholder="Cidade de nascimento"
            value={form.cidadeNascimento}
            onChange={handleChange}
            className="w-full p-3 rounded bg-[#05040D] border border-[#333]"
          />

          {erro && (
            <p className="text-sm text-red-400 text-center">
              {erro}
            </p>
          )}

          <p className="text-xs text-gray-400 text-center">
            Você será direcionado ao pagamento após confirmar seus dados.
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handlePagar}
              disabled={loading}
              className="flex-1 rounded-full bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-50"
            >
              {loading ? "Processando..." : "Pagar"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-gray-400"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
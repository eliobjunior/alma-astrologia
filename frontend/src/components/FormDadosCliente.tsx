import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

interface FormDadosClienteProps {
  produtoId: string;
  onClose: () => void;
}

type FormState = {
  nome: string;
  email: string;
  dataNascimento: string; // dd/mm/aaaa (no input)
  horaNascimento: string; // HH:mm
  cidadeNascimento: string;
};

export function FormDadosCliente({ produtoId, onClose }: FormDadosClienteProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    nome: "",
    email: "",
    dataNascimento: "",
    horaNascimento: "",
    cidadeNascimento: "",
  });

  function brToIsoDate(ddmmyyyy: string) {
    // "31/01/1990" -> "1990-01-31"
    const parts = ddmmyyyy.split("/");
    if (parts.length !== 3) return ddmmyyyy;

    const [dd, mm, yyyy] = parts;
    if (!dd || !mm || !yyyy) return ddmmyyyy;

    return `${yyyy}-${mm}-${dd}`;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    // Máscara de data (dd/mm/aaaa)
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

      setForm((prev) => ({ ...prev, dataNascimento: formatted }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value } as FormState));
  }

  function validarFormulario(): boolean {
    const camposFaltantes: string[] = [];

    if (!form.nome) camposFaltantes.push("Nome completo");
    if (!form.email) camposFaltantes.push("E-mail");
    if (!form.dataNascimento || form.dataNascimento.length !== 10)
      camposFaltantes.push("Data de nascimento");
    if (!form.horaNascimento) camposFaltantes.push("Hora do nascimento");
    if (!form.cidadeNascimento) camposFaltantes.push("Cidade de nascimento");

    if (camposFaltantes.length > 0) {
      setErro(`Preencha os seguintes campos: ${camposFaltantes.join(", ")}.`);
      return false;
    }

    setErro(null);
    return true;
  }

  /**
   * ✅ FLUXO CORRETO (PRODUÇÃO)
   * 1) POST /orders  -> backend salva order + chama Mercado Pago
   * 2) backend retorna { init_point }
   * 3) front redireciona
   */
  async function handlePagar() {
    if (!validarFormulario()) return;

    try {
      setLoading(true);
      setErro(null);

      const resp = await api.post("/orders", {
        produtoId,
        nome: form.nome,
        email: form.email,
        dataNascimento: brToIsoDate(form.dataNascimento),
        horaNascimento: form.horaNascimento || null,
        cidadeNascimento: form.cidadeNascimento,
      });

      const initPoint = resp.data?.init_point;
      if (!initPoint) {
        throw new Error("init_point não retornado pelo backend");
      }

      window.location.assign(initPoint);
    } catch (error) {
      console.error("Erro no pagamento:", error);
      setErro("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <Card className="w-full max-w-lg bg-[#0A0A1A] text-white border border-[#222] rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Informe seus dados</h2>

          <p className="text-sm text-gray-400">
            Essas informações são necessárias para personalizar sua leitura antes
            do pagamento.
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
            placeholder="Data de nascimento (dd/mm/aaaa)"
            value={form.dataNascimento}
            onChange={handleChange}
            maxLength={10}
            className="w-full p-3 rounded bg-[#05040D] border border-[#333]"
          />

          <input
            name="horaNascimento"
            type="time"
            value={form.horaNascimento}
            onChange={handleChange}
            className="
              w-full p-3 rounded
              bg-[#05040D]
              border border-[#333]
              text-white
              [color-scheme:dark]
              appearance-auto
            "
          />

          <input
            name="cidadeNascimento"
            placeholder="Cidade de nascimento"
            value={form.cidadeNascimento}
            onChange={handleChange}
            className="w-full p-3 rounded bg-[#05040D] border border-[#333]"
          />

          {erro && <p className="text-sm text-red-400 text-center">{erro}</p>}

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
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { produto, tipoPagamento, dadosCliente } = req.body;

  try {
    // URL do seu fluxo no n8n
    const n8nURL = "https://SEU-N8N-ENDPOINT/webhook/receive";

    const response = await fetch(n8nURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        produto,
        tipoPagamento,
        ...dadosCliente,
      }),
    });

    if (!response.ok) {
      throw new Error("Erro ao enviar dados para o n8n");
    }

    return res.status(200).json({ message: "Dados enviados ao n8n com sucesso!" });

  } catch (error) {
    return res.status(500).json({ error: "Erro interno", detail: String(error) });
  }
}
// frontend/src/components/TodosProdutos.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/data/images";

type Produto = {
  titulo: string;
  produtoId: string;
  descricao: string;
  imagem: string;
};

export function TodosProdutos() {
  const produtos: Produto[] = [
    {
      titulo: "Análise Secreta do Seu Signo",
      produtoId: "analise_secreta_signo",
      descricao: "Revelações profundas sobre sua energia única.",
      imagem: IMAGES.analiseSecreta,
    },
    {
      titulo: "Seu Ano em 3 Palavras",
      // ✅ ID OFICIAL (corrigido)
      produtoId: "seu_ano_em_3_palavras",
      descricao: "Um direcionamento rápido e direto para o seu ano.",
      imagem: IMAGES.seuAno3Palavras,
    },
    // ✅ mantenha os demais produtos aqui com os IDs do backend/products.js
  ];

  function goToCheckout(produtoId: string) {
    const url = `/checkout?produtoId=${encodeURIComponent(produtoId)}`;
    window.location.href = url;
  }

  return (
    <section className="w-full py-10">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6">
          Produtos
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {produtos.map((p) => (
            <Card key={p.produtoId} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="w-full aspect-[16/9] bg-black/5">
                  <img
                    src={p.imagem}
                    alt={p.titulo}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="p-4">
                  <div className="text-lg font-semibold">{p.titulo}</div>
                  <div className="text-sm opacity-80 mt-1">{p.descricao}</div>

                  <div className="mt-4">
                    <Button
                      className="w-full"
                      onClick={() => goToCheckout(p.produtoId)}
                    >
                      Comprar
                    </Button>
                  </div>

                  <div className="mt-2 text-xs opacity-60 break-all">
                    ID: {p.produtoId}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
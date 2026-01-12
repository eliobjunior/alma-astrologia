import { HeaderBeneficios } from "@/components/HeaderBeneficios";
import { TodosProdutos } from "@/components/TodosProdutos";

export default function Index() {
  return (
    <main className="min-h-screen bg-[#05040D] text-white">
      <HeaderBeneficios />
      <TodosProdutos />
    </main>
  );
}
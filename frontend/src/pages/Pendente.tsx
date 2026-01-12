export default function Pendente() {
  return (
    <div className="min-h-screen bg-[#05040D] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0A0A1A] border border-[#222] rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-yellow-400 mb-4">
          Pagamento em processamento
        </h1>

        <p className="text-gray-300 mb-6">
          Seu pagamento está sendo analisado.  
          Assim que for confirmado, iniciaremos sua leitura.
        </p>

        <p className="text-sm text-gray-400 mb-6">
          Você não precisa fazer mais nada agora.
        </p>

        <button
          onClick={() => (window.location.href = "/")}
          className="w-full bg-yellow-400 text-black font-semibold py-2 rounded hover:bg-yellow-300"
        >
          Voltar ao site
        </button>
      </div>
    </div>
  );
}
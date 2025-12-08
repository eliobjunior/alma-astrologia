import React, { useState } from "react";

export default function FormDadosCliente({ onSubmit }) {
  const [form, setForm] = useState({
    nome: "",
    data: "",
    hora: "",
    cidade: "",
    estado: "",
    pais: "",
    whatsapp: "",
    email: ""
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function enviar(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={enviar} className="max-w-md mx-auto space-y-4">
      <input name="nome" placeholder="Nome completo" required onChange={handleChange} className="w-full p-2 rounded bg-zinc-800" />
      <input name="data" type="date" required onChange={handleChange} className="w-full p-2 rounded bg-zinc-800" />
      <input name="hora" type="time" required onChange={handleChange} className="w-full p-2 rounded bg-zinc-800" />
      <input name="cidade" placeholder="Cidade" required onChange={handleChange} className="w-full p-2 rounded bg-zinc-800" />
      <input name="estado" placeholder="Estado" required onChange={handleChange} className="w-full p-2 rounded bg-zinc-800" />
      <input name="pais" placeholder="País" required onChange={handleChange} className="w-full p-2 rounded bg-zinc-800" />
      <input name="whatsapp" placeholder="WhatsApp" required onChange={handleChange} className="w-full p-2 rounded bg-zinc-800" />
      <input name="email" type="email" placeholder="E-mail" required onChange={handleChange} className="w-full p-2 rounded bg-zinc-800" />

      <button className="w-full bg-purple-600 text-white py-2 rounded">
        Continuar para pagamento
      </button>
    </form>
  );
}
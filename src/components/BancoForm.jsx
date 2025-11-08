// src/components/BancoForm.jsx
import { useState } from "react";
import { parseValor } from "./utils";

export default function BancoForm({ onAdd }) {
    const [nome, setNome] = useState("");
    const [valor, setValor] = useState("");

    return (
        <>
            <input
                type="text"
                placeholder="Nome do banco"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
            />
            <input
                type="number"
                placeholder="Valor devido"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
            />
            <button
                onClick={() => {
                    if (!nome || !valor) return alert("Preencha todos os campos!");
                    onAdd({ nome, valor: parseValor(valor) });
                    setNome("");
                    setValor("");
                }}
            >
                Adicionar
            </button>
        </>
    );
}

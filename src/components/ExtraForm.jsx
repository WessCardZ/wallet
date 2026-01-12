// src/components/ExtraForm.jsx
import { useState } from "react";
import { parseValor } from "./utils";

export default function ExtraForm({ onAdd }) {
    const [horas, setHoras] = useState("");
    const [minutos, setMinutos] = useState("");
    const [valorHora, setValorHora] = useState("");

    return (
        <>
            <input
                type="number"
                placeholder="Horas"
                value={horas}
                onChange={(e) => setHoras(e.target.value)}
            />
            <input
                type="number"
                placeholder="Minutos"
                value={minutos}
                onChange={(e) => setMinutos(e.target.value)}
            />
            <input
                type="number"
                placeholder="Valor/h"
                value={valorHora}
                onChange={(e) => setValorHora(e.target.value)}
            />
            <button
                className="btn btn-indigo"
                onClick={() => {
                    if (!valorHora) return alert("Informe o valor da hora extra!");
                    onAdd({
                        horas: parseValor(horas),
                        minutos: parseValor(minutos),
                        valorHora: parseValor(valorHora),
                    });
                    setHoras("");
                    setMinutos("");
                    setValorHora("");
                }}
            >
                Adicionar
            </button>
        </>
    );
}

import { useState } from "react";
import { parseValor } from "./utils";

export default function BancoForm({ onAdd }) {
    const [nome, setNome] = useState("");
    const [valor, setValor] = useState("");
    const [pago, setPago] = useState(false);
    const [ehMeu, setEhMeu] = useState(true);
    const [dono, setDono] = useState("");

    const adicionarBanco = () => {
        if (!nome || !valor) return alert("Preencha todos os campos!");

        if (!ehMeu && !dono.trim()) {
            return alert("Informe de quem é a conta!");
        }

        onAdd({
            nome,
            valor: parseValor(valor),
            pago,
            ehMeu,
            dono: ehMeu ? "" : dono.trim(),
        });

        setNome("");
        setValor("");
        setPago(false);
        setEhMeu(true);
        setDono("");
    };

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

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 5,
                }}
            >
                <label
                    htmlFor="checkboxEhMeu"
                    style={{
                        cursor: "pointer",
                        userSelect: "none",
                    }}
                >
                    Afeta o meu salário (é minha conta)
                </label>

                <input
                    id="checkboxEhMeu"
                    type="checkbox"
                    checked={ehMeu}
                    onChange={(e) => setEhMeu(e.target.checked)}
                    style={{
                        width: 20,
                        height: 20,
                        margin: 0,
                        alignSelf: "center",
                        cursor: "pointer",
                    }}
                />
            </div>



            {!ehMeu && (
                <input
                    type="text"
                    placeholder="De quem é a conta?"
                    value={dono}
                    onChange={(e) => setDono(e.target.value)}
                />
            )}

            <button onClick={adicionarBanco}>Adicionar</button>
        </>
    );
}

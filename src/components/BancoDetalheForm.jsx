// src/components/BancoDetalheForm.jsx
import { useState } from "react";
import { parseValor } from "./utils";

export default function BancoDetalheForm({ bancoBase, mesSelecionado, anoSelecionado, onCancelar, onConfirmar }) {
    const [valor, setValor] = useState("");
    const [ehMeu, setEhMeu] = useState(true);
    const [parcelado, setParcelado] = useState(false);
    const [numParcelas, setNumParcelas] = useState(1);

    const adicionarBanco = () => {
        if (!valor) return alert("Informe o valor!");

        const novoBanco = {
            nome: bancoBase.nome,
            valor: parseValor(valor),
            pago: false,
            ehMeu,
            parcelado,
            numParcelas,
            mesInicial: mesSelecionado,
            anoInicial: anoSelecionado,
        };

        onConfirmar(novoBanco);
    };

    return (
        <div className="banco-detalhe-form">
            <h3>Adicionar {bancoBase.nome}</h3>

            <label>
                Valor:
                <input
                    type="number"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="Valor devido"
                />
            </label>

            <label>
                <input
                    type="checkbox"
                    checked={ehMeu}
                    onChange={(e) => setEhMeu(e.target.checked)}
                />
                Conta é minha (afeta salário)
            </label>

            <label>
                <input
                    type="checkbox"
                    checked={parcelado}
                    onChange={(e) => setParcelado(e.target.checked)}
                />
                Conta parcelada
            </label>

            {parcelado && (
                <label>
                    Número de parcelas:
                    <input
                        type="number"
                        min="1"
                        value={numParcelas}
                        onChange={(e) => setNumParcelas(Number(e.target.value))}
                    />
                </label>
            )}

            <div className="acoes">
                <button onClick={onCancelar}>Cancelar</button>
                <button onClick={adicionarBanco}>Salvar</button>
            </div>
        </div>
    );
}

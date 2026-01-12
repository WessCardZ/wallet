import React from "react";
import { signOut } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../pages/style.css";

export default function Sidebar({
    mesSelecionado,
    setMesSelecionado,
    anoSelecionado,
    resumo,
    setSecaoAtiva,
}) {
    const navigate = useNavigate();

    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril",
        "Maio", "Junho", "Julho", "Agosto",
        "Setembro", "Outubro", "Novembro", "Dezembro",
    ];

    return (
        <aside className="sidebar">
            <div className="headerContainer">
                <div>
                    <h1>Sobrinha</h1>
                </div>

                <button
                    className="btn-logout"
                    onClick={async () => {
                        await signOut();
                        navigate('/');
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        className="icon-logout"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                        />
                    </svg>
                    Sair
                </button>
            </div>

            <select
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(parseInt(e.target.value))}
            >
                {meses.map((mes, i) => (
                    <option key={i} value={i}>
                        {mes} {anoSelecionado} {i === new Date().getMonth() ? "📅 (atual)" : ""}
                    </option>
                ))}
            </select>

            <div className="saldo">
                <p><strong>📊 Resumo do Mês</strong></p>
                <p><strong>Dias trabalhados:</strong></p>
                <h2>{resumo.diasMes}</h2>

                <hr />

                <p><strong>📈 Projeção para {meses[(mesSelecionado + 1) % 12]}</strong></p>
                <p><strong>Rendimento estimado:</strong></p>
                <h2>R$ {Number(resumo.saldo || 0).toFixed(2)}</h2>

                <p><strong>Gastos previstos:</strong></p>
                <h2>R$ {Number(resumo.gastos || 0).toFixed(2)}</h2>

                <p><strong>Sobra esperada:</strong></p>
                <h2>R$ {Number(resumo.sobra || 0).toFixed(2)}</h2>
            </div>

            <div className="buttons">
                <button className="btn btn-indigo" onClick={() => setSecaoAtiva("")}>🏠 Voltar</button>
                <button className="btn btn-indigo" onClick={() => setSecaoAtiva("config")}>⚙️ Configurar</button>
            </div>
        </aside>
    );
}

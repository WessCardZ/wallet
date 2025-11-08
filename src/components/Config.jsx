import { salvarWallet } from "../firebase";
import "../pages/style.css";

export default function Config({ dados, setDados, secaoAtiva, setSecaoAtiva, mesSelecionado, anoSelecionado }) {
    return (
        <section className="card">
            <h2>Configuração de Rendimento</h2>
            <select
                value={dados.tipo}
                onChange={(e) => setDados({ ...dados, tipo: e.target.value })}
            >
                <option value="pj">PJ (por hora)</option>
                <option value="clt">CLT (salário fixo)</option>
            </select>

            {dados.tipo === "pj" ? (
                <>
                    <label>Valor por hora (R$):</label>
                    <input
                        type="number"
                        value={dados.valorHora}
                        onChange={(e) =>
                            setDados({
                                ...dados,
                                valorHora: parseFloat(e.target.value),
                            })
                        }
                    />

                    <label>Horas por dia:</label>
                    <input
                        type="number"
                        value={dados.horasDia}
                        onChange={(e) =>
                            setDados({
                                ...dados,
                                horasDia: parseFloat(e.target.value),
                            })
                        }
                    />

                    <label>Minutos por dia:</label>
                    <input
                        type="number"
                        value={dados.minutosDia}
                        onChange={(e) =>
                            setDados({
                                ...dados,
                                minutosDia: parseFloat(e.target.value),
                            })
                        }
                    />

                    <label>Dias trabalhados na semana:</label>
                    <div className="dias-semana">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                            (d, i) => (
                                <label key={i}>
                                    <input
                                        type="checkbox"
                                        value={i}
                                        checked={dados.diasTrabalhados.includes(i)}
                                        onChange={(e) => {
                                            const dia = parseInt(e.target.value);
                                            const dias = [...dados.diasTrabalhados];
                                            if (e.target.checked) {
                                                if (!dias.includes(dia)) dias.push(dia);
                                            } else {
                                                const idx = dias.indexOf(dia);
                                                if (idx > -1) dias.splice(idx, 1);
                                            }
                                            setDados({
                                                ...dados,
                                                diasTrabalhados: dias,
                                            });
                                        }}
                                    />
                                    {d}
                                </label>
                            )
                        )}
                    </div>

                    <button
                        style={{ marginBottom: "8px" }}
                        onClick={() =>
                            setSecaoAtiva(
                                secaoAtiva === "diasRemovidos"
                                    ? "config"
                                    : "diasRemovidos"
                            )
                        }
                    >
                        🗓️ Gerenciar dias não trabalhados
                    </button>

                    <button
                        onClick={async () => {
                            if (!dados.uid) return alert("Usuário não identificado!");

                            const dadosAtualizados = { ...dados };

                            await salvarWallet(
                                dados.uid,
                                dadosAtualizados,
                                mesSelecionado,
                                anoSelecionado
                            );
                            alert("💾 Configurações salvas com sucesso!");
                        }}
                    >
                        Salvar
                    </button>
                </>
            ) : (
                <>
                    <label>Salário mensal (R$):</label>
                    <input
                        type="number"
                        value={dados.salarioMensal}
                        onChange={(e) =>
                            setDados({
                                ...dados,
                                salarioMensal: parseFloat(e.target.value),
                            })
                        }
                    />
                    {/* <label>Valor hora extra (R$):</label>
                                    <input
                                        type="number"
                                        value={dados.valorHoraClt}
                                        onChange={(e) =>
                                            setDados({
                                                ...dados,
                                                valorHoraClt: parseFloat(e.target.value) || 0,
                                            })
                                        }
                                    /> */}
                    <button
                        onClick={async () => {
                            if (!dados.uid) return alert("Usuário não identificado!");
                            const novosDados = { ...dados };
                            await salvarWallet(
                                dados.uid,
                                novosDados,
                                mesSelecionado,
                                anoSelecionado
                            );
                            alert("💾 Configurações CLT salvas com sucesso!");
                        }}
                    >
                        Salvar
                    </button>

                </>
            )}
        </section>
    )
}

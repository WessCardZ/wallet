import { salvarConfig } from "../firebase";
import "../pages/style.css";

export default function Config({ config, setConfig, secaoAtiva, setSecaoAtiva, mesSelecionado, anoSelecionado }) {
    return (
        <section className="card">
            <h2>Configuração de Rendimento</h2>
            <select
                value={config.tipo}
                onChange={(e) => setConfig({ ...config, tipo: e.target.value })}
            >
                <option value="pj">PJ (por hora)</option>
                <option value="clt">CLT (salário fixo)</option>
            </select>

            {config.tipo === "pj" ? (
                <>
                    <label>Valor por hora (R$):</label>
                    <input
                        type="number"
                        value={config.valorHora}
                        onChange={(e) =>
                            setConfig({
                                ...config,
                                valorHora: parseFloat(e.target.value),
                            })
                        }
                    />

                    <label>Horas por dia:</label>
                    <input
                        type="number"
                        value={config.horasDia}
                        onChange={(e) =>
                            setConfig({
                                ...config,
                                horasDia: parseFloat(e.target.value),
                            })
                        }
                    />

                    <label>Minutos por dia:</label>
                    <input
                        type="number"
                        value={config.minutosDia}
                        onChange={(e) =>
                            setConfig({
                                ...config,
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
                                        checked={config.diasTrabalhados.includes(i)}
                                        onChange={(e) => {
                                            const dia = parseInt(e.target.value);
                                            const dias = [...config.diasTrabalhados];
                                            if (e.target.checked) {
                                                if (!dias.includes(dia)) dias.push(dia);
                                            } else {
                                                const idx = dias.indexOf(dia);
                                                if (idx > -1) dias.splice(idx, 1);
                                            }
                                            setConfig({
                                                ...config,
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
                            if (!config.uid) return alert("Usuário não identificado!");

                            await salvarConfig(config.uid, {
                                tipo: config.tipo,
                                horasDia: config.horasDia,
                                minutosDia: config.minutosDia,
                                valorHora: config.valorHora,
                                diasTrabalhados: config.diasTrabalhados
                            });

                            alert("💾 Configuração da conta atualizada!");
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
                        value={config.salarioMensal}
                        onChange={(e) =>
                            setConfig({
                                ...config,
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
                            if (!config.uid) return alert("Usuário não identificado!");
                            await salvarConfig(config.uid, {
                                tipo: config.tipo,
                                horasDia: config.horasDia,
                                minutosDia: config.minutosDia,
                                valorHora: config.valorHora,
                                diasTrabalhados: config.diasTrabalhados
                            });

                            alert("💾 Configuração da conta atualizada!");
                        }}
                    >
                        Salvar
                    </button>

                </>
            )}
        </section>
    )
}

import { salvarWallet } from "../firebase";
import "../pages/style.css";

export default function DiasRemovidos({ dados, setDados, secaoAtiva, setSecaoAtiva, mesSelecionado, anoSelecionado }) {
    return (
        <section className="card">
            <h2>Dias Não Trabalhados - {[
                "Janeiro", "Fevereiro", "Março", "Abril",
                "Maio", "Junho", "Julho", "Agosto",
                "Setembro", "Outubro", "Novembro", "Dezembro"
            ][mesSelecionado]} {anoSelecionado}</h2>

            <div className="dias-mes">
                {(() => {
                    const ano = anoSelecionado;
                    const mes = mesSelecionado;
                    const diasMes = new Date(ano, mes + 1, 0).getDate();
                    const diasTrabalhadosSemana = dados.diasTrabalhados.map(Number);

                    let diasRender = [];
                    for (let i = 1; i <= diasMes; i++) {
                        const diaSemana = new Date(ano, mes, i).getDay();
                        if (diasTrabalhadosSemana.includes(diaSemana)) {
                            diasRender.push(
                                <label key={i} style={{ marginRight: "10px" }}>
                                    <input
                                        type="checkbox"
                                        checked={!dados.diasRemovidos.includes(i)}
                                        onChange={() => {
                                            setDados((prev) => {
                                                const diasRemovidos = [...prev.diasRemovidos];
                                                if (diasRemovidos.includes(i)) {
                                                    return {
                                                        ...prev,
                                                        diasRemovidos: diasRemovidos.filter((d) => d !== i),
                                                    };
                                                } else {
                                                    return { ...prev, diasRemovidos: [...diasRemovidos, i] };
                                                }
                                            });
                                        }}
                                    />
                                    {i}
                                </label>
                            );
                        }
                    }
                    return diasRender;
                })()}
            </div>

            <button
                style={{ marginTop: "10px" }}
                onClick={async () => {
                    if (!dados.uid) return alert("Usuário não identificado!");
                    try {
                        const novosDados = { ...dados };
                        await salvarWallet(dados.uid, novosDados, mesSelecionado, anoSelecionado);
                        alert("✅ Dias não trabalhados salvos com sucesso!");
                        setSecaoAtiva("config");
                    } catch (err) {
                        console.error("❌ Erro ao salvar dias removidos:", err);
                        alert("Erro ao salvar dias não trabalhados!");
                    }
                }}
            >
                Salvar
            </button>
        </section>
    )
}

import "../pages/style.css";

export default function DiasRemovidos({
    config,
    wallet,
    setWallet,
    mesSelecionado,
    anoSelecionado,
    setSecaoAtiva
}) {
    if (!config) return null;

    const diasMes = new Date(
        anoSelecionado,
        mesSelecionado + 1,
        0
    ).getDate();

    return (
        <section className="card">
            <h2>
                Dias Não Trabalhados –{" "}
                {[
                    "Janeiro", "Fevereiro", "Março", "Abril",
                    "Maio", "Junho", "Julho", "Agosto",
                    "Setembro", "Outubro", "Novembro", "Dezembro"
                ][mesSelecionado]} {anoSelecionado}
            </h2>

            <div className="dias-mes">
                {Array.from({ length: diasMes }, (_, i) => i + 1).map((dia) => {
                    const diaSemana = new Date(
                        anoSelecionado,
                        mesSelecionado,
                        dia
                    ).getDay();

                    if (!config.diasTrabalhados.includes(diaSemana)) return null;

                    const removido = wallet.diasRemovidos.includes(dia);

                    return (
                        <label key={dia} style={{ marginRight: 10 }}>
                            <input
                                type="checkbox"
                                checked={!removido}
                                onChange={() => {
                                    const diasRemovidos = removido
                                        ? wallet.diasRemovidos.filter((d) => d !== dia)
                                        : [...wallet.diasRemovidos, dia];

                                    setWallet({
                                        ...wallet,
                                        diasRemovidos
                                    });
                                }}
                            />
                            {dia}
                        </label>
                    );
                })}
            </div>

            <button
                style={{ marginTop: 10 }}
                onClick={() => setSecaoAtiva("config")}
            >
                Voltar
            </button>
        </section>
    );
}

import { useState, useEffect, useCallback } from "react";
import "./style.css";
import { auth, carregarWallet, salvarWallet, signOut } from "../firebase";
import { useNavigate } from "react-router-dom";

function parseValor(valor) {
    if (valor === "" || valor === null || valor === undefined) return 0;
    if (typeof valor === "string") valor = valor.replace(",", ".");
    const num = parseFloat(valor);
    return isNaN(num) ? 0 : num;
}


export default function Wallet() {
    const navigate = useNavigate();
    const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth()); // 0 = Janeiro
    const [anoSelecionado] = useState(new Date().getFullYear());

    const [dados, setDados] = useState({
        uid: "",
        tipo: "pj",
        valorHora: 0,
        horasDia: 0,
        minutosDia: 0,
        diasTrabalhados: [],
        salarioMensal: 0,
        valorHoraClt: 0,
        gastos: [],
        extras: [],
        bancos: [],
        diasRemovidos: [],
    });

    const [secaoAtiva, setSecaoAtiva] = useState("");
    const [resumo, setResumo] = useState({
        diasMes: 0,
        saldo: 0,
        gastos: 0,
        sobra: 0,
    });

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setDados((prev) => ({ ...prev, uid: user.uid }));
            } else {
                navigate("/");
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (!dados.uid) return;

        const carregar = async () => {
            const dadosFirebase = await carregarWallet(dados.uid, mesSelecionado, anoSelecionado);

            if (dadosFirebase) {
                setDados(prev => ({ ...prev, ...dadosFirebase }));
            } else {
                // Novo mês sem dados -> zera os campos
                setDados(prev => ({
                    ...prev,
                    tipo: "pj",
                    // valorHora: 0,
                    // horasDia: 0,
                    // minutosDia: 0,
                    // diasTrabalhados: [],
                    // salarioMensal: 0,
                    // valorHoraClt: 0,
                    gastos: [],
                    extras: [],
                    bancos: [],
                    // diasRemovidos: [],
                }));
            }

        };

        carregar();
    }, [dados.uid, mesSelecionado, anoSelecionado]);


    // useEffect(() => {
    //     if (!carregado || !dados.uid) return;

    //     salvarWallet(dados.uid, dados, mesSelecionado, anoSelecionado);
    // }, [dados, carregado, mesSelecionado, anoSelecionado]);


    const calcularDiasTrabalhados = useCallback(() => {
        if (dados.tipo !== "pj") return 30;
        const diasTrabalhados = dados.diasTrabalhados.map(Number);
        const diasMes = new Date(anoSelecionado, mesSelecionado + 1, 0).getDate();
        let total = 0;
        for (let i = 1; i <= diasMes; i++) {
            const diaSemana = new Date(anoSelecionado, mesSelecionado, i).getDay();
            if (diasTrabalhados.includes(diaSemana) && !dados.diasRemovidos.includes(i)) {
                total++;
            }
        }
        return total;
    }, [dados, anoSelecionado, mesSelecionado]);

    const calcularResumo = useCallback(() => {
        const dias = calcularDiasTrabalhados();
        let totalReceita = 0;

        if (dados.tipo === "pj") {
            const totalHorasDia = dados.horasDia + dados.minutosDia / 60;
            totalReceita = dias * totalHorasDia * dados.valorHora;
        } else {
            totalReceita = dados.salarioMensal;
        }

        const totalExtras = dados.extras.reduce((acc, e) => {
            const horas = e.horas + e.minutos / 60;
            return acc + horas * e.valorHora;
        }, 0);

        totalReceita += totalExtras;

        const totalGastos = dados.gastos.reduce((acc, g) => acc + g.valor, 0);
        const totalBancos = dados.bancos.reduce((acc, b) => acc + b.valor, 0);
        const sobra = totalReceita - (totalGastos + totalBancos);

        setResumo({
            diasMes: dias,
            saldo: totalReceita,
            gastos: totalGastos + totalBancos,
            sobra,
        });
    }, [dados, calcularDiasTrabalhados]);

    useEffect(() => {
        calcularResumo();
    }, [dados, calcularResumo]);

    // async function salvarManual() {
    //     if (!dados.uid) return alert("Usuário não identificado!");
    //     await salvarWallet(dados.uid, dados, mesSelecionado, anoSelecionado);
    //     alert("💾 Dados salvos com sucesso!");
    // }

    async function adicionarItem(tipo, item) {
        setDados((prev) => {
            const novo = { ...prev, [tipo]: [...prev[tipo], item] };
            salvarWallet(prev.uid, novo, mesSelecionado, anoSelecionado).then(async () => {
                const atualizados = await carregarWallet(prev.uid, mesSelecionado, anoSelecionado);
                if (atualizados) setDados((d) => ({ ...d, ...atualizados }));
            });
            return novo;
        });
    }

    async function removerItem(tipo, index) {
        if (!window.confirm("Tem certeza que deseja remover este item?")) return;

        setDados((prev) => {
            const novo = { ...prev, [tipo]: prev[tipo].filter((_, i) => i !== index) };
            salvarWallet(prev.uid, novo, mesSelecionado, anoSelecionado).then(async () => {
                const atualizados = await carregarWallet(prev.uid, mesSelecionado, anoSelecionado);
                if (atualizados) setDados((d) => ({ ...d, ...atualizados }));
            });
            return novo;
        });
    }

    async function editarItem(tipo, index, novoItem) {
        setDados((prev) => {
            const atualizado = [...prev[tipo]];
            atualizado[index] = novoItem;
            const novo = { ...prev, [tipo]: atualizado };
            salvarWallet(prev.uid, novo, mesSelecionado, anoSelecionado).then(async () => {
                const atualizados = await carregarWallet(prev.uid, mesSelecionado, anoSelecionado);
                if (atualizados) setDados((d) => ({ ...d, ...atualizados }));
            });
            return novo;
        });
    }

    async function addValor(tipo, index, novoValor) {
        setDados((prev) => {
            const atualizado = [...prev[tipo]];
            atualizado[index] = { ...atualizado[index], valor: novoValor };
            const novo = { ...prev, [tipo]: atualizado };
            salvarWallet(prev.uid, novo, mesSelecionado, anoSelecionado).then(async () => {
                const atualizados = await carregarWallet(prev.uid, mesSelecionado, anoSelecionado);
                if (atualizados) setDados((d) => ({ ...d, ...atualizados }));
            });
            return novo;
        });
    }

    return (
        <div className="wallet-container">

            <aside className="sidebar">
                <div className="headerContainer">
                    <div>

                        <h1>Wallet</h1>
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
                    {[
                        "Janeiro", "Fevereiro", "Março", "Abril",
                        "Maio", "Junho", "Julho", "Agosto",
                        "Setembro", "Outubro", "Novembro", "Dezembro"
                    ].map((mes, i) => (
                        <option key={i} value={i}>
                            {mes} {anoSelecionado} {i === new Date().getMonth() ? "📅 (atual)" : ""}
                        </option>
                    ))}
                </select>

                <div className="saldo">
                    {/* <p><strong>📆 {[
                        "Janeiro", "Fevereiro", "Março", "Abril",
                        "Maio", "Junho", "Julho", "Agosto",
                        "Setembro", "Outubro", "Novembro", "Dezembro"
                    ][mesSelecionado]} (mês atual)</strong></p> */}

                    <p><strong>📊 Resumo do Mês</strong></p>

                    <p><strong>Dias trabalhados:</strong></p>
                    <h2>{resumo.diasMes}</h2>

                    <hr />

                    <p><strong>📈 Projeção para {[
                        "Janeiro", "Fevereiro", "Março", "Abril",
                        "Maio", "Junho", "Julho", "Agosto",
                        "Setembro", "Outubro", "Novembro", "Dezembro"
                    ][(mesSelecionado + 1) % 12]}</strong></p>

                    <p><strong>Rendimento estimado:</strong></p>
                    <h2>R$ {Number(resumo.saldo || 0).toFixed(2)}</h2>

                    <p><strong>Gastos previstos:</strong></p>
                    <h2>R$ {Number(resumo.gastos || 0).toFixed(2)}</h2>

                    <p><strong>Sobra esperada:</strong></p>
                    <h2>R$ {Number(resumo.sobra || 0).toFixed(2)}</h2>
                </div>


                <div className="buttons">
                    <button onClick={() => setSecaoAtiva("")}>🏠 Voltar</button>
                    <button onClick={() => setSecaoAtiva("config")}>⚙️ Configurar</button>
                    <button onClick={() => setSecaoAtiva("gasto")}>➕ Adicionar Gasto</button>
                    <button onClick={() => setSecaoAtiva("extra")}>⏱️ Horas Extras</button>
                    <button onClick={() => setSecaoAtiva("banco")}>🏦 Bancos / Cartões</button>

                    {/* 🔹 Novo botão de salvar manual */}
                    {/* <button
                        style={{ backgroundColor: "#27ae60", color: "#fff", marginTop: "10px", height: "40px" }}
                        onClick={salvarManual}
                    >
                        💾 Salvar Wallet
                    </button> */}
                </div>
            </aside>

            <main className="content">
                {secaoAtiva === "" && (
                    <>
                        <section className="card" id="gastosList">
                            <h2>Gastos do Mês</h2>
                            {dados.gastos.length === 0 ? (
                                <p>Nenhum gasto registrado neste mês.</p>
                            ) : (
                                <Lista
                                    itens={dados.gastos}
                                    tipo="gasto"
                                    onRemover={(i) => removerItem("gastos", i)}
                                    onEditar={(i, novoItem) => editarItem("gastos", i, novoItem)}
                                    onAddValor={(i, valor) => addValor("gastos", i, valor)}
                                />
                            )}
                        </section>

                        <section className="card" id="bancosList">
                            <h2>Bancos / Cartões</h2>
                            {dados.bancos.length === 0 ? (
                                <p>Nenhum banco/cartão registrado neste mês.</p>
                            ) : (
                                <Lista
                                    itens={dados.bancos}
                                    tipo="banco"
                                    onRemover={(i) => removerItem("bancos", i)}
                                    onEditar={(i, novoItem) => editarItem("bancos", i, novoItem)}
                                    onAddValor={(i, valor) => addValor("bancos", i, valor)}
                                />
                            )}
                        </section>
                    </>
                )}

                {secaoAtiva === "config" && (
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
                                    onFocus={(e) => {
                                        if (e.target.value === "0") setDados({ ...dados, valorHora: "" });
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === "") setDados({ ...dados, valorHora: 0 });
                                    }}
                                    onChange={(e) => setDados({ ...dados, valorHora: parseValor(e.target.value) })}
                                />
                                <label>Horas por dia:</label>
                                <input
                                    type="number"
                                    value={dados.horasDia}
                                    onFocus={(e) => {
                                        if (e.target.value === "0") setDados({ ...dados, horasDia: "" });
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === "") setDados({ ...dados, horasDia: 0 });
                                    }}
                                    onChange={(e) => setDados({ ...dados, horasDia: parseValor(e.target.value) })}
                                />
                                <label>Minutos por dia:</label>
                                <input
                                    type="number"
                                    value={dados.minutosDia}
                                    onFocus={(e) => {
                                        if (e.target.value === "0") setDados({ ...dados, minutosDia: "" });
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === "") setDados({ ...dados, minutosDia: 0 });
                                    }}
                                    onChange={(e) => setDados({ ...dados, minutosDia: parseValor(e.target.value) })}
                                />
                                <label>Dias trabalhados na semana:</label>
                                <div className="dias-semana">
                                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => (
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
                                                    setDados({ ...dados, diasTrabalhados: dias });
                                                }}
                                            />
                                            {d}
                                        </label>
                                    ))}
                                </div>

                                <button
                                    style={{ marginBottom: '8px' }}
                                    onClick={() =>
                                        setSecaoAtiva(secaoAtiva === "diasRemovidos" ? "config" : "diasRemovidos")
                                    }
                                >
                                    🗓️ Gerenciar dias não trabalhados
                                </button>
                            </>
                        ) : (
                            <>
                                <label>Salário mensal (R$):</label>
                                <input
                                    type="number"
                                    value={dados.salarioMensal}
                                    onFocus={(e) => {
                                        if (e.target.value === "0") setDados({ ...dados, salarioMensal: "" });
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === "") setDados({ ...dados, salarioMensal: 0 });
                                    }}
                                    onChange={(e) => setDados({ ...dados, salarioMensal: parseValor(e.target.value) })}
                                />
                                <label>Valor hora extra (R$):</label>
                                <input
                                    type="number"
                                    value={dados.valorHoraClt}
                                    onFocus={(e) => {
                                        if (e.target.value === "0") setDados({ ...dados, valorHoraClt: "" });
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === "") setDados({ ...dados, valorHoraClt: 0 });
                                    }}
                                    onChange={(e) => setDados({ ...dados, valorHoraClt: parseValor(e.target.value) })}
                                />
                            </>
                        )}
                        <button onClick={() => alert("Configurações salvas!")}>Salvar</button>
                    </section>
                )}

                {secaoAtiva === "diasRemovidos" && (
                    <section className="card">
                        <h2>Dias Não Trabalhados</h2>
                        <div className="dias-mes">
                            {(() => {
                                const hoje = new Date();
                                const ano = hoje.getFullYear();
                                const mes = hoje.getMonth();
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
                            onClick={() => {
                                alert("✅ Dias não trabalhados atualizados!");
                                setSecaoAtiva("config");
                            }}
                        >
                            Salvar
                        </button>
                    </section>
                )}

                {secaoAtiva === "gasto" && (
                    <section className="card" id="gastosList">
                        <h2>Adicionar Gasto</h2>
                        <GastoForm onAdd={(g) => adicionarItem("gastos", g)} />
                        <Lista itens={dados.gastos} tipo="gasto" onRemover={(i) => removerItem("gastos", i)} />
                    </section>
                )}

                {secaoAtiva === "extra" && (
                    <section className="card">
                        <h2>Adicionar Horas Extras</h2>
                        <ExtraForm onAdd={(e) => adicionarItem("extras", e)} />
                        <Lista itens={dados.extras} tipo="extra" onRemover={(i) => removerItem("extras", i)} />
                    </section>
                )}

                {secaoAtiva === "banco" && (
                    <section className="card" id="bancosList">
                        <h2>Adicionar Banco / Cartão</h2>
                        <BancoForm onAdd={(b) => adicionarItem("bancos", b)} />
                        <Lista itens={dados.bancos} tipo="banco" onRemover={(i) => removerItem("bancos", i)} />
                    </section>
                )}
            </main>
        </div>
    );
}

// 🔹 COMPONENTES AUXILIARES 🔹
function GastoForm({ onAdd }) {
    const [nome, setNome] = useState("");
    const [valor, setValor] = useState("");

    return (
        <>
            <input
                type="text"
                placeholder="Nome do gasto"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
            />
            <input
                type="number"
                placeholder="Valor (R$)"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
            />
            <button
                onClick={() => {
                    if (!nome || !valor) return alert("Preencha os campos!");
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

function ExtraForm({ onAdd }) {
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
                onClick={() => {
                    if (!valorHora) return alert("Informe o valor da hora extra!");
                    onAdd({
                        horas: parseValor(horas) || 0,
                        minutos: parseValor(minutos) || 0,
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

function BancoForm({ onAdd }) {
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

function Lista({ itens, tipo, onRemover, onEditar, onAddValor }) {
    const [editIndex, setEditIndex] = useState(null);
    const [editItem, setEditItem] = useState({});
    const [addValueIndex, setAddValueIndex] = useState(null);
    const [addValue, setAddValue] = useState("");

    return (
        <ul>
            {itens.map((item, i) => (
                <li key={i}>
                    {editIndex === i ? (
                        <>
                            <input
                                className="list"
                                type="text"
                                value={editItem.nome}
                                onChange={(e) => setEditItem({ ...editItem, nome: e.target.value })}
                            />
                            <input
                                className="list"
                                type="number"
                                value={editItem.valor}
                                onChange={(e) => setEditItem({ ...editItem, valor: parseValor(e.target.value) })}
                            />

                            <div className="acoes-item">
                                <button
                                    className="btn-acao salvar"
                                    onClick={() => {
                                        onEditar(i, editItem);
                                        setEditIndex(null);
                                    }}
                                    title="Salvar alterações"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </button>

                                <button
                                    className="btn-acao cancelar"
                                    onClick={() => setEditIndex(null)}
                                    title="Cancelar edição"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    ) : addValueIndex === i ? (
                        <>
                            <span>{item.nome} - R$ {item.valor.toFixed(2)}</span>
                            <input
                                className="list"
                                type="number"
                                placeholder="Valor a adicionar"
                                value={addValue}
                                onChange={(e) => setAddValue(e.target.value)}
                            />

                            <div className="acoes-item">
                                <button
                                    className="btn-acao salvar"
                                    onClick={() => {
                                        const valorSomado = item.valor + parseValor(addValue || 0);
                                        onAddValor(i, valorSomado);
                                        setAddValue("");
                                        setAddValueIndex(null);
                                    }}
                                    title="Adicionar valor"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="16"></line>
                                        <line x1="8" y1="12" x2="16" y2="12"></line>
                                    </svg>
                                </button>

                                <button
                                    className="btn-acao cancelar"
                                    onClick={() => setAddValueIndex(null)}
                                    title="Cancelar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {tipo === "gasto" && `${item.nome} - R$ ${item.valor.toFixed(2)}`}
                            {tipo === "extra" && `${item.horas}h ${item.minutos}m - R$ ${item.valorHora.toFixed(2)}/h`}
                            {tipo === "banco" && `${item.nome} - R$ ${item.valor.toFixed(2)}`}

                            <div className="acoes-item">
                                {tipo !== "extra" && (
                                    <button
                                        className="btn-acao adicionar"
                                        onClick={() => { setAddValueIndex(i); setAddValue(""); }}
                                        title="Adicionar ao valor"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="16"></line>
                                            <line x1="8" y1="12" x2="16" y2="12"></line>
                                        </svg>
                                    </button>
                                )}
                                {tipo !== "extra" && (
                                    <button
                                        className="btn-acao editar"
                                        onClick={() => { setEditIndex(i); setEditItem(item); }}
                                        title="Editar item"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 20h9"></path>
                                            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                                        </svg>
                                    </button>
                                )}
                                <button
                                    className="btn-acao remover"
                                    onClick={() => onRemover(i)}
                                    title="Remover item"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                </button>
                            </div>
                        </>

                    )}
                </li>
            ))}
        </ul>
    );
}



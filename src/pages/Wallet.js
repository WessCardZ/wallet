import { useState, useEffect, useCallback } from "react";
import "./style.css";
import "./sidebar.css"
import {
    auth,
    carregarWallet,
    salvarWallet,
    carregarConfig
} from "../firebase";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import BancoForm from "../components/BancoForm";
import Lista from "../components/Lista";
import ExtraForm from "../components/ExtraForm";
import GastoForm from "../components/GastoForm";
import Config from "../components/Config";
import DiasRemovidos from "../components/DiasRemovidos";

const gerarId = () => {
    return Date.now().toString() + Math.random().toString(36).substring(2);
};

export default function Wallet() {
    const navigate = useNavigate();

    const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
    const [anoSelecionado] = useState(new Date().getFullYear());

    const [config, setConfig] = useState(null);

    const [wallet, setWallet] = useState({
        gastos: [],
        gastosFixos: [],
        extras: [],
        diasRemovidos: [],
        bancos: [],
    });

    const [secaoAtiva, setSecaoAtiva] = useState("");

    const [resumo, setResumo] = useState({
        diasMes: 0,
        saldo: 0,
        gastos: 0,
        sobra: 0,
    });

    /* =======================
       AUTH + CONFIG
    ======================= */
    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                navigate("/");
                return;
            }

            const cfg = await carregarConfig(user.uid);
            if (!cfg) {
                navigate("/config");
                return;
            }

            setConfig({ ...cfg, uid: user.uid });
        });

        return unsub;
    }, [navigate]);

    /* =======================
       WALLET DO MÊS
    ======================= */
    useEffect(() => {
        if (!config?.uid) return;

        async function carregar() {
            const dados = await carregarWallet(
                config.uid,
                mesSelecionado,
                anoSelecionado
            );

            setWallet({
                gastos: dados?.gastos ?? [],
                gastosFixos: dados?.gastosFixos ?? [],
                extras: dados?.extras ?? [],
                diasRemovidos: dados?.diasRemovidos ?? [],
                bancos: dados?.bancos ?? [],
            });
        }

        carregar();
    }, [config, mesSelecionado, anoSelecionado]);

    /* =======================
       DIAS TRABALHADOS
    ======================= */
    const calcularDiasTrabalhados = useCallback(() => {
        if (!config || config.tipo !== "pj") return 30;

        const diasMes = new Date(
            anoSelecionado,
            mesSelecionado + 1,
            0
        ).getDate();

        let total = 0;

        for (let i = 1; i <= diasMes; i++) {
            const diaSemana = new Date(
                anoSelecionado,
                mesSelecionado,
                i
            ).getDay();

            if (
                config.diasTrabalhados.includes(diaSemana) &&
                !wallet.diasRemovidos.includes(i)
            ) {
                total++;
            }
        }

        return total;
    }, [config, wallet, mesSelecionado, anoSelecionado]);

    /* =======================
       RESUMO FINANCEIRO
    ======================= */
    const calcularResumo = useCallback(() => {
        if (!config) return;

        const dias = calcularDiasTrabalhados();
        let receita = 0;

        if (config.tipo === "pj") {
            const horasDia = config.horasDia + config.minutosDia / 60;
            receita = dias * horasDia * config.valorHora;
        } else {
            receita = config.salarioMensal;
        }

        const extras = wallet.extras.reduce((acc, e) => {
            const horas = e.horas + e.minutos / 60;
            return acc + horas * e.valorHora;
        }, 0);

        receita += extras;

        const gastosFixos = wallet.gastosFixos.reduce(
            (a, g) => a + g.valor,
            0
        );

        const gastosBancos = wallet.bancos.reduce(
            (a, b) => b.ehMeu ? a + (b.valor ?? 0) : a,
            0
        );

        const gastosVariaveis = wallet.gastos.reduce(
            (a, g) => a + g.valor,
            0
        );

        const gastos = gastosFixos + gastosVariaveis + gastosBancos;

        setResumo({
            diasMes: dias,
            saldo: receita,
            gastos,
            sobra: receita - gastos,
        });
    }, [config, wallet, calcularDiasTrabalhados]);

    useEffect(() => {
        calcularResumo();
    }, [calcularResumo]);

    /* =======================
       SALVAR WALLET
    ======================= */
    async function atualizarWallet(novoWallet) {
        setWallet(novoWallet);
        await salvarWallet(
            config.uid,
            novoWallet,
            mesSelecionado,
            anoSelecionado
        );
    }

    function adicionarItem(tipo, item) {
        atualizarWallet({
            ...wallet,
            [tipo]: [...wallet[tipo], item],
        });
    }

    function removerItem(tipo, index) {
        if (!window.confirm("Deseja remover este item?")) return;

        atualizarWallet({
            ...wallet,
            [tipo]: wallet[tipo].filter((_, i) => i !== index),
        });
    }

    function editarItem(tipo, index, novoItem) {
        const atualizado = [...wallet[tipo]];
        atualizado[index] = novoItem;

        atualizarWallet({
            ...wallet,
            [tipo]: atualizado,
        });
    }

    function addValor(tipo, index, valor) {
        const atualizado = [...wallet[tipo]];
        atualizado[index] = { ...atualizado[index], valor };

        atualizarWallet({
            ...wallet,
            [tipo]: atualizado,
        });
    }

    /* =======================
       GASTOS FIXOS
    ======================= */

    async function adicionarGastoFixo(gasto) {
        const id = gerarId();

        const gastoFixo = {
            ...gasto,
            id,
            fixo: true,
            inicioMes: `${anoSelecionado}-${String(mesSelecionado + 1).padStart(2, "0")}`,
        };

        const mesInicial = mesSelecionado;
        const ano = anoSelecionado;

        for (let mes = mesInicial; mes < 12; mes++) {
            const walletMes = await carregarWallet(config.uid, mes, ano);

            const walletAtualizado = {
                gastos: walletMes?.gastos ?? [],
                gastosFixos: [
                    ...(walletMes?.gastosFixos ?? []),
                    gastoFixo,
                ],
                extras: walletMes?.extras ?? [],
                diasRemovidos: walletMes?.diasRemovidos ?? [],
                bancos: walletMes?.bancos ?? [],
            };

            await salvarWallet(
                config.uid,
                walletAtualizado,
                mes,
                ano
            );

            if (mes === mesSelecionado) {
                setWallet(walletAtualizado);
            }
        }
    }

    async function removerGastoFixo(index) {
        const gasto = wallet.gastosFixos[index];

        const opcao = window.prompt(
            "O que deseja fazer?\n\n" +
            "1 - Apagar somente este mês\n" +
            "2 - Apagar deste mês em diante\n\n" +
            "Cancelar - Não fazer nada"
        );

        if (opcao === null) return;

        if (opcao === "1") {
            const novoWallet = {
                ...wallet,
                gastosFixos: wallet.gastosFixos.filter((_, i) => i !== index),
            };

            await salvarWallet(
                config.uid,
                novoWallet,
                mesSelecionado,
                anoSelecionado
            );

            setWallet(novoWallet);
            return;
        }

        if (opcao === "2") {
            const mesBase = anoSelecionado * 12 + mesSelecionado;

            for (let ano = anoSelecionado; ano <= anoSelecionado + 5; ano++) {
                for (let mes = 0; mes < 12; mes++) {
                    const num = ano * 12 + mes;
                    if (num < mesBase) continue;

                    const w = await carregarWallet(config.uid, mes, ano);
                    if (!w) continue;

                    await salvarWallet(
                        config.uid,
                        {
                            ...w,
                            gastosFixos: w.gastosFixos?.filter(
                                g => g.id !== gasto.id
                            ) ?? [],
                        },
                        mes,
                        ano
                    );
                }
            }

            setWallet({
                ...wallet,
                gastosFixos: wallet.gastosFixos.filter((_, i) => i !== index),
            });

            return;
        }
    }

    function editarGastoFixo(index, novo) {
        const atualizado = [...wallet.gastosFixos];
        atualizado[index] = { ...atualizado[index], ...novo };

        atualizarWallet({
            ...wallet,
            gastosFixos: atualizado,
        });
    }

    /* =======================
       RENDER
    ======================= */
    return (
        <div className="wallet-container">
            <Sidebar
                mesSelecionado={mesSelecionado}
                setMesSelecionado={setMesSelecionado}
                anoSelecionado={anoSelecionado}
                resumo={resumo}
                setSecaoAtiva={setSecaoAtiva}
            />

            <main className="content">
                <div className="headerContent">
                    <div>
                        <h2>Painel de Controle Financeiro</h2>
                    </div>

                    <div className="containerButtonsHeader">
                        <button className="btn btn-indigo" onClick={() => setSecaoAtiva("gasto")}><span className="icon">➕</span> Adicionar Gasto</button>
                        <button className="btn btn-indigo" onClick={() => setSecaoAtiva("extra")}><span className="icon">⏱️</span> Horas Extras</button>
                        <button className="btn btn-indigo" onClick={() => setSecaoAtiva("banco")}><span className="icon">🏦</span> Bancos / Cartões</button>
                        <button className="btn btn-indigo" onClick={() => setSecaoAtiva("gastoFixo")}><span className="icon">➕</span> Gasto Fixo</button>
                    </div>
                </div>

                <div className="bodyContent">
                    {secaoAtiva === "" && (
                        <>
                            {wallet.gastos.length === 0 &&
                                wallet.bancos.length === 0 &&
                                wallet.gastosFixos.length === 0 ? (
                                <div>
                                    <h2>Não há dados cadastrados</h2>
                                </div>
                            ) : (
                                <>
                                    {wallet.gastos.length > 0 && (
                                        <section className="card" id="gastosList">
                                            <h2>Gastos do Mês</h2>
                                            <Lista
                                                itens={wallet.gastos}
                                                tipo="gasto"
                                                onRemover={(i) => removerItem("gastos", i)}
                                                onEditar={(i, item) =>
                                                    editarItem("gastos", i, item)
                                                }
                                                onAddValor={(i, v) =>
                                                    addValor("gastos", i, v)
                                                }
                                            />
                                        </section>
                                    )}

                                    {wallet.bancos.length > 0 && (
                                        <section className="card" id="bancosList">
                                            <h2>Bancos / Cartões</h2>
                                            <Lista
                                                itens={wallet.bancos}
                                                tipo="banco"
                                                onRemover={(i) => removerItem("bancos", i)}
                                                onEditar={(i, item) =>
                                                    editarItem("bancos", i, item)
                                                }
                                                onAddValor={(i, v) =>
                                                    addValor("bancos", i, v)
                                                }
                                            />
                                        </section>
                                    )}

                                    {wallet.gastosFixos.length > 0 && (
                                        <section className="card">
                                            <h2>Gastos Fixos</h2>
                                            <Lista
                                                itens={wallet.gastosFixos}
                                                tipo="gasto"
                                                onRemover={removerGastoFixo}
                                                onEditar={editarGastoFixo}
                                            />
                                        </section>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {secaoAtiva === "gastoFixo" && (
                        <section className="card">
                            <h2>Gastos Fixos</h2>
                            <GastoForm onAdd={adicionarGastoFixo} />
                            <hr />
                            {wallet.gastosFixos.length > 0 ? (
                                <Lista
                                    itens={wallet.gastosFixos}
                                    tipo="gasto"
                                    onRemover={removerGastoFixo}
                                    onEditar={editarGastoFixo}
                                />
                            ) : (
                                <div>
                                    <h2>Não há gastos fixos cadastrados</h2>
                                </div>
                            )}
                        </section>
                    )}

                    {secaoAtiva === "gasto" && (
                        <section className="card" id="gastosList">
                            <h2>Adicionar Gasto</h2>
                            <GastoForm onAdd={(g) => adicionarItem("gastos", g)} />
                            <hr />
                            {wallet.gastos.length > 0 ? (
                                <Lista
                                    itens={wallet.gastos}
                                    tipo="gasto"
                                    onRemover={(i) => removerItem("gastos", i)}
                                    onEditar={(i, novoItem) => editarItem("gastos", i, novoItem)}
                                    onAddValor={(i, valor) => addValor("gastos", i, valor)}
                                />
                            ) : (
                                <div>
                                    <h2>Não há gastos cadastrados</h2>
                                </div>
                            )}
                        </section>
                    )}

                    {secaoAtiva === "extra" && (
                        <section className="card">
                            <h2>Adicionar Horas Extras</h2>
                            <ExtraForm onAdd={(e) => adicionarItem("extras", e)} />
                            <hr />
                            {wallet.extras.length > 0 ? (
                                <Lista
                                    itens={wallet.extras}
                                    tipo="extra"
                                    onRemover={(i) => removerItem("extras", i)}
                                    onEditar={(i, novoItem) => editarItem("extras", i, novoItem)}
                                    onAddValor={(i, valor) => addValor("extras", i, valor)}
                                />
                            ) : (
                                <div>
                                    <h2>Não há horas extras cadastradas</h2>
                                </div>
                            )}
                        </section>
                    )}

                    {secaoAtiva === "banco" && (
                        <section className="card" id="bancosList">
                            <h2>Bancos / Cartões</h2>
                            <BancoForm onAdd={(b) => adicionarItem("bancos", b)} />
                            <hr />
                            {wallet.bancos.length > 0 ? (
                                <Lista
                                    itens={wallet.bancos}
                                    tipo="banco"
                                    onRemover={(i) => removerItem("bancos", i)}
                                    onEditar={(i, novoItem) => editarItem("bancos", i, novoItem)}
                                    onAddValor={(i, valor) => addValor("bancos", i, valor)}
                                />
                            ) : (
                                <div>
                                    <h2>Não há bancos cadastrados</h2>
                                </div>
                            )}
                        </section>
                    )}

                    {secaoAtiva === "diasRemovidos" && (
                        <DiasRemovidos
                            config={config}
                            wallet={wallet}
                            setWallet={atualizarWallet}
                            mesSelecionado={mesSelecionado}
                            anoSelecionado={anoSelecionado}
                            setSecaoAtiva={setSecaoAtiva}
                        />
                    )}

                    {secaoAtiva === "config" && (
                        <Config
                            config={config}
                            setConfig={setConfig}
                            setSecaoAtiva={setSecaoAtiva}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}

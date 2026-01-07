import { useState, useEffect, useCallback } from "react";
import "./style.css";
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

export default function Wallet() {
    const navigate = useNavigate();

    const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
    const [anoSelecionado] = useState(new Date().getFullYear());

    const [config, setConfig] = useState(null);

    const [wallet, setWallet] = useState({
        gastos: [],
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

            setWallet(
                dados ?? {
                    gastos: [],
                    extras: [],
                    diasRemovidos: [],
                    bancos: [],
                }
            );
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

        const gastosFixos = wallet.gastos.reduce(
            (a, g) => a + g.valor,
            0
        );

        const gastosBancos = wallet.bancos.reduce(
            (a, b) => a + (b.valor ?? 0),
            0
        );

        const gastos = gastosFixos + gastosBancos;

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
                {secaoAtiva === "" && (
                    <>
                        <section className="card">
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

                        <section className="card">
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
                    </>
                )}

                {secaoAtiva === "gasto" && (
                    <section className="card" id="gastosList">
                        <h2>Adicionar Gasto</h2>
                        <GastoForm onAdd={(g) => adicionarItem("gastos", g)} />
                        <Lista
                            itens={wallet.gastos}
                            tipo="gasto"
                            onRemover={(i) => removerItem("gastos", i)}
                            onEditar={(i, novoItem) => editarItem("gastos", i, novoItem)}
                            onAddValor={(i, valor) => addValor("gastos", i, valor)}
                        />
                    </section>
                )}

                {secaoAtiva === "extra" && (
                    <section className="card">
                        <h2>Adicionar Horas Extras</h2>
                        <ExtraForm onAdd={(e) => adicionarItem("extras", e)} />
                        <hr />
                        <Lista
                            itens={wallet.extras}
                            tipo="extra"
                            onRemover={(i) => removerItem("extras", i)}
                            onEditar={(i, novoItem) => editarItem("extras", i, novoItem)}
                            onAddValor={(i, valor) => addValor("extras", i, valor)}
                        />
                    </section>
                )}

                {secaoAtiva === "banco" && (
                    <section className="card" id="bancosList">
                        <h2>Bancos / Cartões</h2>
                        <BancoForm onAdd={(b) => adicionarItem("bancos", b)} />
                        <hr />
                        <Lista
                            itens={wallet.bancos}
                            tipo="banco"
                            onRemover={(i) => removerItem("bancos", i)}
                            onEditar={(i, novoItem) => editarItem("bancos", i, novoItem)}
                            onAddValor={(i, valor) => addValor("bancos", i, valor)}
                        />
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
            </main>
        </div>
    );
}

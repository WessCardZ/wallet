import { useState, useEffect, useCallback } from "react";
import "./style.css";
import { auth, carregarWallet, salvarWallet } from "../firebase";
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
                setDados(prev => ({
                    ...prev,
                    ...dadosFirebase,
                    tipo: dadosFirebase.tipo || prev.tipo,
                    salarioMensal: dadosFirebase.salarioMensal ?? prev.salarioMensal,
                }));
            } else {
                setDados(prev => ({
                    ...prev,
                    gastos: [],
                    extras: [],
                    bancos: [],
                    diasRemovidos: [],
                    ...(prev.tipo === "pj"
                        ? { tipo: "pj" }
                        : { tipo: "clt", salarioMensal: prev.salarioMensal }),
                }));
            }
        };

        carregar();
    }, [dados.uid, mesSelecionado, anoSelecionado]);


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
        const totalBancos = dados.bancos
            .filter((b) => b.ehMeu === undefined || b.ehMeu === true)
            .reduce((acc, b) => acc + b.valor, 0);

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
                    <Config
                        dados={dados}
                        setDados={setDados}
                        secaoAtiva={secaoAtiva}
                        setSecaoAtiva={setSecaoAtiva}
                        mesSelecionado={mesSelecionado}
                        anoSelecionado={anoSelecionado}
                        salvarWallet={salvarWallet}
                    />
                )}

                {secaoAtiva === "diasRemovidos" && (
                    <DiasRemovidos
                        dados={dados}
                        setDados={setDados}
                        secaoAtiva={secaoAtiva}
                        setSecaoAtiva={setSecaoAtiva}
                        mesSelecionado={mesSelecionado}
                        anoSelecionado={anoSelecionado}
                        salvarWallet={salvarWallet}
                    />
                )}

                {secaoAtiva === "gasto" && (
                    <section className="card" id="gastosList">
                        <h2>Adicionar Gasto</h2>
                        <GastoForm onAdd={(g) => adicionarItem("gastos", g)} />
                        <Lista
                            itens={dados.gastos}
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
                            itens={dados.extras}
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
                            itens={dados.bancos}
                            tipo="banco"
                            onRemover={(i) => removerItem("bancos", i)}
                            onEditar={(i, novoItem) => editarItem("bancos", i, novoItem)}
                            onAddValor={(i, valor) => addValor("bancos", i, valor)}
                        />
                    </section>
                )}
            </main>
        </div >
    );
}
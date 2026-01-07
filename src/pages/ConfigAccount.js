import { useEffect, useState } from "react";
import "./style.css";

import { auth, salvarConfig, carregarConfig } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function ConfigAccount() {
    const navigate = useNavigate();

    const [config, setConfig] = useState({
        tipo: "pj",

        // PJ
        horasDia: "",
        minutosDia: "",
        valorHora: "",
        diasTrabalhados: [1, 2, 3, 4, 5],

        // CLT
        salarioMensal: "",
        cargaHorariaSemanal: 44
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        carregarConfig(user.uid).then((dados) => {
            if (dados) {
                setConfig((prev) => ({ ...prev, ...dados }));
            }
            setLoading(false);
        });
    }, []);

    function handleChange(e) {
        const { name, value } = e.target;
        setConfig((prev) => ({ ...prev, [name]: value }));
    }

    function toggleDia(dia) {
        setConfig((prev) => {
            const dias = prev.diasTrabalhados.includes(dia)
                ? prev.diasTrabalhados.filter((d) => d !== dia)
                : [...prev.diasTrabalhados, dia];

            return { ...prev, diasTrabalhados: dias };
        });
    }

    async function salvar() {
        const user = auth.currentUser;
        if (!user) return;

        await salvarConfig(user.uid, {
            tipo: config.tipo,

            horasDia: Number(config.horasDia),
            minutosDia: Number(config.minutosDia),
            valorHora: Number(config.valorHora),
            diasTrabalhados: config.diasTrabalhados,

            salarioMensal: Number(config.salarioMensal),
            cargaHorariaSemanal: Number(config.cargaHorariaSemanal)
        });

        navigate("/wallet");
    }

    if (loading) {
        return <p style={{ color: "#fff", textAlign: "center" }}>Carregando...</p>;
    }

    return (
        <div className="login-page">
            <div className="containerConfig">

                {/* ===== PJ ===== */}
                <div
                    className={`configCard selectable ${config.tipo === "pj" ? "active" : ""}`}
                    onClick={() => setConfig((prev) => ({ ...prev, tipo: "pj" }))}
                >
                    <h2>PJ</h2>

                    <div className="field">
                        <label>Horas por dia</label>
                        <input
                            name="horasDia"
                            value={config.horasDia}
                            onChange={handleChange}
                            type="number"
                        />
                    </div>

                    <div className="field">
                        <label>Minutos</label>
                        <input
                            name="minutosDia"
                            value={config.minutosDia}
                            onChange={handleChange}
                            type="number"
                        />
                    </div>

                    <div className="field">
                        <label>Valor por hora</label>
                        <input
                            name="valorHora"
                            value={config.valorHora}
                            onChange={handleChange}
                            type="number"
                        />
                    </div>

                    <div className="dias-semana">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                            (dia, index) => (
                                <label key={index}>
                                    <input
                                        type="checkbox"
                                        checked={config.diasTrabalhados.includes(index)}
                                        onChange={() => toggleDia(index)}
                                    />
                                    {dia}
                                </label>
                            )
                        )}
                    </div>

                    {config.tipo === "pj" && (
                        <button className="btnPrimary" onClick={salvar}>
                            Salvar
                        </button>
                    )}
                </div>

                {/* ===== CLT ===== */}
                <div
                    className={`configCard selectable ${config.tipo === "clt" ? "active" : ""}`}
                    onClick={() => setConfig((prev) => ({ ...prev, tipo: "clt" }))}
                >
                    <h2>CLT</h2>

                    <div className="field">
                        <label>Salário mensal</label>
                        <input
                            name="salarioMensal"
                            value={config.salarioMensal}
                            onChange={handleChange}
                            type="number"
                        />
                    </div>

                    <div className="field">
                        <label>Carga horária semanal</label>
                        <input
                            name="cargaHorariaSemanal"
                            value={config.cargaHorariaSemanal}
                            onChange={handleChange}
                            type="number"
                        />
                    </div>

                    {config.tipo === "clt" && (
                        <button className="btnPrimary" onClick={salvar}>
                            Salvar
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}

import { useState, useEffect, useCallback } from "react";
import {
    auth,
    provider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged
} from "../firebase";
import "./style.css";
import "./login.css"
import { useNavigate } from "react-router-dom";
import { carregarConfig } from "../firebase";


export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [loadingButton, setLoadingButton] = useState(null);
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [modoCriarConta, setModoCriarConta] = useState(false);
    const [verificandoLogin, setVerificandoLogin] = useState(true);

    /* =========================
       VERIFICAR CONFIG
    ========================= */
    const verificarConfigEIr = useCallback(
        async (user) => {
            if (!user) return;

            const config = await carregarConfig(user.uid);

            if (config) {
                navigate("/wallet");
            } else {
                navigate("/config");
            }
        },
        [navigate]
    );

    /* =========================
       AUTH STATE
    ========================= */
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                await verificarConfigEIr(user);
            } else {
                setVerificandoLogin(false);
            }
        });

        return unsubscribe;
    }, [verificarConfigEIr]);

    const validarEmail = (email) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const login = async () => {
        if (!email || !senha) {
            setMensagem("⚠️ Preencha todos os campos!");
            return;
        }

        setLoadingButton("entrar");
        try {
            const cred = await signInWithEmailAndPassword(auth, email, senha);
            await verificarConfigEIr(cred.user);
        } catch {
            setMensagem("❌ Usuário não encontrado ou senha incorreta!");
        } finally {
            setLoadingButton(null);
        }
    };

    const criarConta = async () => {
        if (!email || !senha || !confirmarSenha) {
            setMensagem("⚠️ Preencha todos os campos!");
            return;
        }

        if (!validarEmail(email)) {
            setMensagem("❌ Digite um e-mail válido!");
            return;
        }

        if (senha !== confirmarSenha) {
            setMensagem("❌ As senhas não coincidem!");
            return;
        }

        if (senha.length < 6) {
            setMensagem("❌ A senha precisa ter pelo menos 6 caracteres!");
            return;
        }

        setLoadingButton("criar");
        try {
            await createUserWithEmailAndPassword(auth, email, senha);
            navigate("/config");
        } catch (e) {
            setMensagem(`❌ Erro: ${e.message}`);
        } finally {
            setLoadingButton(null);
        }
    };

    const loginGoogle = async () => {
        setLoadingButton("google");
        try {
            const result = await signInWithPopup(auth, provider);
            await verificarConfigEIr(result.user);
        } catch {
            setMensagem("❌ Erro ao entrar com Google!");
        } finally {
            setLoadingButton(null);
        }
    };

    if (verificandoLogin) {
        return (
            <div className="login-page">
                <div className="login-container" style={{ textAlign: "center" }}>
                    <div className="loader"></div>
                    <p style={{ color: "#ccc", marginTop: "10px" }}>
                        Verificando login...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <h1>Sobrinha</h1>

                {!modoCriarConta ? (
                    <>
                        <input
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <div className="senha-container">
                            <input
                                type={mostrarSenha ? "text" : "password"}
                                placeholder="Senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                            />
                            <span
                                className="eye-icon"
                                onClick={() => setMostrarSenha(!mostrarSenha)}
                                title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                dangerouslySetInnerHTML={{
                                    __html: mostrarSenha
                                        ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.097.184-2.155.525-3.15M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18"/></svg>`
                                        : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`
                                }}
                            />
                        </div>

                        <button onClick={login} disabled={loadingButton !== null}>
                            {loadingButton === "entrar" ? <span className="loader"></span> : "Entrar"}
                        </button>

                        <button className="secondary" onClick={() => setModoCriarConta(true)} disabled={loadingButton !== null}>
                            Criar Conta
                        </button>

                        <div className="divider">ou</div>

                        <button className="google-btn" onClick={loginGoogle} disabled={loadingButton !== null}>
                            {loadingButton === "google" ? (
                                <span className="loader"></span>
                            ) : (
                                <>
                                    <img
                                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                        alt="Google"
                                        style={{ width: "20px", height: "20px", marginRight: "10px" }}
                                    />
                                    Entrar com Google
                                </>
                            )}
                        </button>

                    </>
                ) : (
                    <>
                        <input
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <div className="senha-container">
                            <input
                                type={mostrarSenha ? "text" : "password"}
                                placeholder="Senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                            />
                            <span
                                className="eye-icon"
                                onClick={() => setMostrarSenha(!mostrarSenha)}
                                title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                dangerouslySetInnerHTML={{
                                    __html: mostrarSenha
                                        ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.097.184-2.155.525-3.15M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18"/></svg>`
                                        : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`
                                }}
                            />
                        </div>

                        <input
                            type={mostrarSenha ? "text" : "password"}
                            placeholder="Confirmar Senha"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                        />

                        <button onClick={criarConta} disabled={loadingButton !== null}>
                            {loadingButton === "criar" ? <span className="loader"></span> : "Criar Conta"}
                        </button>

                        <button className="secondary" onClick={() => setModoCriarConta(false)}>
                            🔙 Voltar para login
                        </button>
                    </>
                )}

                {mensagem && (
                    <p style={{ textAlign: "center", color: "#ccc", marginTop: "10px" }}>
                        {mensagem}
                    </p>
                )}
            </div>
        </div>
    );
}

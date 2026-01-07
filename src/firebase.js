import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut as firebaseSignOut
} from "firebase/auth";
import {
    doc,
    getDoc,
    getFirestore,
    setDoc
} from "firebase/firestore";

/* =========================
   CONFIG INICIAL
========================= */

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

export const signOut = () => firebaseSignOut(auth);

export {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged
};

/* =========================
   HELPERS
========================= */

const getMesAtualId = (
    mesIndex = new Date().getMonth(),
    ano = new Date().getFullYear()
) => {
    const mes = String(mesIndex + 1).padStart(2, "0");
    return `${ano}-${mes}`;
};

/* =========================
   CONFIGURAÇÃO DO USUÁRIO
========================= */

export const salvarConfig = async (uid, config) => {
    try {
        await setDoc(
            doc(db, "users", uid, "config", "data"),
            config
        );
        console.log("✅ Configuração salva");
    } catch (err) {
        console.error("❌ Erro ao salvar config:", err);
    }
};

export const carregarConfig = async (uid) => {
    try {
        const snap = await getDoc(
            doc(db, "users", uid, "config", "data")
        );
        return snap.exists() ? snap.data() : null;
    } catch (err) {
        console.error("❌ Erro ao carregar config:", err);
        return null;
    }
};

/* =========================
   WALLET (MENSAL)
========================= */

export const salvarWallet = async (
    uid,
    wallet,
    mesSelecionado = new Date().getMonth(),
    anoSelecionado = new Date().getFullYear()
) => {
    try {
        const mesId = getMesAtualId(mesSelecionado, anoSelecionado);
        await setDoc(
            doc(db, "wallets", uid, "meses", mesId),
            wallet
        );
        console.log(`✅ Wallet salva (${mesId})`);
    } catch (err) {
        console.error("❌ Erro ao salvar Wallet:", err);
    }
};

export const carregarWallet = async (
    uid,
    mesSelecionado = new Date().getMonth(),
    anoSelecionado = new Date().getFullYear()
) => {
    try {
        const mesId = getMesAtualId(mesSelecionado, anoSelecionado);
        const snap = await getDoc(
            doc(db, "wallets", uid, "meses", mesId)
        );
        return snap.exists() ? snap.data() : null;
    } catch (err) {
        console.error("❌ Erro ao carregar Wallet:", err);
        return null;
    }
};
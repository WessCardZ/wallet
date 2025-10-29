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
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export const signOut = () => firebaseSignOut(auth);

export {
    auth,
    provider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    db
};

// ✅ Helpers para Wallet
const getMesAtualId = (mesIndex = new Date().getMonth(), ano = new Date().getFullYear()) => {
    const mes = String(mesIndex + 1).padStart(2, "0");
    return `${ano}-${mes}`;
};

export const salvarWallet = async (uid, dados, mesSelecionado = new Date().getMonth(), anoSelecionado = new Date().getFullYear()) => {
    try {
        const mesId = getMesAtualId(mesSelecionado, anoSelecionado);
        await setDoc(doc(db, "wallets", uid, "meses", mesId), dados);
        console.log(`✅ Wallet salva para o mês ${mesId}`);
    } catch (err) {
        console.error("❌ Erro ao salvar Wallet:", err);
    }
};

export const carregarWallet = async (uid, mesSelecionado = new Date().getMonth(), anoSelecionado = new Date().getFullYear()) => {
    try {
        const mesId = getMesAtualId(mesSelecionado, anoSelecionado);
        const docSnap = await getDoc(doc(db, "wallets", uid, "meses", mesId));
        return docSnap.exists() ? docSnap.data() : null;
    } catch (err) {
        console.error("❌ Erro ao carregar Wallet:", err);
        return null;
    }
};

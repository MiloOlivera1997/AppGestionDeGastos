// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwCIdJF13f64E3MBNp8uKAVgVstvXcmC0",
  authDomain: "control-gastos-b0aeb.firebaseapp.com",
  projectId: "control-gastos-b0aeb",
  storageBucket: "control-gastos-b0aeb.firebasestorage.app",
  messagingSenderId: "312230040551",
  appId: "1:312230040551:android:73bbd06ae4f6d1341fe342"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar la DB
export const db = getFirestore(app);

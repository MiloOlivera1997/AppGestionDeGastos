import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCwCIdJF13f64E3MBNp8uKAVgVstvXcmC0",
  authDomain: "control-gastos-b0aeb.firebaseapp.com",
  projectId: "control-gastos-b0aeb",
  storageBucket: "control-gastos-b0aeb.firebasestorage.app",
  messagingSenderId: "312230040551",
  appId: "1:312230040551:android:73bbd06ae4f6d1341fe342"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

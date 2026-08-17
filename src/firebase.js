import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD8EU7RpTgt-ZQoZW2QC2FAKoXE7_8AFaM",
  authDomain: "farmchicken-9ce5b.firebaseapp.com",
  projectId: "farmchicken-9ce5b",
  storageBucket: "farmchicken-9ce5b.firebasestorage.app",
  messagingSenderId: "748357111438",
  appId: "1:748357111438:web:510b0f0c10e09b888743df",
  measurementId: "G-PH2JL2J839"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

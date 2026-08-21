import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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
const db = getFirestore(app);

async function run() {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('cedula', '==', '32480282'));
  const snap = await getDocs(q);
  if (snap.empty) {
    console.log("No user found");
    return;
  }
  const u = snap.docs[0];
  console.log("User Data:", u.data());
  
  const txQ = query(collection(db, 'transactions'), where('userId', '==', u.id));
  const txSnap = await getDocs(txQ);
  console.log("Transactions:");
  txSnap.docs.forEach(doc => {
    console.log(doc.data());
  });
}

run();

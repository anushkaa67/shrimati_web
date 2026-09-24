import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAljv6_UwP4Pz4g78bQMGKxZlHY_yVvJqQ",
  authDomain: "shrimatisetu-dc6a7.firebaseapp.com",
  projectId: "shrimatisetu-dc6a7",
  storageBucket: "shrimatisetu-dc6a7.firebasestorage.app",
  messagingSenderId: "590673217701",
  appId: "1:590673217701:android:cc65b01402187a637de54c"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

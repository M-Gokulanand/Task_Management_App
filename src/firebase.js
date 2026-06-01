import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDB3rUn9ZxHsX55klYCvUwQaFjNYkJJCME",
  authDomain: "task-manager-bb6aa.firebaseapp.com",
  projectId: "task-manager-bb6aa",
  storageBucket: "task-manager-bb6aa.firebasestorage.app",
  messagingSenderId: "80861127127",
  appId: "1:80861127127:web:21cf6588f407eb87986b92",
  measurementId: "G-9B22HZJQ0D"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
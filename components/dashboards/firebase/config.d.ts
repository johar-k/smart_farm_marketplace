import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDeW-OYLEyv-pnMlzweC-GHgXafSsVN8Dg",
  authDomain: "smartfarm-13eac.firebaseapp.com",
  projectId: "smartfarm-13eac",
  storageBucket: "smartfarm-13eac.firebasestorage.app",
  messagingSenderId: "58457119998",
  appId: "1:58457119998:web:aabc6074c16418879c59af",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

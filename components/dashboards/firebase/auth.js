import { auth, db } from "./config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// REGISTER
export async function registerUser(email, password, role, extraData = {}) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 🔔 Send verification email
  await sendEmailVerification(user);

  await setDoc(doc(db, "users", user.uid), {
    email,
    role,
    ...extraData,
  });

  return user;
}

// LOGIN
export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // ❌ Email not verified
  if (!user.emailVerified) {
    throw new Error("Please verify your email before logging in.");
  }

  const snap = await getDoc(doc(db, "users", user.uid));

  // ❌ User missing in Firestore
  if (!snap.exists()) {
    throw new Error("User profile not found. Please register again.");
  }

  const data = snap.data();

  return {
    user,
    role: data.role,
  };
}

// FORGOT PASSWORD
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

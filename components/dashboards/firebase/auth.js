import { auth, db } from "./config"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"

/* =========================
   REGISTER USER
========================= */
export async function registerUser(
  email,
  password,
  role,
  extraData = {}
) {
  // 1️⃣ Create Auth user
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  )
  const user = userCredential.user

  // 2️⃣ Send email verification
  await sendEmailVerification(user)

  // 3️⃣ Create Firestore profile (IMPORTANT)
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email,
    role,

    // ✅ Basic profile
    fullName: extraData.fullName || "",
    phone: extraData.phone || "",

    // ✅ Farmer-specific safe defaults
    farm: {
      size: null,            // number | null
      unit: "acres",          // string
      location: "",           // string
      memberSince: new Date().toISOString().slice(0, 7), // "YYYY-MM"
    },

    cropsGrown: [],          // array of strings

    // ✅ Metadata
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return user
}

/* =========================
   LOGIN USER
========================= */
export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  )
  const user = userCredential.user

  // ❌ Block unverified users
  if (!user.emailVerified) {
    throw new Error("Please verify your email before logging in.")
  }

  // Fetch Firestore profile
  const snap = await getDoc(doc(db, "users", user.uid))

  if (!snap.exists()) {
    throw new Error("User profile not found. Please register again.")
  }

  const data = snap.data()

  return {
    user,
    role: data.role,
  }
}

/* =========================
   RESET PASSWORD
========================= */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email)
}

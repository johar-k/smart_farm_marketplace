import { auth, db } from "./config"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth"
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore"

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
  if (!user) throw new Error("Registration failed")

  // 2️⃣ Send email verification
  await sendEmailVerification(user)

  // 3️⃣ Create MAIN Firestore profile (WEB USES THIS)
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email,
    role,

    fullName: extraData.fullName || "",
    phone: extraData.phone || "",

    farm: {
      size: extraData.farmSize ?? null,
      unit: "acres",
      location: extraData.location || "",
      memberSince: new Date().toISOString().slice(0, 7),
    },

    cropsGrown: [],

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // 🔥🔥🔥 4️⃣ CREATE CONSUMER DOC (THIS FIXES MOBILE LOGIN)
  if (role === "consumer") {
    await setDoc(doc(db, "consumers", user.uid), {
      uid: user.uid,
      email,
      fullName: extraData.fullName || "",
      role: "consumer",
      createdAt: serverTimestamp(),
    })
  }

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
  if (!user) throw new Error("Login failed")

  // ❌ Block unverified users
  if (!user.emailVerified) {
    throw new Error("Please verify your email before logging in.")
  }

  // Fetch Firestore profile (WEB)
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

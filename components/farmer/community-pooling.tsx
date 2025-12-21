"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

import { auth, db } from "../dashboards/firebase/config"
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore"

type Pool = {
  id: string
  cropType: string
  targetQuantity: number
  currentQuantity: number
  membersCount: number
  status: "active" | "closed"
}

export default function CommunityPooling() {
  const { t } = useLanguage()

  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [cropType, setCropType] = useState("")
  const [targetQuantity, setTargetQuantity] = useState("")

  // 🔹 Fetch pools
  useEffect(() => {
    const fetchPools = async () => {
      const q = query(
        collection(db, "communityPools"),
        orderBy("createdAt", "desc")
      )

      const snap = await getDocs(q)

      const data: Pool[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Pool, "id">),
      }))

      setPools(data)
      setLoading(false)
    }

    fetchPools()
  }, [])

  // 🔹 Create pool
  const createPool = async () => {
    const user = auth.currentUser
    if (!user) {
      alert("Login required")
      return
    }

    if (!cropType || !targetQuantity) {
      alert("Fill all fields")
      return
    }

    await addDoc(collection(db, "communityPools"), {
      cropType: cropType.trim(),
      targetQuantity: Number(targetQuantity),
      currentQuantity: 0,
      membersCount: 1,
      status: "active",
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    setCropType("")
    setTargetQuantity("")
    setShowCreateModal(false)
    window.location.reload()
  }

  if (loading) return <p>Loading pools...</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">{t("pooling.title")}</h2>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 text-white flex gap-2"
        >
          <Plus className="w-5 h-5" />
          {t("pooling.createPool")}
        </Button>
      </div>

      {/* Pool cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pools.map((pool) => {
          const fillPercentage = Math.min(
            Math.round(
              (pool.currentQuantity / pool.targetQuantity) * 100
            ),
            100
          )

          return (
            <Card key={pool.id} className="p-6 shadow-md">
              <div className="flex justify-between mb-4">
                <h3 className="text-xl font-bold">
                  {pool.cropType} Pool
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    pool.status === "active"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {pool.status === "active"
                    ? t("pooling.active")
                    : t("pooling.closed")}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>
                    {pool.membersCount} {t("pooling.members")}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-600">
                    {t("pooling.totalQuantity")}
                  </p>
                  <p className="font-semibold">
                    {pool.currentQuantity} / {pool.targetQuantity} quintals
                  </p>
                </div>

                <div>
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{ width: `${fillPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs mt-1">{fillPercentage}% full</p>
                </div>
              </div>

              <Button
                disabled={pool.status === "closed"}
                className={`w-full mt-4 ${
                  pool.status === "closed"
                    ? "bg-gray-300"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {pool.status === "closed"
                  ? t("pooling.poolClosed")
                  : t("pooling.joinPool")}
              </Button>
            </Card>
          )
        })}
      </div>

      {/* Create Pool Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">
              {t("pooling.createNew")}
            </h3>

            <input
              className="w-full border px-3 py-2 rounded mb-3"
              placeholder="Crop name (e.g. Onion, Wheat)"
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
            />

            <input
              type="number"
              className="w-full border px-3 py-2 rounded mb-4"
              placeholder="Target quantity (quintals)"
              value={targetQuantity}
              onChange={(e) => setTargetQuantity(e.target.value)}
            />

            <div className="flex gap-3">
              <Button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-300"
              >
                {t("pooling.cancel")}
              </Button>
              <Button
                onClick={createPool}
                className="flex-1 bg-emerald-600 text-white"
              >
                {t("pooling.create")}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

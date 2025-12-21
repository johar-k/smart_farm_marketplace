"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { auth, db } from "../dashboards/firebase/config"
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore"

interface Crop {
  id: string
  cropType: string
  quantity: number
  basePrice: number
  quality: string
  season: string
  status: string
}

export default function MyCrops() {
  const { t } = useLanguage()
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCrops = async () => {
      const user = auth.currentUser
      if (!user) return

      const q = query(
        collection(db, "crops"),
        where("farmerId", "==", user.uid)
      )

      const snapshot = await getDocs(q)

      const cropList: Crop[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Crop, "id">),
      }))

      setCrops(cropList)
      setLoading(false)
    }

    fetchCrops()
  }, [])

  const handleDelete = async (cropId: string) => {
    await deleteDoc(doc(db, "crops", cropId))
    setCrops((prev) => prev.filter((c) => c.id !== cropId))
  }

  if (loading) return <p>Loading crops...</p>

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{t("crops.title")}</h2>

      {crops.length === 0 && <p>No crops added yet.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {crops.map((crop) => (
          <Card key={crop.id} className="p-6 shadow-md">
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-bold">{crop.cropType}</h3>
              <Badge
                className={
                  crop.status === "Active"
                    ? "bg-emerald-600"
                    : "bg-gray-400"
                }
              >
                {crop.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <p><b>{t("crops.quantity")}:</b> {crop.quantity} quintals</p>
              <p className="text-emerald-600">
                <b>{t("crops.price")}:</b> ₹{crop.basePrice}/quintal
              </p>
              <p><b>{t("crops.quality")}:</b> {crop.quality}</p>
              <p><b>{t("crops.season")}:</b> {crop.season}</p>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 bg-emerald-600 text-white py-2 rounded">
                {t("crops.edit")}
              </button>
              <button
                onClick={() => handleDelete(crop.id)}
                className="flex-1 bg-gray-200 py-2 rounded"
              >
                {t("crops.delete")}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

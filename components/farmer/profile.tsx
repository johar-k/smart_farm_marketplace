"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { MapPin, Sprout, Smartphone, Mail } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { auth, db } from "../dashboards/firebase/config"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import type { Farmer } from "@/components/farmer/types/farmer"

export default function FarmerProfile() {
  const { t } = useLanguage()

  const [farmerData, setFarmerData] = useState<Farmer | null>(null)
  const [editData, setEditData] = useState<Farmer | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser
      if (!user) {
        setLoading(false)
        return
      }

      const snap = await getDoc(doc(db, "users", user.uid))

      if (snap.exists()) {
        const data = snap.data() as Partial<Farmer>

        // ✅ STEP 1: NORMALIZE DATA
        const normalized: Farmer = {
          fullName: data.fullName ?? "",
          email: data.email ?? user.email ?? "",
          phone: data.phone ?? "",
          farm: {
            size: data.farm?.size ?? 0,
            unit: data.farm?.unit ?? "acres",
            location: data.farm?.location ?? "",
            memberSince: data.farm?.memberSince ?? "",
          },
          cropsGrown: Array.isArray(data.cropsGrown)
            ? data.cropsGrown
            : [],
          role: "farmer"
        }

        setFarmerData(normalized)
        setEditData(normalized)
      }

      setLoading(false)
    }

    fetchProfile()
  }, [])

  const handleChange = (path: string, value: any) => {
    if (!editData) return

    if (path.startsWith("farm.")) {
      const key = path.split(".")[1]
      setEditData({
        ...editData,
        farm: {
          ...editData.farm,
          [key]: value,
        },
      })
    } else if (path === "cropsGrown") {
      setEditData({
        ...editData,
        cropsGrown: value,
      })
    } else {
      setEditData({
        ...editData,
        [path]: value,
      })
    }
  }

  const handleSave = async () => {
    if (!editData) return
    const user = auth.currentUser
    if (!user) return

    await updateDoc(doc(db, "users", user.uid), {
      fullName: editData.fullName,
      phone: editData.phone,
      farm: editData.farm,
      cropsGrown: editData.cropsGrown,
      updatedAt: serverTimestamp(),
    })

    setFarmerData(editData)
    setIsEditing(false)
  }

  if (loading) return <p>Loading profile...</p>
  if (!farmerData) return <p>No profile found</p>

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">{t("profile.title")}</h2>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* EDIT MODE */}
      {isEditing ? (
        <Card className="p-6 space-y-4">
          <input
            value={editData?.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            className="border p-2 w-full"
            placeholder="Full Name"
          />

          <input
            value={editData?.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="border p-2 w-full"
            placeholder="Phone Number"
          />

          <input
            type="number"
            value={editData?.farm.size}
            onChange={(e) => handleChange("farm.size", Number(e.target.value))}
            className="border p-2 w-full"
            placeholder="Farm Size"
          />

          <input
            value={editData?.farm.location}
            onChange={(e) => handleChange("farm.location", e.target.value)}
            className="border p-2 w-full"
            placeholder="Location"
          />

          <input
            value={editData?.cropsGrown.join(", ")}
            onChange={(e) =>
              handleChange(
                "cropsGrown",
                e.target.value.split(",").map((c) => c.trim()).filter(Boolean)
              )
            }
            className="border p-2 w-full"
            placeholder="Crops (comma separated)"
          />

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="bg-emerald-600 text-white px-4 py-2 rounded"
            >
              Save
            </button>

            <button
              onClick={() => {
                setEditData(farmerData)
                setIsEditing(false)
              }}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </Card>
      ) : (
        <>
          {/* VIEW MODE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">{t("profile.personalInfo")}</h3>

              <p className="text-sm text-gray-600">{t("profile.fullName")}</p>
              <p className="font-medium">{farmerData.fullName}</p>

              <p className="text-sm text-gray-600 mt-3">{t("profile.email")}</p>
              <div className="flex gap-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                <p>{farmerData.email}</p>
              </div>

              <p className="text-sm text-gray-600 mt-3">{t("profile.phone")}</p>
              <div className="flex gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <p>{farmerData.phone || "Not added"}</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">{t("profile.farmDetails")}</h3>

              <p className="text-sm text-gray-600">{t("profile.farmSize")}</p>
              <p>
                {farmerData.farm.size
                  ? `${farmerData.farm.size} ${farmerData.farm.unit}`
                  : "Not added"}
              </p>

              <p className="text-sm text-gray-600 mt-3">{t("profile.location")}</p>
              <div className="flex gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <p>{farmerData.farm.location || "Not added"}</p>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">{t("profile.cropsGrown")}</h3>

            <div className="flex flex-wrap gap-3">
              {farmerData.cropsGrown.length === 0 && (
                <p className="text-sm text-gray-500">
                  No crops added yet 🌱
                </p>
              )}

              {farmerData.cropsGrown.map((crop) => (
                <span
                  key={crop}
                  className="flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-full"
                >
                  <Sprout className="w-4 h-4" />
                  {crop}
                </span>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

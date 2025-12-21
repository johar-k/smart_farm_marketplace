"use client"

import type React from "react"
import { useState } from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/lib/language-context"

import { auth, db } from "../dashboards/firebase/config"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"

type AddCropFormData = {
  cropType: string
  region: string
  season: string
  quantity: string
  quality: string
  basePrice: string
}

export default function AddCropForm() {
  const { t } = useLanguage()

  const [formData, setFormData] = useState<AddCropFormData>({
    cropType: "",
    region: "",
    season: "",
    quantity: "",
    quality: "",
    basePrice: "",
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const user = auth.currentUser
    if (!user) {
      alert("You must be logged in")
      return
    }

    setLoading(true)

    try {
      await addDoc(collection(db, "crops"), {
        farmerId: user.uid,                 // 🔑 LINK TO FARMER
        cropType: formData.cropType.trim(), // free text crop name
        region: formData.region.trim(),
        season: formData.season,
        quantity: Number(formData.quantity),
        quality: formData.quality,
        basePrice: Number(formData.basePrice),
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      alert("Crop added successfully 🌱")

      setFormData({
        cropType: "",
        region: "",
        season: "",
        quantity: "",
        quality: "",
        basePrice: "",
      })
    } catch (error) {
      console.error("Error adding crop:", error)
      alert("Failed to add crop")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">
        {t("addCrop.title")}
      </h2>

      <Card className="p-8 border-0 shadow-md max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Crop Name (FREE TEXT) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("addCrop.cropType")}
              </label>
              <Input
                type="text"
                name="cropType"
                placeholder="Enter crop name (e.g. Wheat, Onion, Chilli)"
                value={formData.cropType}
                onChange={handleChange}
                required
              />
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("addCrop.region")}
              </label>
              <Input
                name="region"
                value={formData.region}
                onChange={handleChange}
                required
              />
            </div>

            {/* Season */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("addCrop.season")}
              </label>
              <select
                name="season"
                value={formData.season}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Select</option>
                <option value="kharif">Kharif</option>
                <option value="rabi">Rabi</option>
                <option value="summer">Summer</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("addCrop.quantity")}
              </label>
              <Input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>

            {/* Quality */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("addCrop.quality")}
              </label>
              <select
                name="quality"
                value={formData.quality}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Select</option>
                <option value="premium">Premium</option>
                <option value="standard">Standard</option>
                <option value="economy">Economy</option>
              </select>
            </div>

            {/* Base Price */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("addCrop.basePrice")}
              </label>
              <Input
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? "Adding..." : t("addCrop.submitButton")}
          </Button>
        </form>
      </Card>
    </div>
  )
}

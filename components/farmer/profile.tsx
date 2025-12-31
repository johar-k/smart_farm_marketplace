"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { MapPin, Sprout, Smartphone, Mail, Wallet2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { auth, db } from "../dashboards/firebase/config"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import type { Farmer } from "@/components/farmer/types/farmer"

export default function FarmerProfile() {
  const { t } = useLanguage()

  const [farmerData, setFarmerData] = useState<Farmer | null>(null)
  const [editData, setEditData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser
      if (!user) return setLoading(false)

      const snap = await getDoc(doc(db, "users", user.uid))

      if (snap.exists()) {
        const data = snap.data()
        const normalized: Farmer = {
  fullName: data.fullName ?? "",
  email: data.email ?? user.email ?? "",
  phone: data.phone ?? "",
  upiId: data.upiId ?? "",                   // <-- this avoids undefined
  farm: {
    size: data.farm?.size ?? 0,
    unit: data.farm?.unit ?? "acres",
    location: data.farm?.location ?? "",
    memberSince: data.farm?.memberSince ?? "",
  },
  cropsGrown: Array.isArray(data.cropsGrown) ? data.cropsGrown : [],
  role: "farmer",
}



        setFarmerData(normalized)
        setEditData(normalized)
      }

      setLoading(false)
    }

    fetchProfile()
  }, [])

  const handleChange = (path: string, value: any) => {
    setEditData((prev:any)=>({
      ...prev,
      [path.includes("farm.") ? "farm":path]: path.includes("farm.")
        ? { ...prev.farm, [path.split(".")[1]]:value }
        : value
    }))
  }

  const handleSave = async () => {
    if (!editData) return
    const user = auth.currentUser
    if (!user) return

    if(editData.upiId && !editData.upiId.includes("@")){
      alert("Enter a valid UPI ID (example: number@upi)")
      return
    }
await updateDoc(doc(db, "users", user.uid), {
  fullName: editData.fullName,
  phone: editData.phone,
  upiId: editData.upiId || "",        // <-- SAVE TO FIREBASE
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
        <h2 className="text-3xl font-bold">Farmer Profile</h2>

        {!isEditing && (
          <button
            onClick={()=>setIsEditing(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* ====================== EDIT MODE ====================== */}
      {isEditing ? (
        <Card className="p-6 space-y-4">

          <input value={editData.fullName} onChange={(e)=>handleChange("fullName",e.target.value)} className="border p-2 w-full" placeholder="Full Name" />
          <input value={editData.phone} onChange={(e)=>handleChange("phone",e.target.value)} className="border p-2 w-full" placeholder="Phone Number" />

          {/* UPI Input */}
          {/* UPI ID FIELD */}
<input
  value={editData?.upiId || ""}                   // <-- Prevent undefined error
  onChange={(e)=>handleChange("upiId", e.target.value)}
  className="border p-2 w-full"
  placeholder="Enter UPI ID (example: name@upi)"
/>


          <input type="number" value={editData.farm.size} onChange={(e)=>handleChange("farm.size",Number(e.target.value))} className="border p-2 w-full" placeholder="Farm Size" />
          <input value={editData.farm.location} onChange={(e)=>handleChange("farm.location",e.target.value)} className="border p-2 w-full" placeholder="Location" />
          <input value={editData.cropsGrown.join(", ")} onChange={(e)=>handleChange("cropsGrown",e.target.value.split(",").map(c=>c.trim()))} className="border p-2 w-full" placeholder="Crops (comma separated)" />

          <div className="flex gap-3">
            <button onClick={handleSave} className="bg-emerald-600 text-white px-4 py-2 rounded">Save</button>
            <button onClick={()=>{setEditData(farmerData);setIsEditing(false)}} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
          </div>
        </Card>
      ) : (
        
        /* ====================== VIEW MODE ====================== */
        <>
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* PERSONAL INFO */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Personal Info</h3>

            <p className="text-sm text-gray-600">Name</p>
            <p>{farmerData.fullName}</p>

            <p className="text-sm text-gray-600 mt-3">Email</p>
            <div className="flex gap-2"><Mail className="w-4 h-4 text-emerald-600"/>{farmerData.email}</div>

            <p className="text-sm mt-3 text-gray-600">Phone</p>
            <div className="flex gap-2"><Smartphone className="w-4 h-4 text-emerald-600"/> {farmerData.phone || "Not added"}</div>

            <p className="text-sm mt-3 text-gray-600">UPI ID</p>
            <div className="flex gap-2"><Wallet2 className="w-4 h-4 text-emerald-600"/> {farmerData.upiId || "Not added"}</div>

          </Card>

          {/* FARM DETAILS */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Farm Details</h3>
            <p className="text-sm text-gray-600">Farm Size</p>
            <p>{farmerData.farm.size?`${farmerData.farm.size} ${farmerData.farm.unit}`:"Not added"}</p>

            <p className="text-sm text-gray-600 mt-3">Location</p>
            <div className="flex gap-2"><MapPin className="w-4 h-4 text-emerald-600"/> {farmerData.farm.location || "Not added"}</div>
          </Card>
        </div>

        {/* CROPS */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Crops Grown</h3>
          <div className="flex flex-wrap gap-3">
            {farmerData.cropsGrown.length===0 && <p className="text-gray-500">No crops added 🌱</p>}
            {farmerData.cropsGrown.map(c=>(
              <span key={c} className="bg-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                <Sprout className="w-4 h-4"/>{c}
              </span>
            ))}
          </div>
        </Card>
        </>
      )}
    </div>
  )
}

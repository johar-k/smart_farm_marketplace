"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Mail, Smartphone, MapPin } from "lucide-react"
import { auth, db } from "../dashboards/firebase/config" // adjust path if needed
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"

// 🔹 Type for consumer data
interface Consumer {
  fullName: string
  email: string
  phone: string
  address: string
  pincode: string
  city: string
  state: string
  profileImage?: string | null
  joinDate?: any
}

export default function ConsumerProfile() {
  const [consumerData, setConsumerData] = useState<Consumer | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser
      if (!user) return setLoading(false)

      const ref = doc(db, "users", user.uid)
      const snap = await getDoc(ref)

      if (snap.exists()) setConsumerData(snap.data() as Consumer)

      setLoading(false)
    }

    fetchProfile()
  }, [])

  const updateProfile = async () => {
    const user = auth.currentUser
    if (!user || !consumerData) return

    await updateDoc(doc(db, "users", user.uid), {
      ...consumerData,
      updatedAt: serverTimestamp(),
    })

    alert("Profile Updated Successfully ✔")
    setEditMode(false)
  }

  if (loading) return <p className="p-4">Loading Profile...</p>
  if (!consumerData) return <p className="p-4">No profile found</p>

  return (
    <div className="space-y-6 p-6">

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Consumer Profile</h2>
        {!editMode && (
          <Button onClick={() => setEditMode(true)} className="bg-emerald-600 text-white">
            Edit Profile
          </Button>
        )}
      </div>

      {/* Editable Form */}
      {editMode ? (
        <Card className="p-6 space-y-4 shadow-md">
          <Input 
            value={consumerData.fullName}
            placeholder="Full Name"
            onChange={(e) => setConsumerData({ ...consumerData, fullName: e.target.value })}
          />
          <Input disabled value={consumerData.email} /> {/* Email can't change */}

          <Input
            value={consumerData.phone}
            placeholder="Phone Number"
            onChange={(e) => setConsumerData({ ...consumerData, phone: e.target.value })}
          />

          <Input
            value={consumerData.address}
            placeholder="Address"
            onChange={(e) => setConsumerData({ ...consumerData, address: e.target.value })}
          />

          <Input
            value={consumerData.city}
            placeholder="City"
            onChange={(e) => setConsumerData({ ...consumerData, city: e.target.value })}
          />

          <Input
            value={consumerData.state}
            placeholder="State"
            onChange={(e) => setConsumerData({ ...consumerData, state: e.target.value })}
          />

          <Input
            value={consumerData.pincode}
            placeholder="Pincode"
            onChange={(e) => setConsumerData({ ...consumerData, pincode: e.target.value })}
          />

          <div className="flex gap-3">
            <Button onClick={updateProfile} className="flex-1 bg-emerald-600 text-white">
              Save
            </Button>
            <Button
              onClick={() => setEditMode(false)}
              className="flex-1 bg-gray-300 text-black"
            >
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        // Display Mode
        <Card className="p-6 space-y-4 shadow-md">

          <div className="flex gap-2 items-center">
            <Mail className="w-4 h-4 text-emerald-600" />
            <p><strong>Email:</strong> {consumerData.email}</p>
          </div>

          <div className="flex gap-2 items-center">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <p><strong>Phone:</strong> {consumerData.phone}</p>
          </div>

          <div className="flex gap-2 items-center">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <p><strong>Address:</strong> {consumerData.address}</p>
          </div>

          <p><strong>City:</strong> {consumerData.city}</p>
          <p><strong>State:</strong> {consumerData.state}</p>
          <p><strong>Pincode:</strong> {consumerData.pincode}</p>
        </Card>
      )}
    </div>
  )
}

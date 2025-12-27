"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ShoppingCart, X, PhoneCall } from "lucide-react"
import { db } from "../dashboards/firebase/config"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"

interface BrowseCropsProps {
  onAddToCart: (items: any[]) => void
  cartItems: any[]
}

export default function BrowseCrops({ onAddToCart, cartItems }: BrowseCropsProps) {
  const [pools, setPools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [region, setRegion] = useState("")
  const [season, setSeason] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")

  const [modalData, setModalData] = useState<any>(null)

  const states = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand",
    "Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
    "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir"
  ]

  useEffect(() => {
    const loadPools = async () => {
      const snap = await getDocs(collection(db, "communityPools"))
      const temp:any[] = []

      for (const pool of snap.docs) {
        const data = pool.data()
        const farmerSnap = await getDoc(doc(db, "users", data.createdBy))

        temp.push({
          id: pool.id,
          ...data,
          farmerName: farmerSnap.exists() ? farmerSnap.data().fullName : "Unknown",
          phone: farmerSnap.exists() ? farmerSnap.data().phone : "N/A"
        })
      }
      setPools(temp)
      setLoading(false)
    }

    loadPools()
  }, [])

  if (loading) return <p className="mt-10 text-center">Loading pools...</p>

  // ---------------- FILTER DATA ----------------
  const filtered = pools.filter(pool =>
    (searchTerm === "" || pool.cropType?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (region === "" || pool.region === region) &&
    (season === "" || pool.season === season) &&
    (minPrice === "" || pool.price >= Number(minPrice)) &&
    (maxPrice === "" || pool.price <= Number(maxPrice))
  )

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Available Community Crops</h2>

      {/* 🔥 NEW — Filter Bar (instead of just search input) */}
      <Card className="p-6 shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Search */}
          <div>
            <label className="font-semibold text-sm">Search Crop</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 text-gray-400"/>
              <Input className="pl-10" value={searchTerm} placeholder="Search crop..."
                onChange={(e)=>setSearchTerm(e.target.value)}/>
            </div>
          </div>

          {/* Region */}
          <div>
            <label className="font-semibold text-sm">Region</label>
            <select value={region} onChange={(e)=>setRegion(e.target.value)} className="border p-2 rounded w-full">
              <option value="">All States</option>
              {states.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>

          {/* Season */}
          <div>
            <label className="font-semibold text-sm">Season</label>
            <select value={season} onChange={(e)=>setSeason(e.target.value)} className="border p-2 rounded w-full">
              <option value="">All</option>
              <option value="kharif">Kharif</option>
              <option value="rabi">Rabi</option>
              <option value="summer">Summer</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="font-semibold text-sm">Min Price</label>
            <Input type="number" value={minPrice} onChange={(e)=>setMinPrice(e.target.value)}/>
            <label className="font-semibold text-sm block mt-2">Max Price</label>
            <Input type="number" value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)}/>
          </div>
        </div>
      </Card>

      {/* ---------------- Crop Cards ---------------- */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(pool => (
          <Card key={pool.id} className="p-6 shadow hover:shadow-xl transition">
            <h2 className="text-xl font-bold">{pool.cropType}</h2>
            <p className="text-gray-600 text-sm">Farmer: <b>{pool.farmerName}</b></p>
            <p><b>Available:</b> {pool.currentQuantity} / {pool.targetQuantity} Q</p>
            <p><b>Price:</b> ₹{pool.price || 0}/Q</p>

            <div className="flex gap-2 mt-4">
              <Button className="flex-1 bg-emerald-600 text-white" onClick={()=>setModalData(pool)}>
                View
              </Button>
              <Button 
  className="flex-1 border" 
  onClick={() => onAddToCart([...cartItems ?? [], pool])}
>
  <ShoppingCart size={16}/> Add
</Button>

            </div>
          </Card>
        ))}
      </div>

      {/* ---------------- View Modal ---------------- */}
      {modalData && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <Card className="p-6 w-96 relative bg-white">
            <X className="absolute top-2 right-2 cursor-pointer" onClick={()=>setModalData(null)}/>
            <h2 className="text-2xl font-bold">{modalData.cropType}</h2>

            <p className="mt-2"><b>Farmer:</b> {modalData.farmerName}</p>
            <p><b>Phone:</b> {modalData.phone}</p>
            <p><b>Available:</b> {modalData.currentQuantity} Q</p>
            <p><b>Target:</b> {modalData.targetQuantity} Q</p>

            <Button className="w-full mt-4 bg-emerald-600 text-white flex items-center justify-center gap-2"
              onClick={()=>window.open(`tel:${modalData.phone}`)}>
              <PhoneCall size={18}/> Contact Farmer
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}

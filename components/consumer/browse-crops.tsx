"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ShoppingCart, X, PhoneCall, Users } from "lucide-react"
import { auth, db } from "../dashboards/firebase/config"
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore"

export default function BrowseCrops() {
  const [farmerCrops, setFarmerCrops] = useState<any[]>([])
  const [pools, setPools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [viewType, setViewType] = useState<"crops" | "pools">("crops")

  // filters
  const [searchTerm, setSearchTerm] = useState("")
  const [region, setRegion] = useState("")
  const [season, setSeason] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")

  // modals
  const [modalData, setModalData] = useState<any>(null)
  const [addModal, setAddModal] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)

  const states = [
    "Andhra Pradesh","Telangana","Tamil Nadu","Bihar","Uttar Pradesh",
    "Gujarat","Punjab","Maharashtra","Karnataka","Kerala","Rajasthan",
    "Odisha","Assam","Jharkhand","Madhya Pradesh","Delhi"
  ]

  useEffect(() => {
    const load = async () => {
      const cropSnap = await getDocs(collection(db,"crops"))
      const arr1:any[] = []

      for(const c of cropSnap.docs){
        const data = c.data()
        const user = await getDoc(doc(db,"users",data.farmerId))
        arr1.push({
          id:c.id,
          ...data,
          farmerName:user.exists()?user.data().fullName:"Unknown",
          phone:user.exists()?user.data().phone:"N/A",
          upiId:user.exists()?user.data().upiId:""
        })
      }

      const poolSnap = await getDocs(collection(db,"communityPools"))
      const arr2:any[] = []

      for(const p of poolSnap.docs){
        const data = p.data()
        const user = await getDoc(doc(db,"users",data.createdBy))
        arr2.push({
          id:p.id,
          ...data,
          farmerName:user.exists()?user.data().fullName:"Unknown",
          phone:user.exists()?user.data().phone:"N/A",
          upiId:user.exists()?user.data().upiId:""
        })
      }

      setFarmerCrops(arr1)
      setPools(arr2)
      setLoading(false)
    }
    load()
  }, [])

  if(loading) return <p className="text-center mt-10 text-lg">Loading...</p>

  const filteredCrops = farmerCrops.filter(c =>
    (searchTerm==""||c.cropType.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (region==""||c.region===region) &&
    (season==""||c.season===season) &&
    (minPrice==""||c.basePrice>=Number(minPrice)) &&
    (maxPrice==""||c.basePrice<=Number(maxPrice))
  )

  const filteredPools = pools.filter(p =>
    (searchTerm==""||p.cropType.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const total = (price:number,qty:number)=> price * qty

  const addToCart = async () => {
    const user = auth.currentUser
    if(!user) return alert("Login Required")

    const maxStock = addModal.available
    if(quantity <=0) return alert("Invalid quantity❌")
    if(quantity > maxStock) return alert("Not enough stock available❌")

    await setDoc(
      doc(db,"users",user.uid,"cart", addModal.id),
      {
        ...addModal,
        quantity,
        total: total(addModal.price,quantity),
        timestamp: serverTimestamp()
      },
      { merge: true }
    )

    alert("Added to cart 🛒")
    setAddModal(null)
  }


  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-2">Browse Marketplace</h2>

      <div className="flex gap-3">
        <Button className={viewType==="crops"?"bg-emerald-600 text-white":""}
          onClick={()=>setViewType("crops")}>
          Farmer Crops
        </Button>
        <Button className={viewType==="pools"?"bg-emerald-600 text-white":""}
          onClick={()=>setViewType("pools")}>
          Community Pools
        </Button>
      </div>

      {viewType==="crops" && (
        <Card className="p-6 shadow grid md:grid-cols-4 gap-4">
          <Input placeholder="Search" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
          <select className="border p-2 rounded w-full" value={region} onChange={e=>setRegion(e.target.value)}>
            <option value="">All States</option>
            {states.map(s=><option key={s}>{s}</option>)}
          </select>
          <select className="border p-2 rounded w-full" value={season} onChange={e=>setSeason(e.target.value)}>
            <option value="">All Season</option>
            <option value="kharif">Kharif</option>
            <option value="rabi">Rabi</option>
            <option value="summer">Summer</option>
          </select>
          <div>
            <Input type="number" placeholder="Min ₹" value={minPrice} onChange={e=>setMinPrice(e.target.value)}/>
            <Input type="number" placeholder="Max ₹" className="mt-2" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)}/>
          </div>
        </Card>
      )}

      {/* CROPS UI */}
      {viewType==="crops" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map(c=>{
            const disabled = c.quantity<=0
            return(
            <Card key={c.id} className={`p-5 shadow ${disabled?"opacity-50 pointer-events-none":""}`}>
              <h2 className="text-xl font-bold">{c.cropType}</h2>
              <p>Qty: {c.quantity} Q</p>
              <p className="font-bold text-green-700">₹{c.basePrice}/Q</p>

              <Button className="bg-emerald-600 text-white w-full mt-3"
                onClick={()=>setAddModal({...c,price:c.basePrice,available:c.quantity,type:"crop"})}>
                Add to Cart <ShoppingCart size={14}/>
              </Button>
            </Card>
            )
          })}
        </div>
      )}

      {/* COMMUNITY POOLS UI */}
      {viewType==="pools" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPools.map(p=>{
            const disabled = p.currentQuantity<=0 || p.status==="closed"
            return(
            <Card key={p.id} className={`p-5 shadow ${disabled?"opacity-50 pointer-events-none":""}`}>
              <h2 className="text-xl font-bold">{p.cropType} Pool</h2>
              <p><Users size={14}/> {p.membersCount} members</p>
              <p>Qty: {p.currentQuantity}/{p.targetQuantity} Q</p>
              <p className="font-bold text-green-700">₹{p.pricePerQuintal}/Q</p>

              <Button className="bg-emerald-600 text-white w-full mt-3"
                onClick={()=>setAddModal({...p,price:p.pricePerQuintal,available:p.currentQuantity,type:"pool"})}>
                Buy <ShoppingCart size={14}/>
              </Button>
            </Card>
            )
          })}
        </div>
      )}

      {/* ADD TO CART MODAL */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <Card className="p-6 w-96 bg-white relative">
            <X className="absolute top-2 right-2 cursor-pointer" onClick={()=>setAddModal(null)}/>
            <h2 className="text-xl font-bold">{addModal.cropType}</h2>
            <p>₹{addModal.price}/Q</p>

            <label className="mt-3 block">Quantity</label>
            <Input type="number"
              min={1} max={addModal.available}
              value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/>
            <p className="text-lg mt-2 font-bold text-emerald-700">
              Total: ₹{total(addModal.price,quantity)}
            </p>

            <Button className="bg-emerald-600 w-full text-white mt-4"
              onClick={addToCart}>
              Confirm & Add to Cart
            </Button>
          </Card>
        </div>
      )}

    </div>
  )
}

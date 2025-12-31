"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ShoppingCart, X, PhoneCall, Users } from "lucide-react"
import { db } from "../dashboards/firebase/config"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"

interface BrowseCropsProps {
  onAddToCart: (items: any[]) => void
  cartItems: any[]
}

export default function BrowseCrops({ onAddToCart, cartItems }: BrowseCropsProps) {

  const [farmerCrops, setFarmerCrops] = useState<any[]>([]) 
  const [pools, setPools] = useState<any[]>([])             

  const [loading, setLoading] = useState(true)
  const [viewType, setViewType] = useState<"crops" | "pools">("crops")

  const [searchTerm, setSearchTerm] = useState("")
  const [region, setRegion] = useState("")
  const [season, setSeason] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")

  const [modalData, setModalData] = useState<any>(null)
  const [addModal, setAddModal] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)

  const states = [
    "Andhra Pradesh","Telangana","Tamil Nadu","Bihar","Uttar Pradesh","Gujarat","Punjab",
    "Maharashtra","Karnataka","Kerala","Rajasthan","Odisha","Assam","Jharkhand",
    "Madhya Pradesh","Delhi"
  ]

  useEffect(() => {
    const load = async () => {

      // ----- Farmer Crops -----
      const cropSnap = await getDocs(collection(db,"crops"))
      const arr1:any[] = []
      for(const c of cropSnap.docs){
        const data = c.data()
        const user = await getDoc(doc(db,"users",data.farmerId))
        arr1.push({
          id:c.id,
          ...data,
          farmerName:user.exists()?user.data().fullName:"Unknown",
          phone:user.exists()?user.data().phone:"N/A"
        })
      }

      // ----- Community Pools -----
      const poolSnap = await getDocs(collection(db,"communityPools"))
      const arr2:any[] = []
      for(const p of poolSnap.docs){
        const data = p.data()
        const user = await getDoc(doc(db,"users",data.createdBy))
        arr2.push({
          id:p.id,
          ...data,
          price:data.pricePerQuintal,
          farmerName:user.exists()?user.data().fullName:"Unknown",
          phone:user.exists()?user.data().phone:"N/A"
        })
      }

      setFarmerCrops(arr1)
      setPools(arr2)
      setLoading(false)
    }
    load()
  }, [])

  if(loading) return <p className="text-center mt-10 text-lg">Loading...</p>


  // ------ FILTERS ------
  const filteredCrops = farmerCrops.filter(c =>
    (searchTerm==""||c.cropType.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (region==""||c.region===region) &&
    (season==""||c.season===season) &&
    (minPrice==""||c.basePrice>=Number(minPrice)) &&
    (maxPrice==""||c.basePrice<=Number(maxPrice))
  )

  const filteredPools = pools.filter(p =>
    (searchTerm === "" || p.cropType.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const total = (price:number,qty:number)=> price * qty

  return (
    <div className="space-y-6">

      <h2 className="text-3xl font-bold mb-2">Browse Marketplace</h2>

      {/* TAB SWITCH */}
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


      {/* FILTERS ONLY FOR CROPS */}
      {viewType==="crops" && (
        <Card className="p-6 shadow grid md:grid-cols-4 gap-4">

          <div>
            <label>Search</label>
            <Input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
          </div>

          <div>
            <label>Region</label>
            <select className="border p-2 rounded w-full" value={region} onChange={e=>setRegion(e.target.value)}>
              <option value="">All</option>
              {states.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label>Season</label>
            <select className="border p-2 rounded w-full" value={season} onChange={e=>setSeason(e.target.value)}>
              <option value="">All</option>
              <option value="kharif">Kharif</option>
              <option value="rabi">Rabi</option>
              <option value="summer">Summer</option>
            </select>
          </div>

          <div>
            <label>Price Range</label>
            <Input type="number" placeholder="Min" value={minPrice} onChange={e=>setMinPrice(e.target.value)}/>
            <Input type="number" placeholder="Max" className="mt-2" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)}/>
          </div>
        </Card>
      )}

      {/* FARMER CROPS UI */}
      {viewType==="crops" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map(c => (
            <Card key={c.id} className="p-5 shadow hover:shadow-xl">

              <h2 className="text-xl font-bold">{c.cropType}</h2>
              <p>Quality: {c.quality}</p>
              <p>Region: {c.region}</p>
              <p>Season: {c.season}</p>
              <p className="font-bold text-green-700 text-lg mt-1">₹{c.basePrice}/Q</p>

              <div className="flex gap-2 mt-4">
                <Button className="border flex-1" onClick={()=>setModalData({...c,type:"crop"})}>View</Button>
                <Button className="bg-emerald-600 text-white flex-1"
                  onClick={()=>{setAddModal({...c,price:c.basePrice,available:c.quantity});setQuantity(1)}}>
                  Add <ShoppingCart size={14}/>
                </Button>
              </div>

            </Card>
          ))}
        </div>
      )}


      {/* COMMUNITY POOLS UI */}
      {viewType==="pools" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPools.map(p => {
            const disabled = p.currentQuantity<=0 || p.status==="closed"
            return (
              <Card key={p.id} className={`p-5 shadow transition ${disabled?"opacity-50 pointer-events-none":""}`}>

                <h2 className="text-xl font-bold">{p.cropType} Pool</h2>
                <p><Users size={14}/> Members: {p.membersCount}</p>
                <p>Quantity: {p.currentQuantity}/{p.targetQuantity} Q</p>
                <p className="font-bold text-green-700">₹{p.price}/Q</p>

                <div className="flex gap-2 mt-4">
                  <Button className="border flex-1" onClick={()=>setModalData({...p,type:"pool"})}>View</Button>
                  <Button className="bg-emerald-600 text-white flex-1"
                    onClick={()=>{setAddModal({...p,price:p.price,available:p.currentQuantity});setQuantity(1)}}>
                    Buy <ShoppingCart size={14}/>
                  </Button>
                </div>

              </Card>
            )
          })}
        </div>
      )}

      {/* VIEW MODAL */}
      {modalData && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <Card className="p-6 w-96 bg-white relative">
            <X className="absolute top-2 right-2 cursor-pointer" onClick={()=>setModalData(null)}/>
            <h2 className="text-2xl font-bold mb-2">{modalData.cropType}</h2>

            {modalData.type==="crop" && (
              <>
                <p><b>Region:</b> {modalData.region}</p>
                <p><b>Season:</b> {modalData.season}</p>
                <p><b>Quality:</b> {modalData.quality}</p>
                <p><b>Available:</b> {modalData.quantity} Q</p>
                <p className="font-bold text-green-700 mt-2">₹{modalData.basePrice}/Q</p>
                <Button className="mt-4 bg-emerald-600 text-white w-full"
                  onClick={()=>{setAddModal({...modalData,price:modalData.basePrice,available:modalData.quantity});setQuantity(1);setModalData(null)}}
                >
                  Add to Cart
                </Button>
              </>
            )}

            {modalData.type==="pool" && (
              <>
                <p><b>Members:</b> {modalData.membersCount}</p>
                <p><b>Stock:</b> {modalData.currentQuantity} Q</p>
                <p><b>Farmer:</b> {modalData.farmerName}</p>
                <p><b>Phone:</b> {modalData.phone}</p>

                <Button className="w-full mt-4 bg-emerald-600 text-white"
                  onClick={()=>window.open(`tel:${modalData.phone}`)}>
                  <PhoneCall size={18}/> Contact Farmer
                </Button>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ADD TO CART MODAL */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <Card className="p-6 w-96 bg-white relative">
            <X className="absolute top-2 right-2 cursor-pointer" onClick={()=>setAddModal(null)}/>
            <h2 className="text-xl font-bold">{addModal.cropType}</h2>
            <p className="font-bold mt-2">₹{addModal.price}/Q</p>

            <label className="block mt-3">Enter Quantity</label>
            <Input type="number" min={1} max={addModal.available} value={quantity}
              onChange={e=>setQuantity(Number(e.target.value))}/>

            <p className="text-lg mt-3 font-bold text-emerald-700">Total: ₹{total(addModal.price,quantity)}</p>

            <Button className="w-full bg-emerald-600 text-white mt-4"
              onClick={()=>{
                onAddToCart([...cartItems,{
                  ...addModal,
                  quantity,
                  total:total(addModal.price,quantity),
                  type:addModal.type
                }])
                setAddModal(null)
              }}>
              Add to Cart
            </Button>
          </Card>
        </div>
      )}

    </div>
  )
}

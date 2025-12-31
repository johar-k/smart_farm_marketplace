"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus, Trash2, Edit } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { auth, db } from "../dashboards/firebase/config"

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore"

/* ================= TYPES ================= */

type Pool = {
  id: string
  cropType: string
  targetQuantity: number
  currentQuantity: number
  membersCount: number
  pricePerQuintal: number
  status: "active" | "closed"
  createdBy: string
}

/* ================= COMPONENT ================= */

export default function CommunityPooling() {
  const { t } = useLanguage()

  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [cropType, setCropType] = useState("")
  const [targetQuantity, setTargetQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [editId, setEditId] = useState<string | null>(null)

  const user = auth.currentUser

  /* ========== FETCH POOLS ========== */
  useEffect(() => {
    const fetchPools = async () => {
      const q = query(collection(db, "communityPools"), orderBy("createdAt", "desc"))
      const snap = await getDocs(q)

      const data = snap.docs.map((d) => ({
        ...(d.data() as Pool),
        id: d.id,
      }))

      setPools(data)
      setLoading(false)
    }

    fetchPools()
  }, [])

  /* ========== CREATE POOL ========== */
  const createPool = async () => {
    if (!user) return alert("Login required")
    if (!cropType || !targetQuantity || !price) return alert("Fill all fields")

    await addDoc(collection(db, "communityPools"), {
      cropType,
      targetQuantity: Number(targetQuantity),
      pricePerQuintal: Number(price),
      currentQuantity: 0,
      membersCount: 1,
      status: "active",
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    resetForm()
    alert("Pool created successfully 🌱")
  }

  /* ========== JOIN POOL ========== */
  const joinPool = async (pool: Pool) => {
    if (!user) return alert("Login required")
    if (pool.status === "closed") return alert("Pool already closed")

    const quantity = Number(prompt("Enter quantity to add (quintals)"))
    if (!quantity || quantity <= 0) return alert("Invalid quantity")
    if (pool.currentQuantity + quantity > pool.targetQuantity)
      return alert("Quantity exceeds pool capacity")

    await addDoc(collection(db, "poolMembers"), {
      poolId: pool.id,
      farmerId: user.uid,
      quantity,
      pricePerQuintal: pool.pricePerQuintal,
      joinedAt: serverTimestamp(),
    })

    const willClose = pool.currentQuantity + quantity >= pool.targetQuantity

    await updateDoc(doc(db, "communityPools", pool.id), {
      currentQuantity: increment(quantity),
      membersCount: increment(1),
      status: willClose ? "closed" : "active",
      updatedAt: serverTimestamp(),
    })

    alert("Joined pool successfully 🌱")
  }

  /* ========== EDIT POOL ========== */
  const openEditPool = (pool: Pool) => {
    setEditId(pool.id)
    setCropType(pool.cropType)
    setTargetQuantity(pool.targetQuantity.toString())
    setPrice(pool.pricePerQuintal.toString())
    setShowEditModal(true)
  }

  const updatePoolDetails = async () => {
    if (!editId) return
    await updateDoc(doc(db,"communityPools",editId),{
      cropType,
      targetQuantity:Number(targetQuantity),
      pricePerQuintal:Number(price),
      updatedAt:serverTimestamp()
    })
    resetForm()
    alert("Pool Updated Successfully")
  }

  /* ========== DELETE POOL ========== */
  const deletePoolNow = async (id: string) => {
    if(!confirm("Delete this Pool?")) return
    await deleteDoc(doc(db,"communityPools",id))
    alert("Pool Deleted ❌")
  }

  /* ========== RESET FORM ========== */
  const resetForm = () => {
    setCropType("")
    setTargetQuantity("")
    setPrice("")
    setShowCreateModal(false)
    setShowEditModal(false)
    setEditId(null)
  }

  if(loading) return <p>Loading Pools...</p>

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Community Crop Pooling</h2>
        <Button className="bg-emerald-600 text-white flex gap-2" onClick={()=>setShowCreateModal(true)}>
          <Plus/> Create Pool
        </Button>
      </div>

      {/* ========== POOL CARDS ========== */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pools.map(pool => {
          const fill = Math.round((pool.currentQuantity / pool.targetQuantity) * 100)

          return (
            <Card key={pool.id} className="p-6 shadow-md relative">

              {/* EDIT / DELETE only for creator */}
              {user?.uid === pool.createdBy && (
                <div className="absolute right-3 top-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={()=>openEditPool(pool)}>
                    <Edit size={14}/>
                  </Button>
                  <Button size="sm" variant="destructive" onClick={()=>deletePoolNow(pool.id)}>
                    <Trash2 size={14}/>
                  </Button>
                </div>
              )}

              <h2 className="text-xl font-bold mb-3">{pool.cropType} Pool</h2>

              <p><Users size={16}/> Members: {pool.membersCount}</p>
              <p>Quantity: {pool.currentQuantity}/{pool.targetQuantity} Q</p>
              <p className="text-green-700 font-bold mt-1">₹{pool.pricePerQuintal}/Q</p>

              <div className="mt-2 w-full bg-gray-200 h-2 rounded">
                <div style={{width:`${fill}%`}} className="h-2 bg-emerald-600 rounded"/>
              </div>
              <p className="text-xs">{fill}% Full</p>

              <Button
                disabled={pool.status==="closed"}
                className="w-full mt-4 bg-emerald-600 text-white"
                onClick={()=>joinPool(pool)}
              >
                {pool.status==="closed"?"Closed":"Join Pool"}
              </Button>

            </Card>
          )
        })}
      </div>


{/* ================= CREATE / EDIT MODAL ================= */}

{(showCreateModal || showEditModal) && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <Card className="p-6 w-full max-w-md space-y-4">

      <h2 className="text-xl font-bold">
        {editId ? "Edit Pool" : "Create New Pool"}
      </h2>

      <input placeholder="Crop Type"
        className="w-full border px-3 py-2 rounded"
        value={cropType}
        onChange={e=>setCropType(e.target.value)}
      />

      <input type="number" placeholder="Target Quantity"
        className="w-full border px-3 py-2 rounded"
        value={targetQuantity}
        onChange={e=>setTargetQuantity(e.target.value)}
      />

      <input type="number" placeholder="Price per Quintal"
        className="w-full border px-3 py-2 rounded"
        value={price}
        onChange={e=>setPrice(e.target.value)}
      />

      <div className="flex gap-2">
        <Button className="flex-1 bg-gray-400" onClick={resetForm}>Cancel</Button>
        {editId ? (
          <Button className="flex-1 bg-blue-600 text-white"
            onClick={updatePoolDetails}>Update</Button>
        ) : (
          <Button className="flex-1 bg-emerald-600 text-white"
            onClick={createPool}>Create</Button>
        )}
      </div>

    </Card>
  </div>
)}

    </div>
  )
}

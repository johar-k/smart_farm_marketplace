"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { auth, db } from "../dashboards/firebase/config"
import {
  collection, doc, getDocs, deleteDoc,
  updateDoc, addDoc, serverTimestamp
} from "firebase/firestore"

export default function CartCheckout() {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [processing, setProcessing] = useState(false)

  const DELIVERY_CHARGE = 50   // fixed

  useEffect(() => { loadCart() }, [])

  // LOAD CART
  const loadCart = async () => {
    const user = auth.currentUser
    if (!user) return
    const snap = await getDocs(collection(db, "users", user.uid, "cart"))
    const arr: any[] = []
    snap.forEach(d => arr.push({ id: d.id, ...d.data() }))
    setCartItems(arr)
  }

  // REMOVE ITEM
  const removeItem = async (id: string) => {
    const user = auth.currentUser
    if (!user) return
    await deleteDoc(doc(db, "users", user.uid, "cart", id))
    loadCart()
  }

  // TOTALS
  const subtotal = cartItems.reduce((t, i) => t + i.total, 0)
  const grandTotal = subtotal + DELIVERY_CHARGE

  // ------------------- ORDER PLACEMENT -------------------
  const placeOrder = async (method:"UPI"|"PHONE"|"COD")=>{
    if(cartItems.length===0) return alert("Cart empty")
    const user = auth.currentUser
    if(!user) return alert("Login required")

    setProcessing(true)

    // 🔥 PROCESS ONE ITEM AT A TIME (multi-farmer safe)
    for(const item of cartItems){

      if(!item.farmerId){
        alert("FarmerID missing - Fix Browse AddToCart")
        setProcessing(false)
        return
      }

      const payAmount = item.total + DELIVERY_CHARGE

      // 🔥 Save order for that farmer
      await addDoc(collection(db, "orders"), {
        orderType:item.type,
        cropName:item.cropType,
        quantity:item.quantity,
        totalPrice:item.total,
        farmerId:item.farmerId,
        farmerUpi:item.upiId??null,
        farmerPhone:item.phone,
        consumerId:user.uid,
        status:"processing",
        paymentMethod:method,
        deliveryCharge:DELIVERY_CHARGE,
        finalPay:payAmount,
        createdAt:serverTimestamp()
      })

      // 🔥 Reduce stock
      if(item.type==="crop"){
        await updateDoc(doc(db,"crops",item.id),{
          quantity:item.available-item.quantity
        })
      }
      else{ // pool
        await updateDoc(doc(db,"communityPools",item.id),{
          currentQuantity:item.available-item.quantity
        })
      }

      // 🔥 Trigger Payment
      if(method==="UPI") openUPI(payAmount,item.upiId,item.cropType)
      if(method==="PHONE") alert(`Pay to farmer 📞 ${item.phone}`)

      // Delete this item from cart after payment
      await deleteDoc(doc(db,"users",user.uid,"cart",item.id))
    }

    alert("All items Purchased Successfully 🎉")
    setProcessing(false)
    loadCart()
  }


  // ------------------- PAYMENT FUNCTIONS -------------------
  const openUPI = (amount:number,upi:string,crop:string)=>{
    if(!upi) return alert("UPI ID missing for farmer")
    const uri = `upi://pay?pa=${upi}&pn=Farmer&am=${amount}&tn=Purchase-${crop}`
    window.location.href = uri
  }


  return (
  <div className="space-y-6">
    
    <h2 className="text-3xl font-bold">My Cart</h2>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ---------------- CART LIST ---------------- */}
      <div className="lg:col-span-2 space-y-4">
        {cartItems.length===0 ? (
          <Card className="p-10 text-center">No Items in cart</Card>
        ):cartItems.map((it,i)=>(
          <Card key={i} className="p-5 flex justify-between">
            <div>
              <h3 className="font-bold text-xl">{it.cropType}</h3>
              <p>{it.quantity} Q × ₹{it.price}</p>
              <p className="text-green-700 font-bold">₹{it.total}</p>
            </div>

            <button onClick={()=>removeItem(it.id)}>
              <Trash2 className="text-red-600 w-6 h-6"/>
            </button>
          </Card>
        ))}
      </div>


      {/* ---------------- SUMMARY ---------------- */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-2">Pay Only For First Item</h3>

        {cartItems[0] && (
        <div className="mb-3">
          <p>Crop: <b>{cartItems[0].cropType}</b></p>
          <p>Amount: ₹{cartItems[0].total}</p>
          <p>Delivery: ₹{DELIVERY_CHARGE}</p>
          <p className="font-bold text-green-700 mt-2">
            Total Pay: ₹{cartItems[0].total+DELIVERY_CHARGE}
          </p>
        </div>
        )}

        {/* Payment Buttons */}
        <div className="space-y-3 mt-4">
          <Button disabled={processing||!cartItems[0]}
           onClick={()=>placeOrder("UPI")}
           className="bg-emerald-700 w-full">
           Pay UPI
          </Button>

          <Button disabled={processing||!cartItems[0]}
           onClick={()=>placeOrder("PHONE")}
           className="bg-blue-600 w-full">
           Pay Phone
          </Button>

          <Button disabled={processing||!cartItems[0]}
           onClick={()=>placeOrder("COD")}
           className="bg-black w-full">
           Cash On Delivery
          </Button>
        </div>
      </Card>

    </div>

  </div>
  )
}

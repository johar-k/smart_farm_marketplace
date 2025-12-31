"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useState } from "react"

interface CartCheckoutProps {
  cartItems: any[]
  setCartItems?: (items:any[])=>void   // optional in case needed later for modifications
}

export default function CartCheckout({ cartItems, setCartItems }: CartCheckoutProps) {

  const removeItem = (index:number)=>{
    if(!setCartItems) return
    const updated = [...cartItems]
    updated.splice(index,1)
    setCartItems(updated)
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.totalPrice ?? 0), 0)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">My Cart</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ---------------- CART ITEMS LIST ---------------- */}
        <div className="space-y-4 lg:col-span-2">
          {cartItems.length === 0 ? (
            <Card className="p-10 text-center shadow">
              <p className="text-gray-600 text-lg">No items in cart</p>
              <p className="text-gray-500 text-sm">Add items from Browse Crops</p>
            </Card>
          ) : (
            cartItems.map((item, index) => (
              <Card key={index} className="p-5 shadow flex justify-between items-start">

                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{item.cropType}</h3>
                  <p className="text-sm text-gray-600">Farmer: {item.farmerName}</p>

                  <div className="text-sm mt-3 space-y-1">
                    <div className="flex justify-between w-64">
                      <span>Price/Q:</span>
                      <span className="font-semibold text-emerald-700">₹{item.price}</span>
                    </div>

                    <div className="flex justify-between w-64">
                      <span>Quantity:</span>
                      <span className="font-semibold">{item.quantity} Q</span>
                    </div>

                    <div className="flex justify-between w-64">
                      <span>Total:</span>
                      <span className="font-bold text-emerald-700">₹{item.totalPrice}</span>
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                {setCartItems && (
                  <button className="text-red-600 hover:text-red-700" onClick={()=>removeItem(index)}>
                    <Trash2 className="w-6 h-6"/>
                  </button>
                )}

              </Card>
            ))
          )}
        </div>

        {/* ---------------- SUMMARY SECTION ---------------- */}
        <Card className="p-6 shadow h-fit">
          <h3 className="text-xl font-bold mb-3">Order Summary</h3>

          <div className="space-y-3 border-b pb-3">
            <div className="flex justify-between">
              <span>Items:</span>
              <span className="font-semibold">{cartItems.length}</span>
            </div>

            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold">₹{calculateTotal()}</span>
            </div>

            <div className="flex justify-between">
              <span>Delivery Charge:</span>
              <span className="font-semibold">₹150</span>
            </div>
          </div>

          <div className="flex justify-between mt-4 text-lg font-bold">
            <span>Total:</span>
            <span className="text-emerald-600">₹{calculateTotal() + 150}</span>
          </div>

          <Button 
            disabled={cartItems.length === 0}
            className={`w-full mt-6 py-3 text-white text-lg ${
              cartItems.length === 0 ? "bg-gray-400" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            Proceed to Order
          </Button>

          <p className="text-xs text-gray-500 mt-2">Payment Gateway will be added later.</p>
        </Card>
      </div>
    </div>
  )
}

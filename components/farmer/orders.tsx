"use client"

import { useEffect, useState } from "react"
import { auth, db } from "@/components/dashboards/firebase/config"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Order = {
  id: string
  consumerName: string
  consumerPhone: string
  deliveryAddress: string
  cropName: string
  quantity: number
  totalPrice: number
  orderType: "direct" | "pool"
  status: "processing" | "in_delivery" | "delivered"
}

export default function FarmerOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // 🔹 Fetch farmer orders
  useEffect(() => {
    const fetchOrders = async () => {
      const user = auth.currentUser
      if (!user) return

      const q = query(
        collection(db, "orders"),
        where("farmerId", "==", user.uid),
        orderBy("createdAt", "desc")
      )

      const snap = await getDocs(q)

      const data: Order[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Order, "id">),
      }))

      setOrders(data)
      setLoading(false)
    }

    fetchOrders()
  }, [])

  // 🔹 Update order status
  const updateStatus = async (
    orderId: string,
    newStatus: "in_delivery" | "delivered"
  ) => {
    await updateDoc(doc(db, "orders", orderId), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    })

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: newStatus } : o
      )
    )
  }

  if (loading) return <p>Loading orders...</p>

  if (orders.length === 0)
    return <p>No orders received yet.</p>

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Orders</h2>

      {orders.map((order) => (
        <Card key={order.id} className="p-6 space-y-4 shadow-md">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">
              {order.cropName}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                order.status === "processing"
                  ? "bg-yellow-100 text-yellow-800"
                  : order.status === "in_delivery"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {order.status.replace("_", " ")}
            </span>
          </div>

          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Consumer</p>
              <p className="font-medium">{order.consumerName}</p>
            </div>

            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium">{order.consumerPhone}</p>
            </div>

            <div>
              <p className="text-gray-500">Delivery Address</p>
              <p className="font-medium">{order.deliveryAddress}</p>
            </div>

            <div>
              <p className="text-gray-500">Order Type</p>
              <p className="font-medium capitalize">{order.orderType}</p>
            </div>

            <div>
              <p className="text-gray-500">Quantity</p>
              <p className="font-medium">{order.quantity}</p>
            </div>

            <div>
              <p className="text-gray-500">Total Price</p>
              <p className="font-medium text-emerald-600">
                ₹{order.totalPrice}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {order.status === "processing" && (
              <Button
                onClick={() =>
                  updateStatus(order.id, "in_delivery")
                }
                className="bg-blue-600 text-white"
              >
                Start Delivery
              </Button>
            )}

            {order.status === "in_delivery" && (
              <Button
                onClick={() =>
                  updateStatus(order.id, "delivered")
                }
                className="bg-emerald-600 text-white"
              >
                Mark Delivered
              </Button>
            )}

            {order.status === "delivered" && (
              <Button disabled className="bg-gray-300">
                Completed
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

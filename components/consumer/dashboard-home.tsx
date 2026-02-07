"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { ShoppingCart, Wheat } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useLanguage } from "@/lib/language-context"

import { db } from "@/components/dashboards/firebase/config"

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore"

import { getAuth } from "firebase/auth"

export default function ConsumerDashboardHome() {
  const { t } = useLanguage()

  const [totalSpent, setTotalSpent] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [avgOrder, setAvgOrder] = useState(0)
  const [ordersByCrop, setOrdersByCrop] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [recentCrops, setRecentCrops] = useState<any[]>([]) // ⭐ NEW

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"]

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    const user = getAuth().currentUser
    if (!user) return

    const ordersRef = collection(db, "orders")

    const q = query(
      ordersRef,
      where("consumerId", "==", user.uid)
    )

    const snap = await getDocs(q)

    let spent = 0
    const cropMap: Record<string, number> = {}

    snap.forEach((doc) => {
      const data = doc.data()

      const amount = Number(data.finalPay || 0)
      spent += amount

      const crop = data.cropName || "Other"

      cropMap[crop] = (cropMap[crop] || 0) + amount
    })

    const total = snap.size
    const avg = total > 0 ? spent / total : 0

    setTotalSpent(spent)
    setTotalOrders(total)
    setAvgOrder(avg)

    const cropArray = Object.entries(cropMap).map(([name, value]) => ({
      name,
      value,
    }))

    setOrdersByCrop(cropArray)

    // ✅ Recent Orders
    const recentQuery = query(
      ordersRef,
      where("consumerId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    )

    const recentSnap = await getDocs(recentQuery)

    const recent = recentSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    setRecentOrders(recent)

    // ⭐🔥 NEW — RECENT CROPS
    const cropsRef = collection(db, "crops")

    const cropsQuery = query(
      cropsRef,
      orderBy("createdAt", "desc"),
      limit(4)
    )

    const cropsSnap = await getDocs(cropsQuery)

    const crops = cropsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    setRecentCrops(crops)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          {t("login.consumer")} {t("nav.dashboard")}
        </h2>
        <p className="text-gray-600 mt-1">{t("consumerAnalytics.title")}</p>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-0 shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100">
          <p className="text-sm text-gray-600 mb-2">
            {t("consumerAnalytics.totalSpent")}
          </p>
          <p className="text-3xl font-bold text-emerald-600">
            ₹{totalSpent.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6 border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm text-gray-600 mb-2">
            {t("consumerAnalytics.totalOrders")}
          </p>
          <p className="text-3xl font-bold text-blue-600">
            {totalOrders}
          </p>
        </Card>

        <Card className="p-6 border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100">
          <p className="text-sm text-gray-600 mb-2">
            {t("consumerAnalytics.avgOrderValue")}
          </p>
          <p className="text-3xl font-bold text-amber-600">
            ₹{avgOrder.toFixed(0)}
          </p>
        </Card>
      </div>

      {/* CHART + RECENT CROPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PIE */}
        <Card className="p-6 border-0 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("consumerAnalytics.ordersByCrop")}
          </h3>

          {ordersByCrop.length === 0 ? (
            <p className="text-gray-500">No order data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={ordersByCrop}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name }) => name}
                  outerRadius={80}
                  dataKey="value"
                >
                  {ordersByCrop.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* ⭐🔥 RECENT CROPS */}
        <Card className="p-6 border-0 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recently Added Crops
          </h3>

          {recentCrops.length === 0 ? (
            <p className="text-gray-500">No crops available</p>
          ) : (
            <div className="space-y-3">
              {recentCrops.map((crop: any) => (
                <div
                  key={crop.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <Wheat className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {crop.cropType}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qty: {crop.quantity} quintals
                      </p>
                    </div>
                  </div>

                  <p className="font-semibold text-emerald-600">
                    ₹{crop.basePrice}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* RECENT ORDERS */}
      <Card className="p-6 border-0 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("orders.title")}
        </h3>

        {recentOrders.length === 0 ? (
          <p className="text-gray-500">No orders yet</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.cropName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.id}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ₹{Number(order.finalPay).toLocaleString()}
                  </p>

                  <p
                    className={`text-xs font-medium ${
                      order.status === "delivered"
                        ? "text-emerald-600"
                        : "text-blue-600"
                    }`}
                  >
                    {order.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

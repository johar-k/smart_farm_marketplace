"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useLanguage } from "@/lib/language-context"

import { db } from "@/components/dashboards/firebase/config"
import { getAuth } from "firebase/auth"
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore"

export default function FarmerDashboardHome() {
  const { t } = useLanguage()

  const [totalIncome, setTotalIncome] = useState(0)
  const [totalCrops, setTotalCrops] = useState(0)
  const [avgSale, setAvgSale] = useState(0)
  const [poolMembers, setPoolMembers] = useState(0)
  const [salesData, setSalesData] = useState<any[]>([])
  const [communityPools, setCommunityPools] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([]) // ✅ ADDED

  useEffect(() => {
    fetchRealData()
  }, [])

  async function fetchRealData() {
    const user = getAuth().currentUser
    if (!user) return

    const uid = user.uid

    // 🔥 ORDERS
    const ordersQuery = query(
      collection(db, "orders"),
      where("farmerId", "==", uid)
    )

    const orderSnap = await getDocs(ordersQuery)

    let income = 0
    const monthlyMap: any = {}

    const ordersArray: any[] = [] // ✅ collect orders

    orderSnap.forEach((doc) => {
      const data = doc.data()
      const amount = Number(data.finalPay || 0)

      income += amount

      ordersArray.push({
        id: doc.id,
        ...data,
      })

      if (data.createdAt?.toDate) {
        const date = data.createdAt.toDate()
        const month = date.toLocaleString("default", { month: "short" })

        monthlyMap[month] = (monthlyMap[month] || 0) + amount
      }
    })

    setRecentOrders(ordersArray.slice(0, 5)) // ✅ ONLY 5

    setTotalIncome(income)
    setAvgSale(orderSnap.size ? income / orderSnap.size : 0)

    setSalesData(
      Object.keys(monthlyMap).map((month) => ({
        month,
        sales: monthlyMap[month],
      }))
    )

    // 🔥 CROPS
    const cropsSnap = await getDocs(
      query(collection(db, "crops"), where("farmerId", "==", uid))
    )

    setTotalCrops(cropsSnap.size)

    // 🔥 COMMUNITY POOLS
    const poolsQuery = query(
      collection(db, "communityPools"),
      where("createdBy", "==", uid)
    )

    const poolsSnap = await getDocs(poolsQuery)

    let members = 0

    poolsSnap.forEach((doc) => {
      members += Number(doc.data().membersCount || 0)
    })

    setPoolMembers(members)

    setCommunityPools(
      poolsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    )
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          {t("login.farmer")} {t("nav.dashboard")}
        </h2>
        <p className="text-gray-600 mt-1">{t("analytics.title")}</p>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-0 shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100">
          <p className="text-sm text-gray-600 mb-2">{t("analytics.totalIncome")}</p>
          <p className="text-3xl font-bold text-emerald-600">
            ₹{totalIncome.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Real data
          </p>
        </Card>

        <Card className="p-6 border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm text-gray-600 mb-2">{t("crops.title")}</p>
          <p className="text-3xl font-bold text-blue-600">{totalCrops}</p>
        </Card>

        <Card className="p-6 border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100">
          <p className="text-sm text-gray-600 mb-2">{t("analytics.averageSale")}</p>
          <p className="text-3xl font-bold text-amber-600">
            ₹{avgSale.toFixed(0)}
          </p>
        </Card>

        <Card className="p-6 border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-sm text-gray-600 mb-2">{t("pooling.members")}</p>
          <p className="text-3xl font-bold text-purple-600">{poolMembers}</p>
        </Card>
      </div>

      {/* CHART + COMMUNITY POOLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 border-0 shadow-md lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("analytics.monthlySalesTrend")}
          </h3>

          {salesData.length === 0 ? (
            <p className="text-gray-500">No sales data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6 border-0 shadow-md">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">
    Your Community Pools
  </h3>

  {communityPools.length === 0 ? (
    <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-4">
      <p className="font-medium text-emerald-800">
        No community pools yet 🌱
      </p>

      <p className="text-sm text-emerald-700 mt-1">
        Create a community crop pool to combine harvests,
        attract bulk buyers, and sell faster.
      </p>
    </div>
  ) : (
    <div className="space-y-3">
      {communityPools.map((pool: any) => {

        const filledPercent =
          (pool.currentQuantity / pool.targetQuantity) * 100

        return (
          <div
            key={pool.id}
            className="p-4 rounded-xl border border-gray-100 hover:shadow-sm transition"
          >
            {/* TOP */}
            <div className="flex justify-between items-center">
              <p className="font-semibold text-gray-800">
                {pool.cropType}
              </p>

              <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                {pool.membersCount || 0} farmers
              </span>
            </div>

            {/* QUANTITY */}
            <p className="text-sm text-gray-500 mt-1">
              {pool.currentQuantity} / {pool.targetQuantity} quintals
            </p>

            {/* PROGRESS BAR 🔥 */}
            <div className="w-full h-2 bg-gray-200 rounded-full mt-3">
              <div
                className="h-2 bg-emerald-500 rounded-full"
                style={{ width: `${Math.min(filledPercent, 100)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )}
</Card>

      </div>

      {/* ✅ RECENT ORDERS (ADDED ONLY THIS) */}
<Card className="p-6 border-0 shadow-md">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">
    Recent Orders
  </h3>

  {recentOrders.length === 0 ? (
    <p className="text-gray-500">No recent orders</p>
  ) : (
    <div className="space-y-3">
      {recentOrders.map((order: any) => {

        // ✅ STATUS COLORS
        let statusColor = "bg-gray-100 text-gray-600"

        if (order.status === "delivered")
          statusColor = "bg-emerald-100 text-emerald-700"

        else if (order.status === "cancelled")
          statusColor = "bg-red-100 text-red-600"

        else if (order.status === "processing")
          statusColor = "bg-amber-100 text-amber-700"

        else if (order.status === "in_delivery")
          statusColor = "bg-blue-100 text-blue-700"

        return (
          <div
            key={order.id}
            className="flex justify-between items-center p-4 rounded-xl border border-gray-100 hover:shadow-sm transition"
          >
            {/* LEFT */}
            <div>
              <p className="font-semibold text-gray-800">
                {order.cropName}
              </p>

              <p className="text-sm text-gray-500">
                Qty: {order.quantity}
              </p>
            </div>

            {/* RIGHT */}
            <div className="text-right">
              <p className="font-bold text-gray-900">
                ₹{Number(order.finalPay).toLocaleString()}
              </p>

              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}
              >
                {order.status}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )}
</Card>



    </div>
  )
}

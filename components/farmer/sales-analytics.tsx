"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

import { auth, db } from "../dashboards/firebase/config"
import { collection, getDocs, query, where } from "firebase/firestore"

const COLORS = ["#10b981", "#3b82f6", "#f59e0b"]

export default function SalesAnalytics() {
  const [loading, setLoading] = useState(true)

  const [totalIncome, setTotalIncome] = useState(0)
  const [cropWise, setCropWise] = useState<any[]>([])
  const [seasonal, setSeasonal] = useState<any[]>([])
  const [monthly, setMonthly] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser
      if (!user) return

      const q = query(
        collection(db, "crops"),
        where("farmerId", "==", user.uid)
      )

      const snap = await getDocs(q)

      let total = 0
      const cropMap: any = {}
      const seasonMap: any = { kharif: 0, rabi: 0, summer: 0 }
      const monthMap: any = {
        Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
        Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0,
      }

      snap.docs.forEach(doc => {
        const d = doc.data()
        const income = (d.quantity || 0) * (d.basePrice || 0)
        total += income

        // Crop-wise
        cropMap[d.cropType] = (cropMap[d.cropType] || 0) + income

        // Seasonal
        if (d.season) {
          seasonMap[d.season] += income
        }

        // Monthly
        if (d.createdAt?.toDate) {
          const month = d.createdAt.toDate().toLocaleString("en-US", { month: "short" })
          monthMap[month] += income
        }
      })

      setTotalIncome(total)

      setCropWise(
        Object.keys(cropMap).map(k => ({ name: k, sales: cropMap[k] }))
      )

      setSeasonal(
        Object.keys(seasonMap).map(k => ({
          name: k,
          income: seasonMap[k],
        }))
      )

      setMonthly(
        Object.keys(monthMap).map(k => ({
          month: k,
          sales: monthMap[k],
        }))
      )

      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return <p>Loading analytics...</p>

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Sales Analytics</h2>

      {/* Total Income */}
      <Card className="p-6">
        <p className="text-sm text-gray-600">Total Income</p>
        <p className="text-3xl font-bold text-emerald-600">
          ₹{totalIncome.toLocaleString()}
        </p>
      </Card>

      {/* Crop-wise */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Crop-wise Income</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cropWise}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sales" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Seasonal */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Seasonal Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={seasonal}
              dataKey="income"
              nameKey="name"
              outerRadius={100}
              label
            >
              {seasonal.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Monthly */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Monthly Sales Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line dataKey="sales" stroke="#10b981" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../dashboards/firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc
} from "firebase/firestore";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FarmerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Live Sync Orders – Realtime updates
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("farmerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const arr:any[] = [];
      snap.forEach(d => arr.push({ id:d.id, ...d.data() }));
      setOrders(arr);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 🔥 Update status — visible to customer instantly
  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "orders", id), { status });
  };

  if (loading) return <p className="text-center mt-10 text-lg">Loading Orders...</p>;
  if (orders.length === 0) return <p className="text-center mt-10 text-lg">No Orders Yet</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Orders Received</h2>

      {orders.map(order => (
        <Card key={order.id} className="p-6 space-y-4 shadow-md hover:shadow-lg transition">

          {/* Title + Status */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">{order.cropName}</h3>

            <span className={`px-3 py-1 rounded text-sm font-semibold capitalize
              ${order.status === "delivered" ? "bg-green-200 text-green-700" :
                order.status === "in_delivery" ? "bg-blue-200 text-blue-700" :
                "bg-yellow-200 text-yellow-700"}`}>
              {order.status.replace("_", " ")}
            </span>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <p><b>Quantity:</b> {order.quantity} Q</p>
            <p><b>Total Amount:</b> ₹{order.finalPay}</p>
            <p><b>Payment:</b> {order.paymentMethod}</p>
            <p><b>Order Type:</b> {order.orderType ?? "N/A"}</p>
          </div>

          <hr/>

          {/* Customer Details */}
          <div className="text-sm space-y-1">
            <p><b>Customer Name:</b> {order.consumerName ?? "Unknown"}</p>
            <p><b>Phone:</b> {order.consumerPhone}</p>
            <p><b>Address:</b> {order.deliveryAddress ?? "No address provided"}</p>
          </div>

          {/* Status Action Buttons */}
          <div className="flex gap-3 pt-3">

            {order.status === "processing" && (
              <Button className="bg-blue-600 text-white"
                onClick={() => updateStatus(order.id, "in_delivery")}>
                Start Delivery
              </Button>
            )}

            {order.status === "in_delivery" && (
              <Button className="bg-green-600 text-white"
                onClick={() => updateStatus(order.id, "delivered")}>
                Mark Delivered
              </Button>
            )}

            {order.status === "delivered" && (
              <Button disabled className="bg-gray-400 text-white">Completed</Button>
            )}
          </div>

        </Card>
      ))}
    </div>
  );
}

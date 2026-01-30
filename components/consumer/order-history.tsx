"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Truck } from "lucide-react";
import { auth, db } from "@/components/dashboards/firebase/config";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const loadOrders = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "orders"),
        where("consumerId", "==", user.uid),
        orderBy("createdAt", "desc")   // this needs index
      );

      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));

      setOrders(list);
      setLoading(false);
    };

    loadOrders();
  }, []);

  const statusBadge = (st: string) => {
    if (st === "delivered") return <Badge className="bg-emerald-600">Delivered</Badge>;
    if (st === "in_delivery") return <Badge className="bg-blue-600">In Delivery</Badge>;
    return <Badge className="bg-yellow-600">Processing</Badge>;
  };

  const statusIcon = (st: string) => {
    if (st === "delivered") return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    if (st === "in_delivery") return <Truck className="w-5 h-5 text-blue-600" />;
    return <Clock className="w-5 h-5 text-amber-600" />;
  };

  if (loading) return <p>Loading...</p>;
  if (orders.length === 0) return <p>No orders yet.</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">My Orders</h2>

      <div className="space-y-4">
        {orders.map((o) => (
          <Card key={o.id} className="p-5 shadow flex flex-col gap-3">
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{o.cropName}</h3>
              <div className="flex gap-2 items-center">
                {statusIcon(o.status)}
                {statusBadge(o.status)}
              </div>
            </div>

            <div className="grid grid-cols-2 text-sm gap-2">
              <p><b>Qty:</b> {o.quantity} Q</p>
              <p><b>Total:</b> ₹{o.finalPay}</p>
              <p><b>Payment:</b> {o.paymentMethod}</p>
              <p><b>Order Type:</b> {o.orderType}</p>
            </div>
            
            <p className="text-xs text-gray-500">Order ID: {o.id}</p>
          </Card>
        ))}
      </div>
    </div>
  );
  
}

"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../dashboards/firebase/config";
import {
  collection, query, where, orderBy,
  onSnapshot, updateDoc, doc
} from "firebase/firestore";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FarmerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db,"orders"),
      where("farmerId","==",user.uid),
      orderBy("createdAt","desc")
    );

    const unsub = onSnapshot(q,(snap)=>{
      const arr:any[]=[];
      snap.forEach(d=>arr.push({id:d.id,...d.data()}));
      setOrders(arr);
      setLoading(false);
    });

    return ()=>unsub();
  },[]);

  const updateStatus = (id:string,status:string)=> 
    updateDoc(doc(db,"orders",id),{status});

  if(loading) return <p className="text-center mt-8">Loading...</p>;
  if(orders.length===0) return <p className="text-center mt-8">No Orders yet</p>;

  return(
  <div className="space-y-6">
    <h2 className="text-3xl font-bold mb-4">Orders Received</h2>

    {orders.map(order=>(
      <Card key={order.id} className="p-6 shadow space-y-3">

        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">{order.cropName}</h3>
          <span className={`px-3 py-1 rounded text-sm font-semibold
          ${order.status==="delivered"?"bg-green-200 text-green-700":
            order.status==="in_delivery"?"bg-blue-200 text-blue-700":
            "bg-yellow-200 text-yellow-700"}`}>
            {order.status.replace("_"," ")}
          </span>
        </div>

        <p><b>Quantity:</b> {order.quantity} Q</p>
        <p><b>Total Amount:</b> ₹{order.finalPay}</p>
        <p><b>Payment:</b> {order.paymentMethod}</p>
        <p><b>Order Type:</b> {order.orderType}</p>

        <hr/>
        <p><b>Phone:</b> {order.consumerPhone}</p>
        <p><b>Address:</b> {order.deliveryAddress}</p>

        <div className="flex gap-3 pt-3">
          {order.status==="processing" && (
            <Button onClick={()=>updateStatus(order.id,"in_delivery")} className="bg-blue-600 text-white">
              Start Delivery
            </Button>
          )}

          {order.status==="in_delivery" && (
            <Button onClick={()=>updateStatus(order.id,"delivered")} className="bg-green-600 text-white">
              Mark Delivered
            </Button>
          )}

          {order.status==="delivered" && (
            <Button disabled className="bg-gray-400 text-white">Completed</Button>
          )}
        </div>

      </Card>
    ))}
  </div>
  );
}

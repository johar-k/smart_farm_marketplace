"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { auth, db } from "../dashboards/firebase/config";
import {
  collection, doc, getDocs, deleteDoc,
  updateDoc, addDoc, serverTimestamp
} from "firebase/firestore";

export default function CartCheckout() {

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [showUPI, setShowUPI] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const DELIVERY_CHARGE = 50;

  useEffect(() => {
    const fetchCart = async () => {
      await loadCart();
    };
    fetchCart();
  }, []);

  // load cart from firestore
  const loadCart = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const snap = await getDocs(collection(db, "users", user.uid, "cart"));
    const arr: any[] = [];
    snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
    setCartItems(arr);
  };

  const removeItem = async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;

    await deleteDoc(doc(db, "users", user.uid, "cart", id));
    loadCart();
  };

  // ---------------------------------- HANDLE ORDER ONE ITEM AT A TIME ----------------------------------
  const placeSingleOrder = async (method: "UPI" | "PHONE" | "COD") => {
    const user = auth.currentUser;
    if (!user) return alert("Login required");
    if (cartItems.length === 0) return alert("Cart empty");

    const item = cartItems[0];                // only FIRST item is processed 👇
    const payAmount = item.total + DELIVERY_CHARGE;

    setProcessing(true);

    // ➤ 1. Create order doc
    await addDoc(collection(db, "orders"), {
      cropName: item.cropType,
      quantity: item.quantity,
      totalPrice: item.total,
      finalPay: payAmount,
      deliveryCharge: DELIVERY_CHARGE,
      farmerId: item.farmerId,
      farmerUpi: item.upiId,
      farmerPhone: item.phone,
      consumerId: user.uid,
      orderType: item.type,
      paymentMethod: method,
      status: "processing",
      createdAt: serverTimestamp()
    });

    // ➤ 2. Reduce stock from crop/pool
    if (item.type === "crop") {
      await updateDoc(doc(db, "crops", item.id), {
        quantity: item.available - item.quantity
      });
    } else {
      await updateDoc(doc(db, "communityPools", item.id), {
        currentQuantity: item.available - item.quantity
      });
    }

    // ➤ 3. Remove ONLY first item from cart
    await deleteDoc(doc(db, "users", user.uid, "cart", item.id));

    setProcessing(false);
    setShowUPI(false);
    setShowPhone(false);
    alert("Order placed for item 1 ✔ Continue next item now");
    loadCart();  // remaining items will still be there
  };

  // ------------------------------- UI POPUPS -------------------------------
  const PayUPIPopup = () => {
    const item = cartItems[0];
    if (!item) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="p-6 w-80 text-center space-y-3">
          <h2 className="text-xl font-bold">Pay via UPI</h2>
          <p>Pay to farmer UPI:</p>
          <p className="font-bold text-green-700">{item.upiId}</p>
          <p>Total to Pay: <b>₹{item.total + DELIVERY_CHARGE}</b></p>

          <Button className="bg-emerald-700 w-full text-white"
            onClick={() => {
              window.location.href=`upi://pay?pa=${item.upiId}&pn=Farmer&am=${item.total+DELIVERY_CHARGE}`;
              placeSingleOrder("UPI");
            }}>
            Pay & Place Order
          </Button>

          <Button className="bg-gray-600 text-white w-full"
            onClick={() => setShowUPI(false)}>Cancel</Button>
        </Card>
      </div>
    );
  };

  const PayPhonePopup = () => {
    const item = cartItems[0];
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="p-6 w-80 text-center space-y-3">
          <h2 className="text-xl font-bold">Phone Payment</h2>
          <p>Farmer Phone:</p>
          <p className="font-bold text-blue-700">{item.phone}</p>
          <p>Total Pay: <b>₹{item.total+DELIVERY_CHARGE}</b></p>

          <Button className="bg-blue-600 text-white w-full"
            onClick={() => placeSingleOrder("PHONE")}>
            Mark Paid & Place Order
          </Button>

          <Button className="bg-gray-600 text-white w-full"
            onClick={() => setShowPhone(false)}>Cancel</Button>
        </Card>
      </div>
    )
  };

  // ------------------------------- UI LAYOUT -------------------------------
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">My Cart</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT CART LIST */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.length===0 ?
            <Card className="p-10 text-center">No items in cart</Card>
            :
            cartItems.map((it,i)=>(
              <Card key={i} className="p-5 shadow flex items-start justify-between gap-4">

  {/* Left Block - Crop Details */}
  <div className="space-y-1">
    <h3 className="text-lg font-bold text-gray-900">{it.cropType}</h3>

    <p className="text-sm text-gray-600">
      {it.quantity} Q × ₹{it.price}
    </p>

    <p className="text-green-700 font-bold text-base">
      Total: ₹{it.total}
    </p>
  </div>

  {/* Right Side Delete */}
  <button 
    onClick={() => removeItem(it.id)}
    className="hover:bg-red-100 p-2 rounded transition"
  >
    <Trash2 className="text-red-600 w-5 h-5"/>
  </button>

</Card>

            ))
          }
        </div>

        {/* RIGHT CHECKOUT CARD */}
        <Card className="p-6 space-y-3">
          <h3 className="text-xl font-bold">Checkout (Order One by One)</h3>

          {cartItems[0] &&
            <div className="text-sm">
              <p>Crop: <b>{cartItems[0].cropType}</b></p>
              <p>Amount: ₹{cartItems[0].total}</p>
              <p>Delivery: ₹{DELIVERY_CHARGE}</p>
              <p className="text-green-700 font-bold">
                Total: ₹{cartItems[0].total + DELIVERY_CHARGE}
              </p>
            </div>
          }

          <Button disabled={!cartItems[0]} className="bg-emerald-700 text-white w-full"
            onClick={()=>setShowUPI(true)}>Pay via UPI</Button>

          <Button disabled={!cartItems[0]} className="bg-blue-600 text-white w-full"
            onClick={()=>setShowPhone(true)}>Pay by Phone</Button>

          <Button disabled={!cartItems[0]} className="bg-black text-white w-full"
            onClick={()=>placeSingleOrder("COD")}>Cash on Delivery</Button>
        </Card>
      </div>

      {showUPI && <PayUPIPopup/>}
      {showPhone && <PayPhonePopup/>}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { auth, db } from "../dashboards/firebase/config";
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function CartCheckout() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const DELIVERY_CHARGE = 50;

  useEffect(() => {
    loadCart();
  }, []);

  // Load cart from Firestore
  const loadCart = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const snap = await getDocs(collection(db, "users", user.uid, "cart"));
    const arr: any[] = [];
    snap.forEach((doc) => arr.push(doc.data()));
    setCartItems(arr);
  };

  const removeItem = async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "cart", id));
    loadCart();
  };

  const subtotal = cartItems.reduce((t, i) => t + i.total, 0);
  const grandTotal = subtotal + DELIVERY_CHARGE;

  // ------------------ PAYMENT ACTION ------------------
  const placeOrder = async (method: "UPI" | "PHONE" | "COD") => {
    const user = auth.currentUser;
    if (!user) return alert("Login required");

    if (cartItems.length === 0) return alert("Cart is empty");

    // 🔥 Save order in Firestore
    const orderRef = await addDoc(collection(db, "orders"), {
      userId: user.uid,
      items: cartItems,
      amount: grandTotal,
      deliveryCharge: DELIVERY_CHARGE,
      paymentMethod: method,
      paymentStatus: method === "COD" ? "pending" : "awaiting_payment",
      createdAt: serverTimestamp(),
    });

    // 🔥 Reduce stock
    for (const item of cartItems) {
      if (item.type === "crop") {
        await updateDoc(doc(db, "crops", item.id), {
          quantity: item.available - item.quantity,
        });
      } else if (item.type === "pool") {
        await updateDoc(doc(db, "communityPools", item.id), {
          currentQuantity: item.available - item.quantity,
        });
      }
    }

    // 🔥 Clear cart
    const snap = await getDocs(collection(db, "users", user.uid, "cart"));
    snap.forEach((d) => deleteDoc(doc(db, "users", user.uid, "cart", d.id)));

    alert("Order Placed Successfully 🎉");
    loadCart();

    // 🔥 Only open UPI/pay if selected
    if (method === "UPI") upiPayment(orderRef.id);
    if (method === "PHONE") phonePayment(orderRef.id);
  };

  // 🔹 Open UPI App for payment
  const upiPayment = (orderId: string) => {
    const farmerUpi = cartItems[0].upiId;
    if (!farmerUpi) return alert("Farmer UPI not found");

    const upiURL = `upi://pay?pa=${farmerUpi}&pn=Farmer&am=${grandTotal}&tn=Order-${orderId}`;
    window.location.href = upiURL;
  };

  // 🔹 Show phone number for manual payment
  const phonePayment = (orderId: string) => {
    const phone = cartItems[0].phone;
    alert(`📞 Call & Pay to Farmer: ${phone}`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">My Cart</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CART */}
        <div className="space-y-4 lg:col-span-2">
          {cartItems.length === 0 ? (
            <Card className="p-10 text-center shadow">
              <p className="text-gray-600 text-lg">No items in cart</p>
              <p className="text-gray-500 text-sm">Add items from Browse</p>
            </Card>
          ) : (
            cartItems.map((item, index) => (
              <Card key={index} className="p-5 shadow flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{item.cropType}</h3>
                  <p className="text-sm text-gray-600">Farmer: {item.farmerName}</p>
                  <p className="text-sm">₹{item.price}/Q x {item.quantity} Q</p>
                  <p className="text-emerald-700 font-bold">Total: ₹{item.total}</p>
                </div>

                <button className="text-red-600 hover:text-red-700" onClick={() => removeItem(item.id)}>
                  <Trash2 className="w-6 h-6" />
                </button>
              </Card>
            ))
          )}
        </div>

        {/* SUMMARY */}
        <Card className="p-6 shadow">
          <h3 className="text-xl font-bold mb-3">Order Summary</h3>
          <div className="space-y-2 border-b pb-3">
            <p className="flex justify-between"><span>Items:</span><span>{cartItems.length}</span></p>
            <p className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal}</span></p>
            <p className="flex justify-between"><span>Delivery:</span><span>₹{DELIVERY_CHARGE}</span></p>
          </div>
          <h3 className="flex justify-between mt-3 text-lg font-bold">
            <span>Total:</span> <span className="text-emerald-600">₹{grandTotal}</span>
          </h3>

          {/* PAYMENT OPTIONS */}
          <div className="mt-5 space-y-3">
            <Button className="w-full bg-emerald-600 text-white text-lg"
              onClick={() => placeOrder("UPI")}>
              Pay via UPI
            </Button>

            <Button className="w-full bg-blue-600 text-white text-lg"
              onClick={() => placeOrder("PHONE")}>
              Pay via Phone Number
            </Button>

            <Button className="w-full bg-gray-700 text-white text-lg"
              onClick={() => placeOrder("COD")}>
              Cash on Delivery
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

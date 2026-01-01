"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { auth, db } from "../dashboards/firebase/config";
import {
  collection, doc, getDocs, deleteDoc,
  updateDoc, addDoc, serverTimestamp, getDoc
} from "firebase/firestore";

export default function CartCheckout() {

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [showUPI, setShowUPI] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const DELIVERY_CHARGE = 50;

  useEffect(() => { loadCart() }, []);

  // Load cart items
  const loadCart = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const snap = await getDocs(collection(db, "users", user.uid, "cart"));
    const arr:any[]=[];
    snap.forEach(d=>arr.push({id:d.id,...d.data()}));
    setCartItems(arr);
  }

  const removeItem = async (id:string)=>{
    const user=auth.currentUser;
    if(!user) return;
    await deleteDoc(doc(db,"users",user.uid,"cart",id));
    loadCart();
  };

  // Place order for FIRST item only
  const placeSingleOrder = async(method:"UPI"|"PHONE"|"COD")=>{
    const user=auth.currentUser;
    if(!user) return alert("Login required");
    if(cartItems.length===0) return alert("Cart empty");

    const item = cartItems[0]; 
    const payable = item.total + DELIVERY_CHARGE;

    setProcessing(true);

    // ---------------- Fetch Consumer Profile Data ----------------
    const userRef = doc(db,"users",user.uid);
    const userSnap = await getDoc(userRef);

    let consumer = {
      fullName:"Unknown",
      phone:"N/A",
      address:"Not provided",
      city:"",
      state:"",
      pincode:""
    };

    if(userSnap.exists()){
      const u=userSnap.data();
      consumer = {
        fullName: u.fullName || "Unknown",
        phone: u.phone || "N/A",
        address: u.address || "Not provided",
        city: u.city || "",
        state: u.state || "",
        pincode: u.pincode || ""
      }
    }

    // ---------------- Create Order ----------------
    await addDoc(collection(db,"orders"),{
      cropName:item.cropType,
      quantity:item.quantity,
      totalPrice:item.total,
      finalPay:payable,
      deliveryCharge:DELIVERY_CHARGE,

      // Farmer side
      farmerId:item.farmerId,
      farmerUpi:item.upiId,
      farmerPhone:item.phone,

      // Consumer details
      consumerId:user.uid,
      consumerName:consumer.fullName,
      consumerPhone:consumer.phone,
      deliveryAddress:`${consumer.address}, ${consumer.city}, ${consumer.state} - ${consumer.pincode}`,

      orderType:item.type,
      paymentMethod:method,
      status:"processing",
      createdAt:serverTimestamp()
    });

    // ---------------- Reduce Stock ----------------
    if(item.type==="crop"){
      await updateDoc(doc(db,"crops",item.id),{
        quantity:item.available - item.quantity
      });
    }else{
      await updateDoc(doc(db,"communityPools",item.id),{
        currentQuantity:item.available - item.quantity
      });
    }

    // ---------------- Remove only 1st item from cart ----------------
    await deleteDoc(doc(db,"users",user.uid,"cart",item.id));

    alert("Order Placed ✔ Continue next item");
    setProcessing(false);
    setShowUPI(false);
    setShowPhone(false);
    loadCart();
  };

  // ------------------ POPUP UPI ------------------
  const PayUPIPopup=()=>(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="p-6 w-80 text-center space-y-3">
        <h2 className="text-xl font-bold">Pay via UPI</h2>
        <p>UPI ID:</p>
        <p className="font-bold text-green-600">{cartItems[0]?.upiId}</p>
        <p>Total Pay: <b>₹{cartItems[0]?.total+DELIVERY_CHARGE}</b></p>

        <Button className="bg-emerald-700 text-white w-full"
          onClick={()=>{
            window.location.href=
              `upi://pay?pa=${cartItems[0].upiId}&pn=Farmer&am=${cartItems[0].total+DELIVERY_CHARGE}`;
            placeSingleOrder("UPI");
          }}>
          Pay & Place Order
        </Button>

        <Button className="bg-gray-600 text-white w-full"
          onClick={()=>setShowUPI(false)}>Cancel</Button>
      </Card>
    </div>
  );

  // ------------------ POPUP PHONE ------------------
  const PayPhonePopup=()=>(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="p-6 w-80 text-center space-y-3">
        <h2 className="text-xl font-bold">Phone Payment</h2>
        <p>Call Farmer:</p>
        <p className="font-bold text-blue-600">{cartItems[0]?.phone}</p>
        <p>Total Pay: <b>₹{cartItems[0]?.total+DELIVERY_CHARGE}</b></p>

        <Button className="bg-blue-600 w-full text-white"
          onClick={()=>placeSingleOrder("PHONE")}>
          Mark Paid & Place Order
        </Button>

        <Button className="bg-gray-600 w-full text-white"
          onClick={()=>setShowPhone(false)}>Cancel</Button>
      </Card>
    </div>
  );

  // ------------------ UI -----------------
  return (
  <div className="w-full px-6 py-6">

    {/* PAGE TITLE */}
    <h2 className="text-3xl font-extrabold mb-6">My Cart</h2>

    {/* MAIN GRID FIXED LEFT - RIGHT */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">

      {/* LEFT — CART LIST (FULL WIDTH & LEFT ALIGNED) */}
      <div className="lg:col-span-2 w-full space-y-4">

        {cartItems.length === 0 ? (
          <Card className="p-10 text-center text-gray-500 text-lg font-medium">
            Cart is Empty 😐
          </Card>
        ) : (
          cartItems.map((item, index) => (
            <Card
              key={index}
              className="p-5 rounded-xl shadow-md hover:shadow-lg transition flex justify-between items-center w-full"
            >
              {/* LEFT DETAILS */}
              <div className="space-y-1 text-left w-full">
                <h3 className="text-xl font-semibold capitalize">{item.cropType}</h3>
                <p className="text-gray-600 text-sm">{item.quantity} Q × ₹{item.price}</p>
                <p className="font-bold text-green-700 text-lg">₹{item.total}</p>
              </div>

              {/* DELETE BUTTON RIGHT */}
              <button
                onClick={() => removeItem(item.id)}
                className="p-2 rounded hover:bg-red-100 transition"
              >
                <Trash2 className="text-red-600 w-6 h-6" />
              </button>
            </Card>
          ))
        )}
      </div>

      {/* RIGHT — CHECKOUT BOX CLEAN FIXED RIGHT */}
      <div className="w-full">
        <Card className="p-6 rounded-xl shadow-lg space-y-4 w-full">

          <h3 className="text-2xl font-bold text-gray-900">Checkout Summary</h3>

          {cartItems[0] && (
            <div className="space-y-1 text-gray-800 border-b pb-3">
              <p><b>Crop:</b> {cartItems[0].cropType}</p>
              <p><b>Amount:</b> ₹{cartItems[0].total}</p>
              <p><b>Delivery:</b> ₹{DELIVERY_CHARGE}</p>
              <p className="text-green-700 font-extrabold text-lg">
                Total Payable: ₹{cartItems[0].total + DELIVERY_CHARGE}
              </p>
            </div>
          )}

          {/* PAYMENT BUTTONS */}
          <div className="space-y-3">
            <Button
              disabled={!cartItems[0]}
              className="bg-emerald-700 w-full py-2 text-lg"
              onClick={() => setShowUPI(true)}
            >
              💸 Pay via UPI
            </Button>

            <Button
              disabled={!cartItems[0]}
              className="bg-blue-600 w-full py-2 text-lg"
              onClick={() => setShowPhone(true)}
            >
              📞 Pay by Phone
            </Button>

            <Button
              disabled={!cartItems[0]}
              className="bg-black w-full py-2 text-lg"
              onClick={() => placeSingleOrder("COD")}
            >
              🚚 Cash On Delivery
            </Button>
          </div>
        </Card>
      </div>
    </div>

    {/* POPUPS */}
    {showUPI && <PayUPIPopup />}
    {showPhone && <PayPhonePopup />}
  </div>
);

}

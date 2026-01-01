"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, X, Users } from "lucide-react";
import { auth, db } from "../dashboards/firebase/config";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function BrowseCrops() {
  const [farmerCrops, setFarmerCrops] = useState<any[]>([]);
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewType, setViewType] = useState<"crops" | "pools">("crops");

  const [searchTerm, setSearchTerm] = useState("");
  const [region, setRegion] = useState("");
  const [season, setSeason] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [addModal, setAddModal] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  // -------------------------------------------------------------------
  // Load Crops + Pool Data properly including farmerId + upiId
  // -------------------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      // CROPS
      const cropSnap = await getDocs(collection(db, "crops"));
      const arr1: any[] = [];

      for (const c of cropSnap.docs) {
        const data = c.data();
        const userSnap = await getDoc(doc(db, "users", data.farmerId));

        arr1.push({
          id: c.id,
          ...data,
          farmerId: data.farmerId,
          farmerName: userSnap.exists() ? userSnap.data().fullName : "",
          phone: userSnap.exists() ? userSnap.data().phone : "",
          upiId: userSnap.exists() ? userSnap.data().upiId : "",
          price: data.basePrice,
          available: data.quantity,
          type: "crop",
        });
      }

      // POOLS
      const poolSnap = await getDocs(collection(db, "communityPools"));
      const arr2: any[] = [];

      for (const p of poolSnap.docs) {
        const data = p.data();
        const userSnap = await getDoc(doc(db, "users", data.createdBy));

        arr2.push({
          id: p.id,
          ...data,
          farmerId: data.createdBy,    // IMPORTANT
          farmerName: userSnap.exists() ? userSnap.data().fullName : "",
          phone: userSnap.exists() ? userSnap.data().phone : "",
          upiId: userSnap.exists() ? userSnap.data().upiId : "",
          price: data.pricePerQuintal,
          available: data.currentQuantity,
          type: "pool",
        });
      }

      setFarmerCrops(arr1);
      setPools(arr2);
      setLoading(false);
    };
    load();
  }, []);

  if (loading)
    return <p className="text-center mt-10 text-lg">Loading...</p>;

  const filteredCrops = farmerCrops.filter(
    (c) =>
      (searchTerm === "" ||
        c.cropType.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (region === "" || c.region === region) &&
      (season === "" || c.season === season) &&
      (minPrice === "" || c.price >= Number(minPrice)) &&
      (maxPrice === "" || c.price <= Number(maxPrice))
  );

  const filteredPools = pools.filter((p) =>
    searchTerm === "" ||
    p.cropType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const total = (price: number, qty: number) => price * qty;

  // -------------------------------------------------------------------
  // ADD TO CART (fixed final version)
  // -------------------------------------------------------------------
  const addToCart = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Login Required");

    if (!addModal.farmerId) return alert("❌ FarmerID missing");
    if (!addModal.upiId) return alert("❌ Farmer UPI missing");
    if (quantity <= 0) return alert("Invalid quantity");
    if (quantity > addModal.available) return alert("Not enough stock");

    await setDoc(
      doc(db, "users", user.uid, "cart", addModal.id),
      {
        id: addModal.id,
        cropType: addModal.cropType,
        price: addModal.price,
        quantity,
        total: total(addModal.price, quantity),
        type: addModal.type,

        farmerId: addModal.farmerId,
        farmerName: addModal.farmerName,
        phone: addModal.phone,
        upiId: addModal.upiId,

        timestamp: serverTimestamp(),
      },
      { merge: true }
    );

    alert("🛒 Added to cart!");
    setAddModal(null);
  };

  // -------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-2">Browse Marketplace</h2>

      <div className="flex gap-3">
        <Button className={viewType === "crops" ? "bg-emerald-600 text-white" : ""}
          onClick={() => setViewType("crops")}>
          Crops
        </Button>

        <Button className={viewType === "pools" ? "bg-emerald-600 text-white" : ""}
          onClick={() => setViewType("pools")}>
          Community Pools
        </Button>
      </div>

      {/* CROPS */}
      {viewType === "crops" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((c) => (
            <Card key={c.id} className="p-5 shadow">
              <h2 className="text-xl font-bold">{c.cropType}</h2>
              <p>Qty: {c.available} Q</p>
              <p className="font-bold text-green-700">₹{c.price}/Q</p>

              <Button className="bg-emerald-600 text-white w-full mt-3"
                onClick={() => setAddModal(c)}>
                Add to Cart <ShoppingCart size={14} />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* POOLS */}
      {viewType === "pools" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPools.map((p) => (
            <Card key={p.id} className="p-5 shadow">
              <h2 className="text-xl font-bold">{p.cropType} Pool</h2>
              <p><Users size={14} /> Members: {p.membersCount}</p>
              <p>Qty: {p.available}/{p.targetQuantity} Q</p>
              <p className="font-bold text-green-700">₹{p.price}/Q</p>

              <Button className="bg-emerald-600 text-white w-full mt-3"
                onClick={() => setAddModal(p)}>
                Buy <ShoppingCart size={14} />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* ADD MODAL */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <Card className="p-6 w-96 bg-white relative">
            <X className="absolute top-2 right-2 cursor-pointer"
              onClick={() => setAddModal(null)} />

            <h2 className="text-xl font-bold">{addModal.cropType}</h2>
            <p>₹{addModal.price}/Q</p>

            <label className="block mt-3">Quantity</label>
            <Input type="number" min={1} max={addModal.available}
              value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />

            <p className="text-md font-bold mt-2 text-emerald-700">
              Total: ₹{total(addModal.price, quantity)}
            </p>

            <Button className="bg-emerald-600 text-white w-full mt-4"
              onClick={addToCart}>
              Confirm & Add to Cart
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

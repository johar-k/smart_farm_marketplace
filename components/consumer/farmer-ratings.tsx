"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { auth, db } from "../dashboards/firebase/config";
import {
  collection, query, where, getDocs, addDoc,
  serverTimestamp, doc, updateDoc, onSnapshot
} from "firebase/firestore";

// ---------- COMPONENT START ----------
export default function FarmerRatings() {

  const [farmers, setFarmers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  // FETCH FARMERS LIVE
  useEffect(() => {
    const q = query(collection(db,"users"), where("role","==","farmer"));
    const unsub = onSnapshot(q,(snap)=>{
      const data:any[]=[];
      snap.forEach(d => data.push({id:d.id, ...d.data()}));
      setFarmers(data);
    });
    return ()=>unsub();
  },[]);

  // SUBMIT REVIEW
  const submitReview = async () => {
    const user = auth.currentUser;
    if(!user) return alert("Login required");

    if(!rating) return alert("Rate before submitting");

    const reviewRef = collection(db,"users",selected.id,"reviews");

    await addDoc(reviewRef,{
      rating,
      review,
      consumerId:user.uid,
      createdAt:serverTimestamp()
    });

    // Update farmer rating values
    const totalRatings = (selected.ratingCount || 0) + 1;
    const newAvg = ((selected.rating || 0)* (selected.ratingCount || 0) + rating) / totalRatings;

    await updateDoc(doc(db,"users",selected.id),{
      rating:+newAvg.toFixed(1),
      ratingCount: totalRatings
    });

    alert("Review submitted 🎉");
    setSelected(null);
    setRating(0);
    setReview("");
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Farmer Ratings</h2>

      {/* FARMER CARDS */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farmers.map(f => (
          <Card key={f.id} className="p-6 shadow hover:shadow-lg transition">
            <h3 className="text-lg font-bold">{f.fullName || "Unknown Farmer"}</h3>

            <div className="mt-2 flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_,i)=>(
                  <Star key={i} className={`w-4 h-4 ${
                    i < Math.round(f.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`} />
                ))}
              </div>
              <span className="font-bold">{f.rating || "0"}</span>
              <span className="text-gray-600 text-sm">({f.ratingCount||0})</span>
            </div>

            <p className="text-sm text-gray-600 mt-2">Phone: {f.phone||"N/A"}</p>
            <p className="text-sm text-gray-600">Email: {f.email||"N/A"}</p>

            <Button className="mt-4 w-full bg-emerald-600 text-white"
              onClick={()=>setSelected(f)}>
              Leave Review
            </Button>
          </Card>
        ))}
      </div>

      {/* REVIEW POPUP */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-3">
              Rate {selected.fullName}
            </h3>

            <div className="flex gap-2 my-3">
              {[1,2,3,4,5].map(s=>(
                <Star key={s} onClick={()=>setRating(s)}
                className={`w-8 h-8 cursor-pointer ${
                  s<=rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                }`} />
              ))}
            </div>

            <textarea placeholder="Write your review..."
              value={review} onChange={e=>setReview(e.target.value)}
              className="w-full border p-2 rounded" rows={4}/>

            <div className="flex gap-3 mt-4">
              <Button className="w-1/2 bg-gray-300" onClick={()=>setSelected(null)}>
                Cancel
              </Button>
              <Button className="w-1/2 bg-emerald-600 text-white" onClick={submitReview}>
                Submit
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

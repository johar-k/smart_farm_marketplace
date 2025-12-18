"use client";

import FarmerDashboard from "@/components/dashboards/farmer-dashboard";
import { useRouter } from "next/navigation";

export default function FarmerDashboardPage() {
  const router = useRouter();

  return (
    <FarmerDashboard
      onLogout={() => router.push("/")}
      onSwitchRole={() => router.push("/")}
    />
  );
}

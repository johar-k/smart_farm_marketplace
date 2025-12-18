"use client";

import ConsumerDashboard from "@/components/dashboards/consumer-dashboard";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <ConsumerDashboard
      onLogout={() => router.push("/")}
      onSwitchRole={() => router.push("/")}
    />
  );
}

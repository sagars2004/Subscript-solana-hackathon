"use client";

import dynamic from "next/dynamic";
import { NavHeader } from "@/components/ui/nav-header";

const SubscriberDashboard = dynamic(
  () => import("@/app/subscriber/subscriber-dashboard").then((module) => module.SubscriberDashboard),
  { ssr: false },
);

export default function SubscriberPage() {
  return (
    <main className="shell">
      <NavHeader activeRoute="subscriber" />
      <SubscriberDashboard />
    </main>
  );
}

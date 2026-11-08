"use client";

import dynamic from "next/dynamic";
import { NavHeader } from "@/components/ui/nav-header";

const MerchantWorkspace = dynamic(
  () => import("@/app/merchant/merchant-workspace").then((module) => module.MerchantWorkspace),
  { ssr: false },
);

export default function MerchantPage() {
  return (
    <main className="shell">
      <NavHeader activeRoute="merchant" />
      <MerchantWorkspace />
    </main>
  );
}

"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const MerchantWorkspace = dynamic(() => import("@/app/merchant/merchant-workspace").then((module) => module.MerchantWorkspace), { ssr: false });

export default function MerchantPage() { return <main className="shell"><Link className="back-link" href="/">← Back to Subscript</Link><MerchantWorkspace /></main>; }

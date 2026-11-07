"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const SubscriberDashboard = dynamic(() => import("@/app/subscriber/subscriber-dashboard").then((module) => module.SubscriberDashboard), { ssr: false });

export default function SubscriberPage() {
  return <main className="shell"><Link className="back-link" href="/">← Back to Subscript</Link><SubscriberDashboard /></main>;
}

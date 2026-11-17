"use client";
import { usePathname } from "next/navigation";
import { PendingLanding } from "~/components/intro";
import { PageSkeleton } from "~/components/loading-skeletons";
export default function Loading() {
  return usePathname() === "/" ? <PendingLanding /> : <PageSkeleton />;
}

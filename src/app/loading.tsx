"use client";
import { usePathname } from "next/navigation";
import { PageSkeleton } from "~/components/loading-skeletons";
export default function Loading() {
  return usePathname() === "/" ? null : <PageSkeleton />;
}

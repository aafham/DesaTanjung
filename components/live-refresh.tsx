"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DASHBOARD_REFRESH_INTERVAL } from "@/lib/constants";

export function LiveRefresh({
  interval = DASHBOARD_REFRESH_INTERVAL,
}: {
  interval?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
    }, interval);

    return () => window.clearInterval(timer);
  }, [interval, router]);

  return null;
}

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

// Routes under /dashboard that are shared across every role and should not
// be redirected away from based on the role-segment check below.
const SHARED_DASHBOARD_ROUTES = ["profile"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, currentUserRole } = useAuthStore();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    const segment = pathname.split("/")[2] ?? "";
    if (SHARED_DASHBOARD_ROUTES.includes(segment)) return;

    if (currentUserRole && segment !== currentUserRole) {
      router.replace(`/dashboard/${currentUserRole}`);
    }
  }, [hasMounted, isAuthenticated, currentUserRole, pathname, router]);

  const segment = pathname.split("/")[2] ?? "";
  const isRoleMismatch =
    !SHARED_DASHBOARD_ROUTES.includes(segment) && currentUserRole && segment !== currentUserRole;

  if (!hasMounted || !isAuthenticated || isRoleMismatch) {
    return null; // Prevents flashing content while redirecting
  }

  return <>{children}</>;
}

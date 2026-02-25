"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/Context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (role && user.role !== role) {
      router.push("/login");
    }
  }, [user, role, router]);

  if (!user) return null;

  return children;
}

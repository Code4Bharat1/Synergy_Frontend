// "use client";

// import { useEffect } from "react";
// import { useRouter, usePathname } from "next/navigation";

// export default function ProtectedLayout({ children }) {
//   const router = useRouter();
//   const pathname = usePathname();

//   useEffect(() => {
//     const token = localStorage.getItem("accessToken");
//     const role = localStorage.getItem("role");

//     // If no token → go login
//     if (!token) {
//       router.replace("/login");
//       return;
//     }

//     // Role based protection
//     if (pathname.startsWith("/director") && role !== "director") {
//       router.replace("/login");
//     }

//     if (pathname.startsWith("/engineer") && role !== "engineer") {
//       router.replace("/login");
//     }

//     if (pathname.startsWith("/manager") && role !== "manager") {
//       router.replace("/login");
//     }

//   }, [pathname, router]);

//   return <>{children}</>;
// }

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");

    // ❌ Not logged in
    if (!token || !role) {
      router.replace("/login");
      return;
    }

    // Extract role from URL
    const pathRole = pathname.split("/")[1];

    // ❌ Logged in but accessing wrong role
    if (pathRole !== role) {
      router.replace(`/${role}/dashboard`);
    }

  }, [pathname, router]);

  return <>{children}</>;
}

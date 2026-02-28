"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setRole, setToken, setEmployeeId } from "@/helper/helper";

export default function GoogleAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (token) {
      try {
        setToken(token);
        try {
          const base64 = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
          if (base64) {
            const json = JSON.parse(atob(base64));
            if (json?.role) setRole(json.role);
            if (json?.employeeId) setEmployeeId(json.employeeId);
          }
        } catch {}
      } catch (e) {
        console.error("Failed to store token from OAuth redirect", e);
      }
      // Clean URL and redirect
      url.searchParams.delete("token");
      window.history.replaceState({}, document.title, url.pathname + (url.search ? `?${url.searchParams.toString()}` : "") + url.hash);
      router.replace("/");
    } else {
      // No token present; send back to login/home
      router.replace("/");
    }
  }, [router]);

  return (
    <div className="w-full min-h-[50vh] flex items-center justify-center text-gray-700">
      <span className="text-sm">Signing you in with Google…</span>
    </div>
  );
}

"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiPackage, FiGrid, FiSliders, FiPlusCircle } from "react-icons/fi";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: "/dashboard/products", label: "All Products", icon: FiPackage },
  { href: "/dashboard/products/categories", label: "Categories", icon: FiGrid },
  { href: "/dashboard/products/attributes", label: "Colors & Sizes", icon: FiSliders },
  { href: "/dashboard/products/create", label: "Create", icon: FiPlusCircle },
];

export default function ProductsNav() {
  const pathname = usePathname();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <nav className="flex" aria-label="Tabs">
        {navItems.map((item) => {
          const isExactActive = item.href === "/dashboard/products"
            ? pathname === "/dashboard/products"
            : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                isExactActive
                  ? "border-[#dc2626] text-[#dc2626] bg-red-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

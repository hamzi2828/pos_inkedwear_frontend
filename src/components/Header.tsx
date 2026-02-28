"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaArrowRight, FaBars, FaTimes, FaTshirt } from "react-icons/fa";
import { getCurrentUser, removeToken } from "@/helper/helper";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const toggleMobileMenu = () => setIsMobileMenuOpen((s) => !s);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    try {
      removeToken();
      setIsLoggedIn(false);
    } finally {
      closeMobileMenu();
      router.replace("/");
      router.refresh();
    }
  };

  // Initialize auth state after mount to prevent hydration issues
  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(!!getCurrentUser());
  }, []);

  // Keep auth state in sync across tabs and navigations
  useEffect(() => {
    if (!mounted) return;

    const update = () => setIsLoggedIn(!!getCurrentUser());
    window.addEventListener("focus", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("focus", update);
      window.removeEventListener("storage", update);
    };
  }, [mounted]);

  const routes = {
    auth: "/authentication",
    home: "/",
    dashboard: "/dashboard",
  };

  const navLinks = [
    { href: routes.home, label: "Home" },
  ];

  return (
    <header className="fixed w-full top-0 z-50">
      <nav className="nav-bar">
        {/* Brand Logo */}
        <div className="flex-shrink-0">
          <Link
            href={routes.home}
            className="logo no-underline hover:opacity-80 transition-opacity duration-300 flex items-center gap-3"
            onClick={closeMobileMenu}
            aria-label="Go to homepage"
          >
            <div className="w-10 h-10 bg-[#dc2626] rounded-lg flex items-center justify-center">
              <FaTshirt className="text-white text-xl" />
            </div>
            <span className="text-gray-900 font-bold text-xl md:text-2xl">
              Inked <span className="text-[#dc2626]">Wear</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-300 text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="right-section">
          {!mounted ? (
            <Link
              href={routes.auth}
              className="cta-button for-mobile hidden md:flex"
              aria-label="Sign In"
              onClick={closeMobileMenu}
            >
              <span className="cta-text">Sign In</span>
              <FaArrowRight size={15} aria-hidden="true" className="text-white" />
            </Link>
          ) : isLoggedIn ? (
            <>
              <Link
                href={routes.dashboard}
                className="cta-button for-mobile hidden md:flex"
                aria-label="Go to Dashboard"
                onClick={closeMobileMenu}
              >
                <span className="cta-text">Dashboard</span>
                <FaArrowRight size={15} aria-hidden="true" className="text-white" />
              </Link>
              <button
                type="button"
                className="cta-button for-mobile hidden md:flex ml-2"
                aria-label="Logout"
                onClick={handleLogout}
              >
                <span className="cta-text">Logout</span>
              </button>
            </>
          ) : (
            <Link
              href={routes.auth}
              className="cta-button for-mobile hidden md:flex"
              aria-label="Sign In"
              onClick={closeMobileMenu}
            >
              <span className="cta-text">Sign In</span>
              <FaArrowRight size={15} aria-hidden="true" className="text-white" />
            </Link>
          )}

          <button
            className="mobile-menu-button lg:hidden"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? "active" : ""}`} role="menu">
          {/* Mobile Nav Links */}
          <div className="space-y-3 mb-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-gray-600 hover:text-gray-900 transition-colors duration-300 text-base font-medium py-2"
                onClick={closeMobileMenu}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-200">
            {!mounted ? (
              <Link
                href={routes.auth}
                className="cta-button w-full justify-center"
                aria-label="Sign In"
                onClick={closeMobileMenu}
              >
                <span className="cta-text">Sign In</span>
                <FaArrowRight size={15} aria-hidden="true" className="text-white" />
              </Link>
            ) : isLoggedIn ? (
              <>
                <Link
                  href={routes.dashboard}
                  className="cta-button w-full justify-center mb-3"
                  aria-label="Go to Dashboard"
                  onClick={closeMobileMenu}
                >
                  <span className="cta-text">Dashboard</span>
                  <FaArrowRight size={15} aria-hidden="true" className="text-white" />
                </Link>
                <button
                  type="button"
                  className="cta-button w-full justify-center"
                  aria-label="Logout"
                  onClick={handleLogout}
                >
                  <span className="cta-text">Logout</span>
                </button>
              </>
            ) : (
              <Link
                href={routes.auth}
                className="cta-button w-full justify-center"
                aria-label="Sign In"
                onClick={closeMobileMenu}
              >
                <span className="cta-text">Sign In</span>
                <FaArrowRight size={15} aria-hidden="true" className="text-white" />
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;

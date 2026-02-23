"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import LogoutButton from "./LogoutButton";

interface HeaderMenuProps {
  isAdmin: boolean;
  userEmail?: string;
}

export default function HeaderMenu({ isAdmin, userEmail }: HeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
          {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-stone-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-stone-100">
            <p className="text-sm font-medium text-stone-900 truncate">
              {userEmail}
            </p>
          </div>

          {isAdmin && (
            <Link
              href="/dashboard/users"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Quản lý Người dùng
            </Link>
          )}

          <LogoutButton />
        </div>
      )}
    </div>
  );
}

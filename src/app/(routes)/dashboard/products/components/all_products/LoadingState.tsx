"use client";
import React from "react";

export default function LoadingState() {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span className="text-sm text-gray-500">Loading products...</span>
        </div>
      </div>
    </div>
  );
}
"use client";
import React, { useState, useMemo } from "react";
import Image from "next/image";
import { FiEdit2, FiTrash2, FiStar, FiSearch, FiPackage, FiGrid, FiList, FiMoreVertical } from "react-icons/fi";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  active: boolean;
  featured?: boolean;
}

export interface CategoryWithCount extends Category {
  count: number;
  activeCount: number;
  inactiveCount: number;
}

interface CategoriesTabProps {
  categories: CategoryWithCount[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onToggleFeatured: (id: string) => void;
  onCategoryClick?: (categoryName: string) => void;
}

export default function CategoriesTab({ categories, onEdit, onDelete, onToggleActive, onToggleFeatured, onCategoryClick }: CategoriesTabProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleImageError = (categoryId: string) => {
    setImageErrors(prev => new Set([...prev, categoryId]));
  };

  const getImageSrc = (thumbnailUrl: string) => {
    return thumbnailUrl.startsWith('/')
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${thumbnailUrl}`
      : thumbnailUrl;
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(query) ||
      cat.slug.toLowerCase().includes(query) ||
      cat.description?.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const stats = useMemo(() => ({
    total: categories.length,
    active: categories.filter(c => c.active).length,
    featured: categories.filter(c => c.featured).length,
    totalProducts: categories.reduce((sum, c) => sum + c.count, 0),
  }), [categories]);

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <FiGrid className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Categories</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <div className="h-5 w-5 rounded-full bg-green-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <FiStar className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.featured}</p>
              <p className="text-sm text-gray-500">Featured</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <FiPackage className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
              <p className="text-sm text-gray-500">Total Products</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
              title="Grid view"
            >
              <FiGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
              title="List view"
            >
              <FiList className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories Display */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FiGrid className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? "No categories found" : "No categories yet"}
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {searchQuery
              ? `No categories match "${searchQuery}". Try a different search term.`
              : "Get started by creating your first category to organize your products."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className={`group bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200 hover:shadow-md hover:border-indigo-200 ${!cat.active ? "opacity-60" : ""} ${onCategoryClick ? "cursor-pointer" : ""}`}
              onClick={() => onCategoryClick?.(cat.name)}
            >
              {/* Card Header with Image */}
              <div className="relative h-44 bg-gradient-to-br from-indigo-50 to-purple-50">
                {cat.thumbnailUrl && !imageErrors.has(cat.id) ? (
                  <Image
                    src={getImageSrc(cat.thumbnailUrl)}
                    alt={cat.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    onError={() => handleImageError(cat.id)}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl font-bold text-indigo-200">
                      {cat.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                  {cat.featured && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900 shadow-sm">
                      <FiStar className="h-3 w-3 fill-current" />
                      Featured
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shadow-sm ${cat.active ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}>
                    {cat.active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Actions Menu */}
                <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <button
                      onClick={() => toggleMenu(cat.id)}
                      className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-all"
                    >
                      <FiMoreVertical className="h-4 w-4 text-gray-600" />
                    </button>
                    {openMenuId === cat.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                          <button
                            onClick={() => { onEdit(cat.id); setOpenMenuId(null); }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <FiEdit2 className="h-4 w-4" />
                            Edit Category
                          </button>
                          <button
                            onClick={() => { onToggleFeatured(cat.id); setOpenMenuId(null); }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <FiStar className={`h-4 w-4 ${cat.featured ? "fill-yellow-500 text-yellow-500" : ""}`} />
                            {cat.featured ? "Remove Featured" : "Set Featured"}
                          </button>
                          <button
                            onClick={() => { onToggleActive(cat.id); setOpenMenuId(null); }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <div className={`h-4 w-4 rounded-full border-2 ${cat.active ? "border-gray-400" : "border-green-500 bg-green-500"}`} />
                            {cat.active ? "Set Inactive" : "Set Active"}
                          </button>
                          <hr className="my-1 border-gray-100" />
                          <button
                            onClick={() => { onDelete(cat.id); setOpenMenuId(null); }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <FiTrash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{cat.name}</h3>
                <p className="text-xs text-gray-400 mb-2">/{cat.slug}</p>
                {cat.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{cat.description}</p>
                )}

                {/* Product Stats */}
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-900">{cat.count}</p>
                    <p className="text-xs text-gray-500">Products</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="text-center px-2 py-1 bg-green-50 rounded-md">
                      <p className="text-sm font-medium text-green-700">{cat.activeCount}</p>
                      <p className="text-xs text-green-600">Active</p>
                    </div>
                    <div className="text-center px-2 py-1 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-700">{cat.inactiveCount}</p>
                      <p className="text-xs text-gray-500">Draft</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCategories.map((cat) => (
                <tr
                  key={cat.id}
                  className={`hover:bg-gray-50 transition-colors ${!cat.active ? "opacity-60" : ""} ${onCategoryClick ? "cursor-pointer" : ""}`}
                  onClick={() => onCategoryClick?.(cat.name)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {cat.thumbnailUrl && !imageErrors.has(cat.id) ? (
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={getImageSrc(cat.thumbnailUrl)}
                            alt={cat.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                            onError={() => handleImageError(cat.id)}
                          />
                        </div>
                      ) : (
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-sm font-semibold flex-shrink-0">
                          {cat.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{cat.name}</p>
                        <p className="text-xs text-gray-400 truncate">/{cat.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cat.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {cat.active ? "Active" : "Inactive"}
                      </span>
                      {cat.featured && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          <FiStar className="h-3 w-3 fill-current" />
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{cat.count}</span>
                      <span className="text-xs text-gray-400">
                        ({cat.activeCount}/{cat.inactiveCount})
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onToggleFeatured(cat.id)}
                        className={`p-2 rounded-lg transition-colors ${cat.featured ? "text-yellow-500 hover:bg-yellow-50" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                        title={cat.featured ? "Remove featured" : "Set featured"}
                      >
                        <FiStar className={`h-4 w-4 ${cat.featured ? "fill-current" : ""}`} />
                      </button>
                      <button
                        onClick={() => onToggleActive(cat.id)}
                        className={`p-2 rounded-lg transition-colors ${cat.active ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                        title={cat.active ? "Set inactive" : "Set active"}
                      >
                        <div className={`h-4 w-4 rounded-full border-2 ${cat.active ? "border-green-500 bg-green-500" : "border-gray-400"}`} />
                      </button>
                      <button
                        onClick={() => onEdit(cat.id)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(cat.id)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

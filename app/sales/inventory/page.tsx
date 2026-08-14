"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Package, AlertTriangle, Layers, Lock, Eye, ShoppingCart, ArrowRight, RefreshCw, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchProductsAction } from "@/app/actions/products";
import Link from "next/link";
import { useSwrData } from "@/lib/cache/swr-cache";

export function SalesInventoryPage() {
  const {
    data: rawProducts,
    isLoading,
    isRevalidating,
    refresh: loadProducts,
  } = useSwrData<any[]>("catalog_products", fetchProductsAction);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const products = Array.isArray(rawProducts) ? rawProducts : [];

  // Compute Categories
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  // Filter products by search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate live KPI metrics
  const totalActiveSkus = products.length;
  const totalCategories = new Set(products.map((p) => p.category)).size;
  const lowStockCount = products.filter((p) => (p.stock_quantity ?? p.stock ?? 0) <= (p.reorder_level ?? p.minStock ?? 10) && (p.stock_quantity ?? p.stock ?? 0) > 0).length;
  const outOfStockCount = products.filter((p) => (p.stock_quantity ?? p.stock ?? 0) === 0).length;

  const avgMargin = products.length > 0
    ? (products.reduce((acc, p) => {
        const retail = Number(p.retail_price ?? 0);
        const wholesale = Number(p.wholesale_price ?? 0);
        if (retail > 0 && wholesale > 0) {
          return acc + ((retail - wholesale) / retail) * 100;
        }
        return acc;
      }, 0) / products.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white p-6">
        <CardContent className="p-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-[#fff7e8] text-[#713105] border-[#e8decf] text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 gap-1">
                <Lock className="w-3 h-3 text-[#713105]" />
                Read-Only Stock Lookup Panel
              </Badge>
              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold">
                Live Supabase Sync
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-[#341100] tracking-tight">
              View Product Stock & Availability
            </h1>
            <p className="text-xs font-normal text-[#7f5e35] mt-1">
              Check real-time warehouse inventory levels, unit wholesale/retail pricing, and stock thresholds before confirming orders with customers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={loadProducts}
              disabled={isLoading || isRevalidating}
              variant="outline"
              size="sm"
              className="border-[#e8decf] text-[#4f351c] hover:bg-[#fff7e8] rounded-xl text-xs gap-1.5 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/sales/orders">
              <Button className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] text-xs font-semibold rounded-xl px-4 py-2 gap-2 shadow-xs">
                <ShoppingCart className="w-4 h-4" />
                Go to Sales Orders
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Total Active SKUs</span>
            <Package className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">
            {isLoading ? "..." : totalActiveSkus}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Live in database</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Product Categories</span>
            <Layers className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">
            {isLoading ? "..." : totalCategories}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Catalog groups</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Low / Out of Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-red-700 mt-2">
            {isLoading ? "..." : `${lowStockCount} / ${outOfStockCount}`}
          </div>
          <span className="text-[11px] text-red-700 font-semibold">Low / Zero units</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Avg Retail Margin</span>
            <Package className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            {isLoading ? "..." : `${avgMargin}%`}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">Gross margin</span>
        </Card>
      </div>

      {/* Category Pills Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-[#4f351c] uppercase tracking-wider mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-[#713105]" />
          Category:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-[#713105] text-[#fff7e8] shadow-xs"
                : "bg-white border border-[#e8decf] text-[#4f351c] hover:bg-[#fff7e8]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stock Lookup Data Table */}
      <Card className="border-[#e8decf] shadow-xs rounded-xl bg-white overflow-hidden">
        <CardHeader className="p-5 border-b border-[#e8decf] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle className="text-sm font-semibold text-[#4f351c]">
            Real-Time Product Catalog & Stock Status
          </CardTitle>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7f5e35]" />
              <Input
                placeholder="Search product name, SKU or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-[#fff7e8] border-[#e8decf] text-xs text-[#341100] rounded-xl placeholder:text-[#7f5e35]/60"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs text-[#341100]">
            <thead className="bg-[#fff7e8] border-b border-[#e8decf] text-[11px] uppercase tracking-wider text-[#7f5e35] font-semibold">
              <tr>
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Stock Available</th>
                <th className="py-3 px-4">Retail Price</th>
                <th className="py-3 px-4">Wholesale Price</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8decf]/60">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="w-36 h-3 bg-[#e8decf]/70 rounded-md mb-1.5" />
                      <div className="w-20 h-2.5 bg-[#e8decf]/50 rounded-md" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-20 h-3 bg-[#e8decf]/60 rounded-md" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-24 h-3 bg-[#e8decf]/60 rounded-md" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-16 h-3 bg-[#e8decf]/70 rounded-md" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-14 h-3 bg-[#e8decf]/70 rounded-md" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-14 h-3 bg-[#e8decf]/60 rounded-md" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="w-16 h-5 bg-[#e8decf]/60 rounded-full mx-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="w-20 h-6 bg-[#e8decf]/60 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#7f5e35]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Package className="w-8 h-8 text-[#cfab71] mx-auto opacity-70" />
                      <p className="font-semibold text-[#341100]">No Products Found</p>
                      <p className="text-[11px] text-[#7f5e35]">
                        {searchTerm
                          ? "No products match your search criteria."
                          : "No product items available in inventory."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stock = product.stock_quantity ?? product.stock ?? 0;
                  const reorder = product.reorder_level ?? product.minStock ?? 10;
                  const isOutOfStock = stock === 0;
                  const isLowStock = stock > 0 && stock <= reorder;

                  return (
                    <tr key={product.id} className="hover:bg-[#fcf3e3]/50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#341100]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{product.name}</span>
                        </div>
                        <div className="text-[10px] text-[#7f5e35] font-mono font-normal">
                          {product.product_code || product.id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#7f5e35] font-normal">
                        {product.category || "General"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#4f351c] font-semibold">
                        {product.sku}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#341100]">
                        <span className={isOutOfStock ? "text-red-700 font-bold" : isLowStock ? "text-amber-700 font-bold" : ""}>
                          {stock} units
                        </span>
                        <div className="text-[10px] text-[#7f5e35] font-normal">
                          Reorder threshold: {reorder}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#713105]">
                        ₱{Number(product.retail_price || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#7f5e35]">
                        ₱{Number(product.wholesale_price || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {!isOutOfStock && !isLowStock && (
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                            In Stock
                          </Badge>
                        )}
                        {isLowStock && (
                          <Badge className="bg-amber-50 text-[#713105] border-amber-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                            Low Stock
                          </Badge>
                        )}
                        {isOutOfStock && (
                          <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                            Out of Stock
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/sales/orders?productId=${product.id}`}>
                          <Button
                            size="sm"
                            disabled={isOutOfStock}
                            className={`text-xs rounded-xl gap-1 h-7 px-2.5 font-medium shadow-2xs ${
                              isOutOfStock
                                ? "bg-stone-100 text-stone-400 border border-stone-200"
                                : "bg-[#fff7e8] border border-[#cfab71] text-[#713105] hover:bg-[#713105] hover:text-[#fff7e8]"
                            }`}
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Order
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export default SalesInventoryPage;

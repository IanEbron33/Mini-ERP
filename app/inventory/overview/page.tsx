"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Package,
  AlertTriangle,
  XCircle,
  Layers,
  Calendar,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Boxes,
  CheckCircle2,
  DollarSign,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CategoryPieChart } from "@/components/category-pie-chart";
import { fetchProductsAction, adjustStockAction } from "@/app/actions/products";
import { useSwrData, invalidateCache } from "@/lib/cache/swr-cache";
import { formatPeso, formatPesoCompact } from "@/lib/currency";

const COFFEE_PALETTE = [
  "#713105", // ESPRESSO
  "#cfab71", // CREMA
  "#7f5e35", // ROAST
  "#4f351c", // GROUNDS
  "#a4784a", // CARAMEL
  "#c49e70", // LATTE
  "#8c6239", // MOCHA
  "#5c3a21", // DARK ROAST
];

export default function StockOverviewPage() {
  const {
    data: rawProducts,
    isLoading,
    isRevalidating,
    refresh,
  } = useSwrData<any[]>("catalog_products", fetchProductsAction);

  const [restockingItem, setRestockingItem] = useState<any | null>(null);
  const [restockQty, setRestockQty] = useState<number | string>(25);
  const [supplierNote, setSupplierNote] = useState("Supplier Warehouse Restock Shipment");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const products = Array.isArray(rawProducts) ? rawProducts : [];

  // 1. Calculate Live Macro Metrics
  const totalProducts = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + Number(p.stock_quantity || 0), 0);
  const totalWholesaleValuation = products.reduce(
    (acc, p) => acc + Number(p.stock_quantity || 0) * Number(p.wholesale_price || 0),
    0
  );
  const totalRetailValuation = products.reduce(
    (acc, p) => acc + Number(p.stock_quantity || 0) * Number(p.retail_price || 0),
    0
  );

  const lowStockProducts = products
    .filter((p) => p.stock_quantity <= p.reorder_level)
    .sort((a, b) => a.stock_quantity - b.stock_quantity);

  const lowStockCount = lowStockProducts.filter((p) => p.stock_quantity > 0).length;
  const outOfStockCount = lowStockProducts.filter((p) => p.stock_quantity === 0).length;

  // 2. Category Aggregations for Charts & Breakdown
  const categoryMap: { [key: string]: { count: number; units: number; valuation: number; lowStock: number } } = {};
  products.forEach((p) => {
    const cat = p.category || "General";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { count: 0, units: 0, valuation: 0, lowStock: 0 };
    }
    categoryMap[cat].count += 1;
    categoryMap[cat].units += Number(p.stock_quantity || 0);
    categoryMap[cat].valuation += Number(p.stock_quantity || 0) * Number(p.wholesale_price || 0);
    if (p.stock_quantity <= p.reorder_level) {
      categoryMap[cat].lowStock += 1;
    }
  });

  const categories = Object.keys(categoryMap);
  const activeCategoriesCount = categories.length;

  // Pie chart data structure
  const categoryChartData = categories.map((cat, index) => {
    const data = categoryMap[cat];
    const percentage = totalStockUnits > 0 ? Math.round((data.units / totalStockUnits) * 100) : 0;
    return {
      name: cat,
      value: percentage,
      items: data.count,
      revenue: formatPesoCompact(data.valuation),
      color: COFFEE_PALETTE[index % COFFEE_PALETTE.length],
    };
  });

  // Handle Quick Restock Submission
  const handleConfirmRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingItem || Number(restockQty || 0) <= 0) return;
    setActionLoading(true);

    const res = await adjustStockAction({
      productId: restockingItem.id,
      productName: restockingItem.name,
      productSku: restockingItem.sku,
      currentStock: restockingItem.stock_quantity,
      shiftAmount: Number(restockQty),
      reason: supplierNote,
      actorName: "Inventory Manager",
      type: "Addition",
    });

    setActionLoading(false);

    if (res.success) {
      const newStock = res.newStock ?? (restockingItem.stock_quantity + Number(restockQty));
      setFeedback({
        type: "success",
        message: `Successfully restocked ${restockQty} units of ${restockingItem.name}. New Warehouse Balance: ${newStock} units.`,
      });

      setRestockingItem(null);
      invalidateCache([
        "catalog_products",
        "inventory_stock_logs",
        "admin_sales_data",
        "admin_dashboard_metrics",
        "admin_finance_ledger",
        "sales_portal_data",
      ]);
      await refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to restock SKU." });
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Feedback Alert Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-2 ${
            feedback.type === "success"
              ? "bg-[#ebf5ed] border-[#c1e1c7] text-[#15803d]"
              : "bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#15803d]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#b91c1c]" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[#7f5e35] hover:text-[#341100] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner Card */}
      <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white p-6">
        <CardContent className="p-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71]/50 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                Inventory Manager Portal
              </Badge>
              <Badge className="bg-[#ebf5ed] text-[#15803d] border-[#c1e1c7] text-[10px] uppercase font-semibold px-2 py-0.5">
                Live Supabase Sync
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-[#341100] tracking-tight">
              Stock Overview & Logistics
            </h1>
            <p className="text-xs font-normal text-[#7f5e35] mt-1">
              Real-time warehouse KPIs: Active catalog SKUs, stock valuation in Philippine Peso (₱), critical restock alerts, and category distributions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#fff7e8] border border-[#e8decf] rounded-xl px-3 py-2 text-xs text-[#7f5e35]">
              <Calendar className="w-4 h-4 text-[#713105]" />
              <span className="font-medium text-[#341100]">{currentDateFormatted}</span>
            </div>

            <Button
              onClick={refresh}
              disabled={isLoading || isRevalidating}
              variant="outline"
              size="sm"
              className="border-[#e8decf] bg-white text-[#713105] hover:bg-[#fff7e8] rounded-xl h-9 px-3 gap-1.5 font-semibold text-xs shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 5 Macro Warehouse KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Active SKUs */}
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Active SKUs</span>
            <Package className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">
            {isLoading ? "..." : totalProducts}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Registered catalog items</span>
        </Card>

        {/* Total Warehouse Stock Units */}
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Total Units</span>
            <Boxes className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">
            {isLoading ? "..." : totalStockUnits.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Physical on-hand units</span>
        </Card>

        {/* Total Inventory Valuation */}
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Asset Valuation</span>
            <DollarSign className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#713105] mt-2">
            {isLoading ? "..." : formatPeso(totalWholesaleValuation, 0)}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Wholesale cost basis (₱)</span>
        </Card>

        {/* Items Requiring Restock */}
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-[#713105] mt-2">
            {isLoading ? "..." : lowStockCount}
          </div>
          <span className="text-[11px] text-[#713105] font-semibold">At or below reorder level</span>
        </Card>

        {/* Critical Out-of-Stock */}
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Out of Stock</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700 mt-2">
            {isLoading ? "..." : outOfStockCount}
          </div>
          <span className="text-[11px] text-red-700 font-semibold">Zero availability</span>
        </Card>
      </div>

      {/* Main Split Section: Restock Action Hub + Category Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Restock Priority Action Box */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white overflow-hidden flex-1 flex flex-col justify-between">
            <div>
              <CardHeader className="p-5 border-b border-[#e8decf] flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-[#341100] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    Critical Restock Priority Action List
                  </CardTitle>
                  <p className="text-[11px] text-[#7f5e35] mt-0.5">
                    Live database products requiring supplier replenishment
                  </p>
                </div>

                <Link
                  href="/inventory/low-stock"
                  className="text-xs font-semibold text-[#713105] hover:text-[#341100] flex items-center gap-1 transition-colors"
                >
                  <span>View All ({lowStockProducts.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardHeader>

              <CardContent className="p-0 divide-y divide-[#e8decf]/60">
                {isLoading ? (
                  <div className="p-6 space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center justify-between py-2">
                        <div className="space-y-1.5">
                          <div className="w-32 h-3.5 bg-[#e8decf]/70 rounded" />
                          <div className="w-20 h-2.5 bg-[#e8decf]/50 rounded" />
                        </div>
                        <div className="w-24 h-7 bg-[#e8decf]/60 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : lowStockProducts.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-[#15803d] mx-auto" />
                    <p className="font-semibold text-xs text-[#341100]">Warehouse Stock Levels Optimal</p>
                    <p className="text-[11px] text-[#7f5e35]">
                      All active product SKUs are comfortably above defined safety thresholds.
                    </p>
                  </div>
                ) : (
                  lowStockProducts.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#fcf3e3]/40 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#341100]">{item.name}</span>
                          <Badge
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-md ${
                              item.stock_quantity === 0
                                ? "bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]"
                                : "bg-[#fdf0e6] text-[#713105] border-[#f1d0b5]"
                            }`}
                          >
                            {item.stock_quantity === 0 ? "Out of Stock" : "Low Stock"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#7f5e35]">
                          <span className="font-mono">{item.sku}</span>
                          <span>•</span>
                          <span>{item.category}</span>
                          <span>•</span>
                          <span>Wholesale: {formatPeso(item.wholesale_price)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 justify-between sm:justify-end">
                        <div className="text-left sm:text-right">
                          <div
                            className={`text-xs font-bold ${
                              item.stock_quantity === 0 ? "text-[#b91c1c]" : "text-[#713105]"
                            }`}
                          >
                            {item.stock_quantity} units left
                          </div>
                          <div className="text-[10px] text-[#7f5e35]">
                            Reorder threshold: {item.reorder_level}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            setRestockingItem(item);
                            setRestockQty(Math.max(20, (item.reorder_level * 2) - item.stock_quantity));
                            setSupplierNote(`PO Restock Shipment - ${item.sku}`);
                          }}
                          className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] text-xs font-semibold rounded-xl px-3 h-8 gap-1.5 cursor-pointer shadow-2xs shrink-0"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Restock</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </div>

            {lowStockProducts.length > 5 && (
              <div className="p-3 bg-[#fff7e8]/60 border-t border-[#e8decf] text-center">
                <Link
                  href="/inventory/low-stock"
                  className="text-xs font-bold text-[#713105] hover:underline"
                >
                  +{lowStockProducts.length - 5} more items requiring restock in the full directory →
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Category Distribution Donut Chart */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <CategoryPieChart data={categoryChartData} isLoading={isLoading} />
        </div>
      </div>

      {/* Category Warehouse Stock Breakdown Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#341100] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#713105]" />
            Category Stock Valuation & Levels
          </h2>
          <span className="text-xs text-[#7f5e35] font-medium">
            {activeCategoriesCount} Active Categories
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat, index) => {
            const data = categoryMap[cat];
            const color = COFFEE_PALETTE[index % COFFEE_PALETTE.length];
            return (
              <Card
                key={cat}
                className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs hover:border-[#cfab71] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-[#341100] truncate">{cat}</span>
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[#7f5e35]">
                    <span>Catalog SKUs:</span>
                    <span className="font-bold text-[#341100]">{data.count} items</span>
                  </div>
                  <div className="flex items-center justify-between text-[#7f5e35]">
                    <span>Total Stock:</span>
                    <span className="font-bold text-[#341100]">{data.units.toLocaleString()} units</span>
                  </div>
                  <div className="flex items-center justify-between text-[#7f5e35] pt-1 border-t border-[#e8decf]/60">
                    <span>Valuation (₱):</span>
                    <span className="font-bold text-[#713105] font-mono">
                      {formatPeso(data.valuation, 0)}
                    </span>
                  </div>
                </div>

                {data.lowStock > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#e8decf]/60 flex items-center justify-between text-[11px] text-[#713105]">
                    <span className="flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      {data.lowStock} Low Stock
                    </span>
                    <Link
                      href="/inventory/low-stock"
                      className="text-[10px] font-bold underline hover:text-[#341100]"
                    >
                      Resolve
                    </Link>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Reusable Coffee-Themed Inline Restock Modal */}
      {restockingItem && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#e8decf] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#e8decf] flex items-center justify-between bg-[#fff7e8]">
              <h2 className="font-bold text-sm text-[#341100] flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#713105]" />
                Supplier Restock Order
              </h2>
              <button
                onClick={() => setRestockingItem(null)}
                className="text-[#7f5e35] hover:text-[#341100] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-[#fff7e8] border border-[#e8decf] rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#341100] text-sm">{restockingItem.name}</p>
                  <p className="text-[11px] font-mono text-[#7f5e35]">SKU: {restockingItem.sku}</p>
                  <p className="text-[11px] text-[#7f5e35] mt-0.5">
                    Wholesale Cost: {formatPeso(restockingItem.wholesale_price)} / unit
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#7f5e35]">Current Stock:</span>
                  <p
                    className={`text-sm font-bold ${
                      restockingItem.stock_quantity === 0 ? "text-red-700" : "text-[#713105]"
                    }`}
                  >
                    {restockingItem.stock_quantity} units
                  </p>
                </div>
              </div>

              {/* Quantity Selector with Fast Chips */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#4f351c]">Restock Quantity (Units)</label>
                  <span className="text-[11px] text-[#7f5e35]">Quick presets:</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[10, 25, 50, 100].map((qty) => (
                    <Button
                      key={qty}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRestockQty(qty)}
                      className={`h-7 text-xs font-semibold rounded-lg border-[#e8decf] ${
                        restockQty === qty
                          ? "bg-[#713105] text-[#fff7e8] border-[#713105]"
                          : "bg-[#fff7e8] text-[#713105] hover:bg-[#cfab71]/30"
                      }`}
                    >
                      +{qty}
                    </Button>
                  ))}
                </div>

                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 25"
                  value={restockQty}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d+$/.test(val)) {
                      setRestockQty(val === "" ? "" : parseInt(val, 10));
                    }
                  }}
                  className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs font-bold text-[#341100] h-9 focus:bg-white"
                  required
                />
              </div>

              {/* Dynamic Financial Cost Preview */}
              <div className="p-3 bg-[#ebf5ed] border border-[#c1e1c7] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#15803d]">Total Restock Investment:</span>
                  <p className="text-[10px] text-[#15803d]/80">
                    {Number(restockQty || 0)} units × {formatPeso(restockingItem.wholesale_price)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-[#15803d]">
                    {formatPeso(Number(restockQty || 0) * Number(restockingItem.wholesale_price || 0))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4f351c] mb-1">Supplier Shipment Note / PO #</label>
                <Input
                  value={supplierNote}
                  onChange={(e) => setSupplierNote(e.target.value)}
                  className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs h-9"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e8decf]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRestockingItem(null)}
                  className="border-[#e8decf] text-[#7f5e35] text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading || Number(restockQty || 0) <= 0}
                  className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] text-xs font-semibold rounded-xl px-4 py-2 cursor-pointer shadow-xs"
                >
                  {actionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1" />
                  )}
                  Confirm Supplier Restock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

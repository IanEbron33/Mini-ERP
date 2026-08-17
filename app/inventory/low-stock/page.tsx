"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  AlertTriangle,
  PlusCircle,
  ArrowUpRight,
  Check,
  X,
  Loader2,
  Package,
  RefreshCw,
  XCircle,
  DollarSign,
  Boxes,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { fetchProductsAction, adjustStockAction } from "@/app/actions/products";
import { useSwrData, invalidateCache } from "@/lib/cache/swr-cache";
import { formatPeso, formatPesoCompact } from "@/lib/currency";

export function LowStockRestockPage() {
  const {
    data: rawProducts,
    isLoading: isLoadingData,
    isRevalidating,
    refresh: loadLowStockProducts,
  } = useSwrData<any[]>("catalog_products", fetchProductsAction);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | "out_of_stock" | "low_stock">("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Restock Modal States
  const [restockingItem, setRestockingItem] = useState<any | null>(null);
  const [restockQty, setRestockQty] = useState<number | string>(25);
  const [supplierNote, setSupplierNote] = useState("Supplier Purchase Shipment Order");
  const [actionLoading, setActionLoading] = useState(false);

  const allProducts = Array.isArray(rawProducts) ? rawProducts : [];

  // Filter products at or below reorder level
  const lowStockItems = useMemo(() => {
    return allProducts
      .filter((p: any) => p.stock_quantity <= p.reorder_level)
      .map((p: any) => ({
        id: p.product_code || `PRD-${p.id.slice(0, 4)}`,
        dbId: p.id,
        name: p.name,
        category: p.category || "General",
        sku: p.sku,
        stock: Number(p.stock_quantity || 0),
        reorderLevel: Number(p.reorder_level || 0),
        wholesalePrice: Number(p.wholesale_price || 0),
        retailPrice: Number(p.retail_price || 0),
        status: p.status,
      }))
      .sort((a, b) => a.stock - b.stock);
  }, [allProducts]);

  // Extract unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    lowStockItems.forEach((i) => set.add(i.category));
    return ["All", ...Array.from(set)];
  }, [lowStockItems]);

  // Filter items by search, category, and urgency
  const filteredItems = useMemo(() => {
    return lowStockItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;

      const matchesUrgency =
        urgencyFilter === "all" ||
        (urgencyFilter === "out_of_stock" && item.stock === 0) ||
        (urgencyFilter === "low_stock" && item.stock > 0);

      return matchesSearch && matchesCategory && matchesUrgency;
    });
  }, [lowStockItems, searchTerm, selectedCategory, urgencyFilter]);

  // Computed KPI Aggregations
  const outOfStockCount = lowStockItems.filter((i) => i.stock === 0).length;
  const criticalLowCount = lowStockItems.filter((i) => i.stock > 0).length;
  const totalRecommendedRestockCost = lowStockItems.reduce((acc, item) => {
    const needed = Math.max(15, item.reorderLevel * 2 - item.stock);
    return acc + needed * item.wholesalePrice;
  }, 0);

  const handleConfirmRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingItem || Number(restockQty || 0) <= 0) return;
    setActionLoading(true);

    const res = await adjustStockAction({
      productId: restockingItem.dbId || restockingItem.id,
      productName: restockingItem.name,
      productSku: restockingItem.sku,
      currentStock: restockingItem.stock,
      shiftAmount: Number(restockQty),
      reason: supplierNote,
      actorName: "Inventory Manager",
      type: "Addition",
    });

    setActionLoading(false);

    if (res.success) {
      const newStock = res.newStock ?? (restockingItem.stock + Number(restockQty));
      setFeedback({
        type: "success",
        message: `Successfully restocked ${restockQty} units of ${restockingItem.name}. New Warehouse Stock: ${newStock} units.`,
      });

      setRestockingItem(null);
      invalidateCache([
        "catalog_products",
        "admin_sales_data",
        "admin_dashboard_metrics",
        "admin_finance_ledger",
        "sales_portal_data",
      ]);
      await loadLowStockProducts();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to restock SKU." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Notification Toast */}
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

      {/* Header Banner */}
      <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white p-6">
        <CardContent className="p-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71]/50 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5">
                Inventory Manager Portal
              </Badge>
              <Badge className="bg-[#fdf0e6] text-[#713105] border-[#f1d0b5] text-[10px] uppercase font-semibold px-2 py-0.5">
                Restock Dispatch Desk
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-[#341100] tracking-tight">
              Low Stock & Supplier Replenishment
            </h1>
            <p className="text-xs font-normal text-[#7f5e35] mt-1">
              Actionable priority list identifying products at or below safety reorder levels with 1-click supplier PO creation.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={loadLowStockProducts}
              disabled={isLoadingData || isRevalidating}
              variant="outline"
              size="sm"
              className="border-[#e8decf] bg-white text-[#713105] hover:bg-[#fff7e8] rounded-xl h-9 px-3 gap-1.5 font-semibold text-xs shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Low Stock Alerts */}
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Total Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-[#713105] mt-2">
            {isLoadingData ? "..." : lowStockItems.length}
          </div>
          <span className="text-[11px] text-[#713105] font-semibold">SKUs below safety threshold</span>
        </Card>

        {/* Critical Out-of-Stock */}
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Out-of-Stock SKUs</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700 mt-2">
            {isLoadingData ? "..." : outOfStockCount}
          </div>
          <span className="text-[11px] text-red-700 font-semibold">Critical 0 warehouse balance</span>
        </Card>

        {/* Low Stock (Under Threshold) */}
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Low Stock</span>
            <Boxes className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">
            {isLoadingData ? "..." : criticalLowCount}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Active units &gt; 0</span>
        </Card>

        {/* Estimated Reorder Investment */}
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Est. Restock Cost</span>
            <DollarSign className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#713105] mt-2 font-mono">
            {isLoadingData ? "..." : formatPesoCompact(totalRecommendedRestockCost)}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Replenishment budget (₱)</span>
        </Card>
      </div>

      {/* Multi-Criteria Filter Toolbar */}
      <Card className="border-[#e8decf] shadow-xs rounded-xl bg-white p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7f5e35]" />
            <Input
              placeholder="Search by product name or SKU code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#fff7e8] border-[#e8decf] text-xs text-[#341100] rounded-xl placeholder:text-[#7f5e35]/60 h-9"
            />
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#4f351c] whitespace-nowrap">Category:</span>
            <div className="w-44">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                options={categories.map((c) => ({
                  value: c,
                  label: c === "All" ? "All Categories" : c,
                }))}
                size="sm"
                placeholder="All Categories"
              />
            </div>
          </div>

          {/* Urgency Filter Buttons */}
          <div className="flex items-center gap-1 bg-[#fff7e8] p-1 rounded-xl border border-[#e8decf]">
            <button
              onClick={() => setUrgencyFilter("all")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                urgencyFilter === "all"
                  ? "bg-[#713105] text-[#fff7e8] shadow-2xs"
                  : "text-[#7f5e35] hover:text-[#341100]"
              }`}
            >
              All ({lowStockItems.length})
            </button>
            <button
              onClick={() => setUrgencyFilter("out_of_stock")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                urgencyFilter === "out_of_stock"
                  ? "bg-[#b91c1c] text-white shadow-2xs"
                  : "text-[#7f5e35] hover:text-[#b91c1c]"
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
            <button
              onClick={() => setUrgencyFilter("low_stock")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                urgencyFilter === "low_stock"
                  ? "bg-[#cfab71] text-[#341100] shadow-2xs"
                  : "text-[#7f5e35] hover:text-[#341100]"
              }`}
            >
              Low Stock ({criticalLowCount})
            </button>
          </div>
        </div>
      </Card>

      {/* Low Stock Data Table */}
      <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white overflow-hidden">
        <CardHeader className="p-5 border-b border-[#e8decf] flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-[#4f351c] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            Restock Priority Action Queue
          </CardTitle>
          <span className="text-xs font-semibold text-[#7f5e35]">
            Showing {filteredItems.length} of {lowStockItems.length} items
          </span>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs text-[#341100]">
            <thead className="bg-[#fff7e8] border-b border-[#e8decf] text-[11px] uppercase tracking-wider text-[#7f5e35] font-semibold">
              <tr>
                <th className="py-3.5 px-4">SKU Code</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4">Reorder Level</th>
                <th className="py-3.5 px-4">Wholesale Price (₱)</th>
                <th className="py-3.5 px-4">Urgency Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8decf]/60">
              {isLoadingData ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="w-16 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-36 h-3 bg-[#e8decf]/70 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-14 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-14 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-5 bg-[#e8decf]/60 rounded-full" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-24 h-7 bg-[#e8decf]/60 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-xs text-[#7f5e35]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <CheckCircle2 className="w-9 h-9 text-[#15803d] mx-auto opacity-80" />
                      <p className="font-bold text-sm text-[#341100]">No Stock Deficits Found</p>
                      <p className="text-[11px] text-[#7f5e35]">
                        {lowStockItems.length === 0
                          ? "All product inventory levels in the warehouse are currently healthy."
                          : "No items match your active search or filter criteria."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const stockRatio = item.reorderLevel > 0 ? (item.stock / item.reorderLevel) * 100 : 100;
                  return (
                    <tr key={item.dbId} className="hover:bg-[#fcf3e3]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#713105]">
                        {item.sku}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-xs text-[#341100]">{item.name}</div>
                        <div className="text-[10px] text-[#7f5e35] font-normal">{item.id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#7f5e35] font-medium">{item.category}</td>
                      <td className="py-3.5 px-4">
                        <div
                          className={`font-bold text-xs ${
                            item.stock === 0 ? "text-[#b91c1c]" : "text-[#713105]"
                          }`}
                        >
                          {item.stock} units
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#4f351c]">
                        {item.reorderLevel} units
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#4f351c]">
                        {formatPeso(item.wholesalePrice)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.stock === 0 ? (
                          <Badge className="bg-[#fef2f2] text-[#b91c1c] border-[#fecaca] text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                            Out of Stock
                          </Badge>
                        ) : (
                          <Badge className="bg-[#fdf0e6] text-[#713105] border-[#f1d0b5] text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                            Low Stock
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setRestockingItem(item);
                            setRestockQty(Math.max(20, item.reorderLevel * 2 - item.stock));
                            setSupplierNote(`PO Supplier Shipment - ${item.sku}`);
                          }}
                          className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] text-xs font-semibold rounded-xl px-3.5 h-8 gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Restock SKU</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Reusable Restock Supplier Modal */}
      {restockingItem && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#e8decf] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#e8decf] flex items-center justify-between bg-[#fff7e8]">
              <h2 className="font-bold text-sm text-[#341100] flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#713105]" />
                Receive Supplier Shipment Restock
              </h2>
              <button
                onClick={() => setRestockingItem(null)}
                className="text-[#7f5e35] hover:text-[#341100] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-[#fff7e8] border border-[#e8decf] rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#341100] text-sm">{restockingItem.name}</p>
                  <p className="text-[11px] font-mono text-[#7f5e35]">SKU: {restockingItem.sku}</p>
                  <p className="text-[11px] text-[#7f5e35] mt-0.5">
                    Wholesale Cost: {formatPeso(restockingItem.wholesalePrice)} / unit
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#7f5e35]">Current Stock:</span>
                  <p
                    className={`text-sm font-bold ${
                      restockingItem.stock === 0 ? "text-red-700" : "text-[#713105]"
                    }`}
                  >
                    {restockingItem.stock} units
                  </p>
                  <span className="text-[10px] text-[#7f5e35]">Reorder at: {restockingItem.reorderLevel}</span>
                </div>
              </div>

              {/* Quantity Selector with Fast Preset Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
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
              <div className="p-3.5 bg-[#ebf5ed] border border-[#c1e1c7] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#15803d]">Total Restock Investment:</span>
                  <p className="text-[10px] text-[#15803d]/80">
                    {Number(restockQty || 0)} units × {formatPeso(restockingItem.wholesalePrice)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold font-mono text-[#15803d]">
                    {formatPeso(Number(restockQty || 0) * Number(restockingItem.wholesalePrice || 0))}
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

export default LowStockRestockPage;

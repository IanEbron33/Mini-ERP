"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, AlertTriangle, PlusCircle, ArrowUpRight, Check, X, Loader2, Package, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchProductsAction, adjustStockAction } from "@/app/actions/products";
import { useSwrData, invalidateCache } from "@/lib/cache/swr-cache";

export function LowStockRestockPage() {
  const {
    data: rawProducts,
    isLoading: isLoadingData,
    isRevalidating,
    refresh: loadLowStockProducts,
  } = useSwrData<any[]>("catalog_products", fetchProductsAction);

  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Restock Modal States
  const [restockingItem, setRestockingItem] = useState<any | null>(null);
  const [restockQty, setRestockQty] = useState(25);
  const [supplierNote, setSupplierNote] = useState("Supplier Purchase Shipment Order");
  const [actionLoading, setActionLoading] = useState(false);

  const allProducts = Array.isArray(rawProducts) ? rawProducts : [];
  const items = allProducts
    .filter((p: any) => p.stock_quantity <= p.reorder_level)
    .map((p: any) => ({
      id: p.product_code || `PRD-${p.id.slice(0, 4)}`,
      dbId: p.id,
      name: p.name,
      category: p.category,
      sku: p.sku,
      stock: p.stock_quantity,
      reorderLevel: p.reorder_level,
      retailPrice: `₱${Number(p.retail_price).toFixed(2)}`,
      supplier: "Artisan Crafts Supplier",
      status: p.status,
    }));

  const handleConfirmRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingItem) return;
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
        message: `Restocked ${restockQty} units of ${restockingItem.name}. New Stock: ${newStock} units.`,
      });

      setRestockingItem(null);
      invalidateCache(["catalog_products", "admin_sales_data", "admin_dashboard_metrics", "admin_finance_ledger", "sales_portal_data"]);
      await loadLowStockProducts();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to restock SKU." });
    }
  };

  const filteredItems = items.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const outOfStockCount = items.filter((i) => i.stock === 0).length;

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between animate-in fade-in slide-in-from-top-2 text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700" />
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-stone-500 hover:text-stone-800 cursor-pointer">
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
            </div>
            <h1 className="text-2xl font-bold text-[#341100] tracking-tight">
              Low Stock & Supplier Restock
            </h1>
            <p className="text-xs font-normal text-[#7f5e35] mt-1">
              Live action list highlighting products currently at or below reorder level.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={loadLowStockProducts}
              disabled={isLoadingData || isRevalidating}
              variant="outline"
              size="sm"
              className="border-[#e8decf] bg-white text-[#713105] hover:bg-[#fff7e8] rounded-xl h-9 px-3 gap-1.5 font-semibold text-xs shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Low Stock Items</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-[#713105] mt-2">{items.length}</div>
          <span className="text-[11px] text-[#713105] font-semibold">At or below reorder threshold</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Out-of-Stock SKUs</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700 mt-2">{outOfStockCount}</div>
          <span className="text-[11px] text-red-700 font-semibold">Critical 0 balance</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Reorder Readiness</span>
            <ArrowUpRight className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-2">100%</div>
          <span className="text-[11px] text-[#7f5e35] font-normal">1-Click supplier restock enabled</span>
        </Card>
      </div>

      {/* Low Stock Data Table */}
      <Card className="border-[#e8decf] shadow-xs rounded-xl bg-white overflow-hidden">
        <CardHeader className="p-5 border-b border-[#e8decf] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle className="text-sm font-semibold text-[#4f351c] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            Restock Priority Action List
          </CardTitle>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7f5e35]" />
              <Input
                placeholder="Search product name or SKU..."
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
                <th className="py-3 px-4">SKU Code</th>
                <th className="py-3 px-4">Product Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Reorder Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8decf]/60">
              {isLoadingData ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="w-16 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-32 h-3 bg-[#e8decf]/70 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-14 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-14 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-5 bg-[#e8decf]/60 rounded-full" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-20 h-7 bg-[#e8decf]/60 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#7f5e35]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Package className="w-8 h-8 text-emerald-600 mx-auto opacity-70" />
                      <p className="font-semibold text-[#341100]">Stock Levels Healthy</p>
                      <p className="text-[11px] text-[#7f5e35]">No product SKUs currently below reorder levels.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#fcf3e3]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#713105]">{item.sku}</td>
                    <td className="py-3.5 px-4 font-medium text-[#341100]">
                      {item.name}
                      <div className="text-[10px] text-[#7f5e35] font-normal">{item.id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#7f5e35]">{item.category}</td>
                    <td className="py-3.5 px-4 font-bold text-red-700">{item.stock} units</td>
                    <td className="py-3.5 px-4 font-medium text-[#4f351c]">{item.reorderLevel} units</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.status === "Out of Stock" || item.stock === 0 ? (
                        <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 whitespace-nowrap">
                          Out of Stock
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-[#713105] border-amber-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 whitespace-nowrap">
                          Low Stock
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setRestockingItem(item);
                          setRestockQty(25);
                          setSupplierNote("Supplier Restock Purchase Shipment");
                        }}
                        className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] text-[11px] rounded-lg px-3 py-1 font-semibold cursor-pointer"
                      >
                        Restock SKU
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Restock Supplier Modal */}
      {restockingItem && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#e8decf] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
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
              <div className="p-3 bg-[#fff7e8] border border-[#e8decf] rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#341100]">{restockingItem.name}</p>
                  <p className="text-[11px] font-mono text-[#7f5e35]">SKU: {restockingItem.sku}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#7f5e35]">Current Stock:</span>
                  <p className="text-sm font-bold text-red-700">{restockingItem.stock} units</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4f351c] mb-1">Restock Quantity (Units)</label>
                <Input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs font-bold text-[#341100]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4f351c] mb-1">Supplier Shipment Note / PO #</label>
                <Input
                  value={supplierNote}
                  onChange={(e) => setSupplierNote(e.target.value)}
                  className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs"
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
                  disabled={actionLoading}
                  className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] text-xs font-semibold rounded-xl px-4 py-2 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
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

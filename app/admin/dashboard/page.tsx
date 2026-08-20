"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  RefreshCw,
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Edit2,
  Target,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { KpiCardsSection } from "@/components/kpi-card";
import { RevenueBarChart } from "@/components/revenue-bar-chart";
import { CategoryPieChart } from "@/components/category-pie-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fetchDashboardMetricsAction, DashboardMetrics } from "@/app/actions/dashboard";
import { getCurrentUserAction } from "@/app/actions/auth";
import { updateUserQuotaAction } from "@/app/actions/users";
import { InvoiceModal, InvoiceOrderData } from "@/components/invoice-modal";
import { useSwrData } from "@/lib/cache/swr-cache";
import { toast } from "sonner";

export default function DashboardOverviewPage() {
  const {
    data: metrics,
    isLoading,
    isRevalidating,
    refresh: loadData,
  } = useSwrData<DashboardMetrics>("admin_dashboard_metrics", fetchDashboardMetricsAction);

  // Invoice modal preview state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceOrderData | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Enterprise target quota state
  const [storeQuota, setStoreQuota] = useState<number>(100000);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [quotaInputValue, setQuotaInputValue] = useState<number | string>(100000);
  const [isSavingQuota, setIsSavingQuota] = useState(false);

  useEffect(() => {
    async function loadAdminQuota() {
      const res = await getCurrentUserAction();
      if (res.authenticated && res.user) {
        setAdminUserId(res.user.id);
        if (res.user.monthlyQuota) {
          setStoreQuota(res.user.monthlyQuota);
          setQuotaInputValue(res.user.monthlyQuota);
        }
      }
    }
    loadAdminQuota();
  }, []);

  const todayDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const currentSalesTotal = metrics?.totalSales || 0;
  const quotaProgressPercent = Math.min(100, (currentSalesTotal / Math.max(1, storeQuota)) * 100);

  const handleSaveStoreQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = typeof quotaInputValue === "number" ? quotaInputValue : parseFloat(String(quotaInputValue).replace(/[^0-9.]/g, "")) || 0;
    if (parsed <= 0) {
      toast.error("Please enter a valid target goal greater than 0.");
      return;
    }

    setIsSavingQuota(true);
    if (adminUserId) {
      const res = await updateUserQuotaAction(adminUserId, parsed);
      if (res.success) {
        setStoreQuota(parsed);
        toast.success(`Enterprise monthly target goal updated to ₱${parsed.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`);
        setIsQuotaModalOpen(false);
      } else {
        toast.error(res.error || "Failed to update target goal.");
      }
    } else {
      setStoreQuota(parsed);
      toast.success(`Enterprise monthly target goal updated to ₱${parsed.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`);
      setIsQuotaModalOpen(false);
    }
    setIsSavingQuota(false);
  };

  const openInvoiceModal = (order: any) => {
    setSelectedInvoice({
      id: order.id,
      customer: order.customer,
      date: order.date,
      items: order.items,
      total: order.total,
      payment: order.payment,
      status: order.status,
      issuedBy: "System Administrator",
      issuedRole: "Administrator Portal",
    });
    setIsInvoiceOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner Card */}
      <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white p-6">
        <CardContent className="p-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71]/50 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5">
                Administrator Portal
              </Badge>
              <Badge className="bg-[#ebf5ed] text-[#15803d] border-[#c1e1c7] text-[10px] font-semibold">
                Live Data Connected
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-[#341100] tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-xs font-normal text-[#7f5e35] mt-1">
              Live enterprise analytics, financial revenue metrics, product inventory distribution, and active operations.
            </p>
          </div>

          {/* Date Indicator & Refresh Button */}
          <div className="flex items-center gap-2.5 self-stretch md:self-auto">
            <div className="flex items-center gap-2 bg-[#fff7e8] border border-[#e8decf] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#713105] shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[#7f5e35]" />
              <span>{todayDateFormatted}</span>
            </div>

            <Button
              onClick={loadData}
              disabled={isLoading || isRevalidating}
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

      {/* Enterprise Revenue Target Progress Card */}
      <Card className="border-[#e8decf] bg-white p-6 rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7f5e35]">
                Enterprise Monthly Revenue Goal
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuotaInputValue(storeQuota);
                  setIsQuotaModalOpen(true);
                }}
                className="h-6 px-2 text-[10px] font-bold text-[#713105] hover:text-[#341100] hover:bg-[#fcf3e3] rounded-lg gap-1 border border-[#cfab71]/40 shadow-2xs cursor-pointer"
                title="Adjust store-wide monthly revenue target"
              >
                <Edit2 className="w-3 h-3 text-[#713105]" />
                Edit Target
              </Button>
            </div>
            <div className="text-xl font-bold text-[#341100] mt-0.5">
              ₱{currentSalesTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /{" "}
              <span className="text-[#7f5e35]">₱{storeQuota.toLocaleString("en-US", { minimumFractionDigits: 2 })} Target</span>
            </div>
          </div>
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold px-3 py-1">
            {quotaProgressPercent.toFixed(1)}% Achieved
          </Badge>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-[#fff7e8] border border-[#e8decf] h-4 rounded-full overflow-hidden p-0.5">
          <div
            className="bg-[#713105] h-full rounded-full transition-all duration-500"
            style={{ width: `${quotaProgressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-[#7f5e35] mt-2 font-medium">
          <span>Total Store Gross Sales: ₱{currentSalesTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          <span>
            Remaining to Milestone: ₱{Math.max(0, storeQuota - currentSalesTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </Card>

      {/* 4 Dynamic KPI Cards Grid */}
      <KpiCardsSection metrics={metrics || undefined} isLoading={isLoading} />

      {/* 2 Column Data Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Revenue Analytics Bar Graph & Area Chart */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <RevenueBarChart
            data={metrics?.monthlyRevenue}
            isLoading={isLoading}
          />
        </div>

        {/* Right: Category Distribution Donut / Pie Chart */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <CategoryPieChart
            data={metrics?.categoryDistribution}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Live Recent Activity & Inventory Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Recent Orders Activity Feed */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white flex flex-col justify-between h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#e8decf]">
              <div>
                <CardTitle className="text-sm font-bold text-[#341100]">
                  Recent Orders & Transactions
                </CardTitle>
                <p className="text-[11px] text-[#7f5e35] mt-0.5">
                  Latest customer orders processed across sales channels
                </p>
              </div>

              <Link href="/admin/sales">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#713105] hover:text-[#341100] hover:bg-[#fff7e8] gap-1 font-semibold rounded-xl h-8 px-2.5"
                >
                  View All Orders <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="pt-3 pb-4 flex-1">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-[#fff7e8]/60 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : !metrics?.recentOrders || metrics.recentOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#7f5e35]">
                  <ShoppingBag className="w-8 h-8 text-[#cfab71] mx-auto mb-2 opacity-60" />
                  No sales orders recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fff7e8] border-b border-[#e8decf] text-[10px] uppercase font-bold text-[#7f5e35] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 rounded-l-lg">Order</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Total</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right rounded-r-lg">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8decf]/60 text-[#341100]">
                      {metrics.recentOrders.map((order: any, idx: number) => (
                        <tr key={idx} className="hover:bg-[#fff7e8]/40 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-[#713105]">
                            {order.id}
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#341100]">
                            {order.customer}
                          </td>
                          <td className="py-3 px-3 text-[#7f5e35]">
                            {order.date}
                          </td>
                          <td className="py-3 px-3 font-bold text-[#341100]">
                            {order.total}
                          </td>
                          <td className="py-3 px-3">
                            {order.status === "Fulfilled" && (
                              <span className="inline-flex items-center bg-[#ebf5ed] text-[#15803d] border border-[#c1e1c7] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full gap-1">
                                <CheckCircle2 className="w-3 h-3 text-[#15803d]" /> Fulfilled
                              </span>
                            )}
                            {order.status === "Pending" && (
                              <span className="inline-flex items-center bg-[#fdf0e6] text-[#713105] border border-[#f1d0b5] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full gap-1">
                                <Clock className="w-3 h-3 text-[#713105]" /> Pending
                              </span>
                            )}
                            {order.status === "Cancelled" && (
                              <span className="inline-flex items-center bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full gap-1">
                                <AlertCircle className="w-3 h-3 text-[#b91c1c]" /> Cancelled
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Button
                              onClick={() => openInvoiceModal(order)}
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px] font-semibold text-[#713105] hover:bg-[#fff7e8] rounded-lg gap-1"
                            >
                              <FileText className="w-3 h-3" /> View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Critical Low-Stock Inventory Alerts */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white flex flex-col justify-between h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#e8decf]">
              <div>
                <CardTitle className="text-sm font-bold text-[#341100]">
                  Critical Stock Alerts
                </CardTitle>
                <p className="text-[11px] text-[#7f5e35] mt-0.5">
                  Items requiring supplier reorders
                </p>
              </div>

              <Link href="/admin/inventory">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#713105] hover:text-[#341100] hover:bg-[#fff7e8] gap-1 font-semibold rounded-xl h-8 px-2.5"
                >
                  Inventory <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="pt-3 pb-4 flex-1">
              {isLoading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-[#fff7e8]/60 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : !metrics?.lowStockProducts || metrics.lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#7f5e35]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-70" />
                  All inventory stocks are at healthy operational levels.
                </div>
              ) : (
                <div className="space-y-2">
                  {metrics.lowStockProducts.map((prod: any, idx: number) => {
                    const isOut = (prod.stock_quantity ?? 0) === 0;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-[#e8decf] bg-[#fff7e8]/40 hover:bg-[#fff7e8] transition-all"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold text-[#341100] truncate">
                            {prod.name}
                          </div>
                          <div className="text-[10px] font-mono text-[#7f5e35]">
                            SKU: {prod.sku} • Reorder at: {prod.reorder_level || 10}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              isOut
                                ? "bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]"
                                : "bg-[#fdf0e6] text-[#713105] border-[#f1d0b5]"
                            }`}
                          >
                            {prod.stock_quantity ?? 0} left
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enterprise Quota Adjustment Modal */}
      {isQuotaModalOpen && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#e8decf] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#e8decf] flex items-center justify-between bg-[#fff7e8]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#713105] flex items-center justify-center text-[#fff7e8] font-bold text-xs">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-[#341100]">
                    Adjust Enterprise Revenue Goal
                  </h2>
                  <p className="text-[10px] text-[#7f5e35]">
                    Sets the company-wide monthly sales revenue target milestone
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuotaModalOpen(false)}
                className="text-[#7f5e35] hover:text-[#341100] p-1 rounded-lg hover:bg-[#cfab71]/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStoreQuota} className="p-6 space-y-4 text-xs text-[#341100]">
              <div>
                <label className="block font-semibold text-[#4f351c] mb-1.5">
                  Quick Milestone Presets
                </label>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {[50000, 100000, 250000, 500000].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuotaInputValue(preset)}
                      className={`h-7 text-[11px] font-bold rounded-lg border-[#e8decf] ${
                        Number(quotaInputValue) === preset
                          ? "bg-[#713105] text-[#fff7e8] border-[#713105]"
                          : "bg-[#fff7e8] text-[#713105] hover:bg-[#cfab71]/30"
                      }`}
                    >
                      ₱{(preset / 1000)}k
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4f351c] mb-1.5">
                  Store Monthly Revenue Target (₱ PHP) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-[#713105]">
                    ₱
                  </span>
                  <Input
                    type="number"
                    min="5000"
                    step="1000"
                    required
                    value={quotaInputValue}
                    onChange={(e) => setQuotaInputValue(e.target.value)}
                    className="pl-8 bg-[#fff7e8] border-[#e8decf] rounded-xl text-sm font-bold text-[#341100] h-10 focus:bg-white"
                    placeholder="100000"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-[#fff7e8]/60 border border-[#e8decf] rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-[11px] text-[#7f5e35]">
                  <span>Current Store Gross Sales:</span>
                  <span className="font-bold text-[#341100]">₱{currentSalesTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#7f5e35]">
                  <span>New Milestone Target:</span>
                  <span className="font-bold text-[#713105]">
                    ₱{Number(quotaInputValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e8decf]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuotaModalOpen(false)}
                  className="border-[#e8decf] text-[#7f5e35] text-xs rounded-xl h-9"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSavingQuota || Number(quotaInputValue || 0) <= 0}
                  className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] text-xs font-semibold rounded-xl px-5 h-9 shadow-xs cursor-pointer"
                >
                  {isSavingQuota ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Save Enterprise Goal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal for Dashboard View */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={selectedInvoice}
      />
    </div>
  );
}

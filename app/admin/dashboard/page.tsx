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
} from "lucide-react";
import { KpiCardsSection } from "@/components/kpi-card";
import { RevenueBarChart } from "@/components/revenue-bar-chart";
import { CategoryPieChart } from "@/components/category-pie-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchDashboardMetricsAction, DashboardMetrics } from "@/app/actions/dashboard";
import { InvoiceModal, InvoiceOrderData } from "@/components/invoice-modal";

export default function DashboardOverviewPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Invoice modal preview state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceOrderData | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const res = await fetchDashboardMetricsAction();
    if (res.success && res.data) {
      setMetrics(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="border-[#e8decf] bg-white text-[#713105] hover:bg-[#fff7e8] rounded-xl h-9 px-3 gap-1.5 font-semibold text-xs shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </CardContent>
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

      {/* Live Recent Activity & Inventory Alerts Section (Option 1) */}
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

      {/* Invoice Modal for Dashboard View */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={selectedInvoice}
      />
    </div>
  );
}

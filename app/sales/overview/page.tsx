"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, ShoppingBag, Clock, Award, Calendar, RefreshCw, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RevenueBarChart } from "@/components/revenue-bar-chart";
import { fetchOrdersAction } from "@/app/actions/orders";
import { InvoiceModal, InvoiceOrderData } from "@/components/invoice-modal";
import { useSwrData } from "@/lib/cache/swr-cache";

export function SalesPerformancePage() {
  const {
    data: rawOrders,
    isLoading,
    isRevalidating,
    refresh: loadData,
  } = useSwrData<any[]>("sales_portal_data", fetchOrdersAction);

  // Invoice modal state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceOrderData | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const ordersList = Array.isArray(rawOrders) ? rawOrders : [];
  const orders = ordersList.map((o: any) => {
    const orderItems = o.order_items || [];
    const firstItem = orderItems[0];
    const firstProduct = firstItem?.products;

    return {
      id: o.order_number || `#ORD-${o.id.slice(0, 4)}`,
      rawId: o.id,
      customer: o.customer_name,
      date: new Date(o.order_date || o.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      items: o.item_count,
      total: `₱${Number(o.total_amount || 0).toFixed(2)}`,
      payment: o.payment_method,
      status: o.status,
      productName: firstProduct?.name || "Catalog Product Item",
      productSku: firstProduct?.sku || "SKU-AUTO",
      unitPrice: firstItem?.unit_price || 0,
      quantity: firstItem?.quantity || o.item_count,
      orderItems: orderItems.map((item: any) => ({
        productName: item.products?.name || "Catalog Product Item",
        sku: item.products?.sku || "SKU-AUTO",
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.quantity * item.unit_price,
      })),
    };
  });

  // Performance calculations
  const monthlyQuota = 20000;
  const currentSalesTotal = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((acc, o) => acc + (parseFloat(o.total.replace(/[^0-9.-]+/g, "")) || 0), 0);

  const quotaProgressPercent = Math.min(100, (currentSalesTotal / monthlyQuota) * 100);
  const pendingOrdersCount = orders.filter((o) => o.status === "Pending").length;
  const totalOrdersCount = orders.length;
  const earnedCommission = (currentSalesTotal * 0.10).toFixed(2);

  const openInvoiceModal = (order: any) => {
    setSelectedInvoice({
      id: order.id,
      customer: order.customer,
      date: order.date,
      items: order.items,
      total: order.total,
      payment: order.payment,
      status: order.status,
      issuedBy: "Sales Operations",
      issuedRole: "Sales Representative",
      productName: order.productName,
      productSku: order.productSku,
      unitPrice: order.unitPrice,
      quantity: order.quantity,
      orderItems: order.orderItems,
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
              <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71]/50 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                Sales Representative Portal
              </Badge>
              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold">
                Live Data Feed
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-[#341100] tracking-tight">
              Sales Performance & Quota Tracker
            </h1>
            <p className="text-xs font-normal text-[#7f5e35] mt-1">
              Personal sales targets, active quotes, pending invoices, and order transaction history.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={loadData}
              disabled={isLoading || isRevalidating}
              variant="outline"
              size="sm"
              className="border-[#e8decf] text-[#4f351c] hover:bg-[#fff7e8] rounded-xl text-xs gap-1.5 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <div className="relative w-40">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7f5e35]" />
              <Input
                type="text"
                defaultValue="August 2026"
                readOnly
                className="pl-9 bg-[#fff7e8] border-[#e8decf] text-xs font-normal text-[#7f5e35] rounded-xl h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Progress Bar Card */}
      <Card className="border-[#e8decf] bg-white p-6 rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7f5e35]">
              Monthly Sales Quota Progress
            </span>
            <div className="text-xl font-bold text-[#341100] mt-0.5">
              ₱{currentSalesTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /{" "}
              <span className="text-[#7f5e35]">₱{monthlyQuota.toLocaleString("en-US", { minimumFractionDigits: 2 })} Target</span>
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
          <span>Current Gross Sales: ₱{currentSalesTotal.toFixed(2)}</span>
          <span>
            Remaining to Target: ₱{Math.max(0, monthlyQuota - currentSalesTotal).toFixed(2)}
          </span>
        </div>
      </Card>

      {/* 4 Tailored KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Monthly Target</span>
            <TrendingUp className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">₱{monthlyQuota.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Monthly quota</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Pending Invoices</span>
            <Clock className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#713105] mt-2">
            {isLoading ? "..." : pendingOrdersCount}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-semibold">Awaiting settlement</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Total Orders Placed</span>
            <ShoppingBag className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">
            {isLoading ? "..." : totalOrdersCount}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Recorded orders</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Estimated Commission</span>
            <Award className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            ₱{earnedCommission}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">10% standard rate</span>
        </Card>
      </div>

      {/* Chart & Recent Orders Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col">
          <RevenueBarChart />
        </div>

        <div className="lg:col-span-5 flex flex-col">
          <Card className="border-[#e8decf] shadow-xs rounded-xl bg-white flex-1 flex flex-col justify-between overflow-hidden">
            <CardHeader className="p-5 border-b border-[#e8decf] flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#4f351c]">
                Recent Orders Feed
              </CardTitle>
              <Badge className="bg-[#fff7e8] text-[#713105] border-[#e8decf] text-[10px]">
                Live Orders
              </Badge>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs text-[#341100]">
                <thead className="bg-[#fff7e8] border-b border-[#e8decf] text-[10px] uppercase tracking-wider text-[#7f5e35] font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Order ID</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8decf]/60">
                  {isLoading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3 px-4"><div className="w-16 h-3 bg-[#e8decf]/70 rounded-md" /></td>
                        <td className="py-3 px-4"><div className="w-20 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                        <td className="py-3 px-4"><div className="w-14 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                        <td className="py-3 px-4"><div className="w-16 h-4 bg-[#e8decf]/60 rounded-full" /></td>
                        <td className="py-3 px-4 text-right"><div className="w-6 h-4 bg-[#e8decf]/60 rounded-md ml-auto" /></td>
                      </tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-[#7f5e35]">
                        No orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 6).map((order) => (
                      <tr key={order.rawId || order.id} className="hover:bg-[#fcf3e3]/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#713105]">{order.id}</td>
                        <td className="py-3 px-4 text-[#341100] font-medium">{order.customer}</td>
                        <td className="py-3 px-4 font-bold text-[#341100]">{order.total}</td>
                        <td className="py-3 px-4">
                          {order.status === "Fulfilled" && (
                            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">
                              Fulfilled
                            </Badge>
                          )}
                          {order.status === "Pending" && (
                            <Badge className="bg-amber-50 text-[#713105] border-amber-200 text-[10px]">
                              Pending
                            </Badge>
                          )}
                          {order.status === "Cancelled" && (
                            <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                              Cancelled
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openInvoiceModal(order)}
                            className="text-[#713105] hover:text-[#341100] hover:underline text-[11px] font-semibold"
                          >
                            Invoice
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={selectedInvoice}
      />
    </div>
  );
}

export default SalesPerformancePage;

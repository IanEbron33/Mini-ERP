"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Download,
  Activity,
  PackageCheck,
  Truck,
  ShoppingBag,
  History,
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { fetchStockLogsAction } from "@/app/actions/products";
import { useSwrData } from "@/lib/cache/swr-cache";
import { toast } from "sonner";

export function StockLogsPage() {
  const {
    data: rawLogs,
    isLoading: isLoadingData,
    isRevalidating,
    refresh: loadStockLogs,
  } = useSwrData<any[]>("inventory_stock_logs", fetchStockLogsAction);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [shiftFilter, setShiftFilter] = useState<"all" | "additions" | "deductions">("all");

  // Map raw log records safely
  const logs = useMemo(() => {
    const list = Array.isArray(rawLogs) ? rawLogs : [];
    return list.map((l: any) => {
      const shift = Number(l.quantity_shift || 0);
      const isAddition = shift >= 0;
      return {
        id: l.movement_code || `MV-${(l.id || "").slice(0, 4)}`,
        dbId: l.id,
        rawTimestamp: new Date(l.timestamp || l.created_at || Date.now()),
        timestamp: new Date(l.timestamp || l.created_at || Date.now()).toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        sku: l.product_sku || "N/A",
        product: l.product_name || "Catalog Product",
        type: l.type || (isAddition ? "Supplier Addition" : "Order Deduction"),
        quantityShift: shift,
        quantity: `${isAddition ? "+" : ""}${shift} units`,
        reference: l.reference_note || (isAddition ? "Supplier Shipment Inflow" : "Order Fulfillment Deduction"),
        actor: l.actor_name || "Staff Admin",
        balanceAfter: `${l.balance_after ?? 0} units`,
      };
    });
  }, [rawLogs]);

  // Extract unique movement types for custom dropdown filter
  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.type));
    const list = Array.from(set);
    return [
      { value: "All", label: "All Movement Types" },
      ...list.map((t) => ({ value: t, label: t })),
    ];
  }, [logs]);

  // Computed KPIs
  const totalAdditions = useMemo(() => {
    return logs.filter((l) => l.quantityShift > 0).reduce((acc, l) => acc + l.quantityShift, 0);
  }, [logs]);

  const totalDeductions = useMemo(() => {
    return logs.filter((l) => l.quantityShift < 0).reduce((acc, l) => acc + Math.abs(l.quantityShift), 0);
  }, [logs]);

  const netShift = totalAdditions - totalDeductions;

  // Filtered log dataset
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedType === "All" || log.type === selectedType;

      const matchesShift =
        shiftFilter === "all" ||
        (shiftFilter === "additions" && log.quantityShift >= 0) ||
        (shiftFilter === "deductions" && log.quantityShift < 0);

      return matchesSearch && matchesType && matchesShift;
    });
  }, [logs, searchTerm, selectedType, shiftFilter]);

  // 1-Click CSV Export Generator
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("No stock movement logs to export.");
      return;
    }

    const headers = [
      "Movement Code",
      "Timestamp",
      "SKU",
      "Product Name",
      "Movement Type",
      "Quantity Shift",
      "Source Reference / Note",
      "Actor",
      "Balance After",
    ];

    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.sku}"`,
      `"${l.product.replace(/"/g, '""')}"`,
      `"${l.type}"`,
      `"${l.quantityShift >= 0 ? "+" : ""}${l.quantityShift}"`,
      `"${l.reference.replace(/"/g, '""')}"`,
      `"${l.actor.replace(/"/g, '""')}"`,
      `"${l.balanceAfter}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const todayStr = new Date().toISOString().split("T")[0];

    link.setAttribute("href", url);
    link.setAttribute("download", `Mini-ERP-Stock-Movement-Audit-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredLogs.length} stock movement audit records to CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white p-6">
        <CardContent className="p-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71]/50 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5">
                Inventory Movement Audit
              </Badge>
              <Badge className="bg-[#ebf5ed] text-[#15803d] border-[#c1e1c7] text-[10px] uppercase font-semibold px-2 py-0.5">
                Immutable Ledger
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-[#341100] tracking-tight">
              Stock Movement History
            </h1>
            <p className="text-xs font-normal text-[#7f5e35] mt-1">
              Operational audit trail tracking physical additions, supplier receipts, and customer order deductions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={loadStockLogs}
              disabled={isLoadingData || isRevalidating}
              variant="outline"
              size="sm"
              className="border-[#e8decf] bg-white text-[#713105] hover:bg-[#fff7e8] rounded-xl h-9 px-3 gap-1.5 font-semibold text-xs shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh Logs</span>
            </Button>

            <Button
              onClick={handleExportCSV}
              className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] gap-2 rounded-xl text-xs font-semibold px-4 h-9 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stock Additions */}
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Stock Additions</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2 font-mono">
            {isLoadingData ? "..." : `+${totalAdditions}`}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">Restocked & received units</span>
        </Card>

        {/* Stock Deductions */}
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Stock Deductions</span>
            <ShoppingBag className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#713105] mt-2 font-mono">
            {isLoadingData ? "..." : `-${totalDeductions}`}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Fulfilled orders & write-offs</span>
        </Card>

        {/* Net Stock Shift */}
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Net Stock Velocity</span>
            <Activity className="w-4 h-4 text-[#713105]" />
          </div>
          <div
            className={`text-2xl font-bold mt-2 font-mono ${
              netShift >= 0 ? "text-emerald-800" : "text-red-700"
            }`}
          >
            {isLoadingData ? "..." : netShift >= 0 ? `+${netShift}` : `${netShift}`}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Net warehouse balance shift</span>
        </Card>

        {/* Audit Trail Entries */}
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Audit Trail Entries</span>
            <PackageCheck className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2 font-mono">
            {isLoadingData ? "..." : logs.length}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Recorded physical movements</span>
        </Card>
      </div>

      {/* Multi-Criteria Filter Toolbar */}
      <Card className="border-[#e8decf] shadow-xs rounded-xl bg-white p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7f5e35]" />
            <Input
              placeholder="Search by SKU, product name, PO/Order #, or actor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#fff7e8] border-[#e8decf] text-xs text-[#341100] rounded-xl placeholder:text-[#7f5e35]/60 h-9"
            />
          </div>

          {/* Movement Type Custom Select Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#4f351c] whitespace-nowrap">Type:</span>
            <div className="w-48">
              <Select
                value={selectedType}
                onValueChange={setSelectedType}
                options={typeOptions}
                size="sm"
                placeholder="All Movement Types"
              />
            </div>
          </div>

          {/* Quick Segmented Direction Pills */}
          <div className="flex items-center gap-1 bg-[#fff7e8] p-1 rounded-xl border border-[#e8decf]">
            <button
              onClick={() => setShiftFilter("all")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                shiftFilter === "all"
                  ? "bg-[#713105] text-[#fff7e8] shadow-2xs"
                  : "text-[#7f5e35] hover:text-[#341100]"
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setShiftFilter("additions")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                shiftFilter === "additions"
                  ? "bg-[#15803d] text-white shadow-2xs"
                  : "text-[#7f5e35] hover:text-[#15803d]"
              }`}
            >
              Additions ({logs.filter((l) => l.quantityShift >= 0).length})
            </button>
            <button
              onClick={() => setShiftFilter("deductions")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                shiftFilter === "deductions"
                  ? "bg-[#713105] text-[#fff7e8] shadow-2xs"
                  : "text-[#7f5e35] hover:text-[#713105]"
              }`}
            >
              Deductions ({logs.filter((l) => l.quantityShift < 0).length})
            </button>
          </div>
        </div>
      </Card>

      {/* Stock Logs Data Table */}
      <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white overflow-hidden">
        <CardHeader className="p-5 border-b border-[#e8decf] flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-[#4f351c] flex items-center gap-2">
            <History className="w-4 h-4 text-[#713105]" />
            Stock Inflow & Outflow Audit Trail
          </CardTitle>
          <span className="text-xs font-semibold text-[#7f5e35]">
            Showing {filteredLogs.length} of {logs.length} records
          </span>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs text-[#341100]">
            <thead className="bg-[#fff7e8] border-b border-[#e8decf] text-[11px] uppercase tracking-wider text-[#7f5e35] font-semibold">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Movement ID</th>
                <th className="py-3.5 px-4">Product Name & SKU</th>
                <th className="py-3.5 px-4">Movement Type</th>
                <th className="py-3.5 px-4">Quantity Shift</th>
                <th className="py-3.5 px-4">Source Reference</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8decf]/60">
              {isLoadingData ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="w-24 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-36 h-3 bg-[#e8decf]/70 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-24 h-5 bg-[#e8decf]/60 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-28 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-16 h-3 bg-[#e8decf]/60 rounded-md ml-auto" /></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-xs text-[#7f5e35]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <History className="w-9 h-9 text-[#cfab71] mx-auto opacity-70" />
                      <p className="font-bold text-sm text-[#341100]">No Stock Logs Found</p>
                      <p className="text-[11px] text-[#7f5e35]">
                        {logs.length === 0
                          ? "No physical stock additions or order fulfillment deductions recorded yet."
                          : "No stock movement logs match your active search or filter criteria."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isPositive = log.quantityShift >= 0;
                  return (
                    <tr key={log.dbId || log.id} className="hover:bg-[#fcf3e3]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#7f5e35] whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#713105]">
                        {log.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-xs text-[#341100]">{log.product}</div>
                        <div className="text-[10px] text-[#7f5e35] font-mono">{log.sku}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPositive ? (
                          <Badge className="bg-[#ebf5ed] text-[#15803d] border-[#c1e1c7] text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 gap-1">
                            <ArrowUpRight className="w-3 h-3 text-[#15803d]" />
                            {log.type}
                          </Badge>
                        ) : (
                          <Badge className="bg-[#fdf0e6] text-[#713105] border-[#f1d0b5] text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 gap-1">
                            <ArrowDownRight className="w-3 h-3 text-[#713105]" />
                            {log.type}
                          </Badge>
                        )}
                      </td>
                      <td
                        className={`py-3.5 px-4 font-mono font-bold ${
                          isPositive ? "text-[#15803d]" : "text-[#713105]"
                        }`}
                      >
                        {log.quantity}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#4f351c]">
                        {log.reference}
                      </td>
                      <td className="py-3.5 px-4 text-[#7f5e35] font-medium">
                        {log.actor}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#341100]">
                        {log.balanceAfter}
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

export default StockLogsPage;

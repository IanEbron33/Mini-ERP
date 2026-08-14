"use client";

import React, { useState, useEffect } from "react";
import { ArrowDownRight, ArrowUpRight, Search, Filter, Download, Activity, PackageCheck, Truck, ShoppingBag, History } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchStockLogsAction } from "@/app/actions/products";

export function StockLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadStockLogs() {
      setIsLoadingData(true);
      const res = await fetchStockLogsAction();
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map((l: any) => ({
          id: l.movement_code || `MV-${l.id.slice(0, 4)}`,
          timestamp: new Date(l.timestamp).toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          sku: l.product_sku,
          product: l.product_name,
          type: l.type,
          quantity: `${l.quantity_shift >= 0 ? "+" : ""}${l.quantity_shift} units`,
          quantityShift: l.quantity_shift,
          reference: l.reference_note,
          actor: l.actor_name,
          balanceAfter: `${l.balance_after} units`,
        }));
        setLogs(mapped);
      } else {
        setLogs([]);
      }
      setIsLoadingData(false);
    }
    loadStockLogs();
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAdditions = logs.filter((l) => l.quantityShift > 0).reduce((acc, l) => acc + l.quantityShift, 0);
  const totalDeductions = logs.filter((l) => l.quantityShift < 0).reduce((acc, l) => acc + Math.abs(l.quantityShift), 0);
  const netShift = totalAdditions - totalDeductions;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white p-6">
        <CardContent className="p-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71]/50 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                Inventory Movement Audit
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-[#341100] tracking-tight">
              Stock Movement History
            </h1>
            <p className="text-xs font-normal text-[#7f5e35] mt-1">
              Operational audit trail showing every stock deduction and addition.
            </p>
          </div>

          <Button className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] gap-2 rounded-xl text-xs font-semibold px-4 py-2 cursor-pointer">
            <Download className="w-4 h-4" />
            Export Stock Movement Report
          </Button>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Stock Additions</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">+{totalAdditions}</div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Restocked units</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Stock Deductions</span>
            <ShoppingBag className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#713105] mt-2">-{totalDeductions}</div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Fulfilled & write-off units</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Net Stock Shift</span>
            <Activity className="w-4 h-4 text-[#713105]" />
          </div>
          <div className={`text-2xl font-bold mt-2 ${netShift >= 0 ? "text-emerald-800" : "text-red-700"}`}>
            {netShift >= 0 ? `+${netShift}` : netShift}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">Balance movement</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Audit Trail Entries</span>
            <PackageCheck className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">{logs.length}</div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Recorded log shifts</span>
        </Card>
      </div>

      {/* Stock Logs Data Table */}
      <Card className="border-[#e8decf] shadow-xs rounded-xl bg-white overflow-hidden">
        <CardHeader className="p-5 border-b border-[#e8decf] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle className="text-sm font-semibold text-[#4f351c]">
            Stock Addition & Deduction Audit Trail
          </CardTitle>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7f5e35]" />
              <Input
                placeholder="Search SKU, product or reference..."
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
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Movement ID</th>
                <th className="py-3 px-4">SKU / Product</th>
                <th className="py-3 px-4">Movement Type</th>
                <th className="py-3 px-4">Quantity Shift</th>
                <th className="py-3 px-4">Source Reference</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8decf]/60">
              {isLoadingData ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="w-24 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-32 h-3 bg-[#e8decf]/70 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-24 h-5 bg-[#e8decf]/60 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="w-14 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-28 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-16 h-3 bg-[#e8decf]/60 rounded-md ml-auto" /></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#7f5e35]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <History className="w-8 h-8 text-[#cfab71] mx-auto opacity-70" />
                      <p className="font-semibold text-[#341100]">No Stock Logs Recorded</p>
                      <p className="text-[11px] text-[#7f5e35]">No inventory additions or deductions recorded yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#fcf3e3]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#7f5e35]">{log.timestamp}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#713105]">{log.id}</td>
                    <td className="py-3.5 px-4 font-medium text-[#341100]">
                      {log.product}
                      <div className="text-[10px] text-[#7f5e35] font-mono">{log.sku}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {log.quantityShift >= 0 ? (
                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px] uppercase tracking-wide gap-1">
                          <ArrowUpRight className="w-3 h-3 text-emerald-700" />
                          {log.type || "Addition"}
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-[#713105] border-amber-200 text-[11px] uppercase tracking-wide gap-1">
                          <ArrowDownRight className="w-3 h-3 text-[#713105]" />
                          {log.type || "Deduction"}
                        </Badge>
                      )}
                    </td>
                    <td className={`py-3.5 px-4 font-bold ${log.quantityShift >= 0 ? "text-emerald-700" : "text-[#713105]"}`}>
                      {log.quantity}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#4f351c]">{log.reference}</td>
                    <td className="py-3.5 px-4 text-[#7f5e35]">{log.actor}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#341100]">
                      {log.balanceAfter}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export default StockLogsPage;

"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  FileSpreadsheet,
  Search,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import {
  fetchFinancialLedgerAction,
  FinancialReportData,
  FinancialLedgerEntry,
} from "@/app/actions/finance";

export function FinancePage() {
  const [reportData, setReportData] = useState<FinancialReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const loadData = async () => {
    setIsLoading(true);
    const res = await fetchFinancialLedgerAction();
    if (res.success && res.data) {
      setReportData(res.data);
    } else {
      toast.error(res.error || "Failed to load financial ledger.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const metrics = reportData?.metrics || {
    grossRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    estimatedTax: 0,
    totalTransactions: 0,
    incomeCount: 0,
    expenseCount: 0,
  };

  const rawLedger = reportData?.ledger || [];

  // Filter ledger entries
  const filteredLedger = rawLedger.filter((entry) => {
    const matchesSearch =
      entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "All" || entry.type === typeFilter;
    const matchesCategory = categoryFilter === "All" || entry.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Export to CSV spreadsheet
  const handleExportCSV = () => {
    if (filteredLedger.length === 0) {
      toast.error("No ledger entries available to export.");
      return;
    }

    const headers = [
      "TRX ID",
      "Date",
      "Category",
      "Description",
      "Type",
      "Amount",
      "Ending Balance",
      "Payment Method",
    ];

    const rows = filteredLedger.map((item) => [
      `"${item.id}"`,
      `"${item.date}"`,
      `"${item.category}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.type}"`,
      `"${item.formattedAmount}"`,
      `"${item.formattedBalance}"`,
      `"${item.paymentMethod}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `Mini-ERP-General-Ledger-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredLedger.length} ledger transactions to CSV!`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white p-6">
        <CardContent className="p-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71]/50 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5">
                Administrator Portal
              </Badge>
              <Badge className="bg-[#ebf5ed] text-[#15803d] border-[#c1e1c7] text-[10px] font-semibold">
                Real-Time General Ledger
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-[#341100] tracking-tight">
              Finance & Reports
            </h1>
            <p className="text-xs font-normal text-[#7f5e35] mt-1">
              Automated financial ledgers, revenue inflows, inventory restock expenses, and exportable audit records.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-stretch md:self-auto">
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

            <Button
              onClick={handleExportCSV}
              disabled={filteredLedger.length === 0}
              className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] gap-2 rounded-xl text-xs font-semibold px-4 h-9 shadow-xs"
            >
              <Download className="w-4 h-4" />
              Export CSV Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <Card className="border-[#e8decf] bg-white p-5 rounded-2xl shadow-xs hover:border-[#cfab71] transition-all">
          <div className="flex items-center justify-between text-[#7f5e35] text-[11px] font-bold uppercase tracking-wider">
            <span>Gross Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-[#ebf5ed] flex items-center justify-center border border-[#c1e1c7]">
              <ArrowUpRight className="w-4 h-4 text-[#15803d]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#341100] tracking-tight mt-2">
            {isLoading ? "..." : `₱${metrics.grossRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal mt-1 block">
            {metrics.incomeCount} Inflow {metrics.incomeCount === 1 ? "transaction" : "transactions"}
          </span>
        </Card>

        {/* Total Expenses */}
        <Card className="border-[#e8decf] bg-white p-5 rounded-2xl shadow-xs hover:border-[#cfab71] transition-all">
          <div className="flex items-center justify-between text-[#7f5e35] text-[11px] font-bold uppercase tracking-wider">
            <span>Total Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-[#fef2f2] flex items-center justify-center border border-[#fecaca]">
              <ArrowDownLeft className="w-4 h-4 text-[#b91c1c]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#b91c1c] tracking-tight mt-2">
            {isLoading ? "..." : `₱${metrics.totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal mt-1 block">
            {metrics.expenseCount} Procurement {metrics.expenseCount === 1 ? "outflow" : "outflows"}
          </span>
        </Card>

        {/* Net Profit */}
        <Card className="border-[#e8decf] bg-white p-5 rounded-2xl shadow-xs hover:border-[#cfab71] transition-all">
          <div className="flex items-center justify-between text-[#7f5e35] text-[11px] font-bold uppercase tracking-wider">
            <span>Net Profit</span>
            <div className="w-7 h-7 rounded-lg bg-[#fff7e8] flex items-center justify-center border border-[#e8decf]">
              <Banknote className="w-4 h-4 text-[#713105]" />
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight mt-2 ${metrics.netProfit >= 0 ? "text-[#341100]" : "text-[#b91c1c]"}`}>
            {isLoading ? "..." : `₱${metrics.netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-semibold mt-1 block">
            Net Operating Balance
          </span>
        </Card>

        {/* Estimated Tax Provision */}
        <Card className="border-[#e8decf] bg-white p-5 rounded-2xl shadow-xs hover:border-[#cfab71] transition-all">
          <div className="flex items-center justify-between text-[#7f5e35] text-[11px] font-bold uppercase tracking-wider">
            <span>Estimated Tax</span>
            <div className="w-7 h-7 rounded-lg bg-[#fff7e8] flex items-center justify-center border border-[#e8decf]">
              <PieChart className="w-4 h-4 text-[#713105]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#341100] tracking-tight mt-2">
            {isLoading ? "..." : `₱${metrics.estimatedTax.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal mt-1 block">
            15% Net Tax Reserve
          </span>
        </Card>
      </div>

      {/* Financial Ledger Table Card */}
      <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white overflow-hidden">
        <CardHeader className="p-5 border-b border-[#e8decf] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-bold text-[#341100] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#713105]" />
              General Ledger & Audit Stream
            </CardTitle>
            <p className="text-[11px] text-[#7f5e35] mt-0.5">
              Showing {filteredLedger.length} of {rawLedger.length} recorded accounting transactions
            </p>
          </div>

          {/* Interactive Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7f5e35]" />
              <Input
                placeholder="Search TRX ID, client, item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-[#fff7e8] border-[#e8decf] focus:bg-white rounded-xl"
              />
            </div>

            {/* Type Filter Dropdown */}
            <div className="w-36">
              <Select
                value={typeFilter}
                onValueChange={setTypeFilter}
                options={[
                  { value: "All", label: "All Types" },
                  { value: "Income", label: "Income Only" },
                  { value: "Expense", label: "Expense Only" },
                ]}
                placeholder="All Types"
              />
            </div>

            {/* Category Filter Dropdown */}
            <div className="w-44">
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
                options={[
                  { value: "All", label: "All Categories" },
                  { value: "Sales Revenue", label: "Sales Revenue" },
                  { value: "Inventory Restock", label: "Inventory Restock" },
                ]}
                placeholder="All Categories"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-[#fff7e8]/60 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filteredLedger.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#7f5e35]">
              <FileSpreadsheet className="w-8 h-8 text-[#cfab71] mx-auto mb-2 opacity-60" />
              No financial ledger entries matching the active filter criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-[#341100]">
              <thead className="bg-[#fff7e8] border-b border-[#e8decf] text-[10px] uppercase font-bold text-[#7f5e35] tracking-wider">
                <tr>
                  <th className="py-3 px-4">TRX ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Payment / Note</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Ending Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8decf]/60">
                {filteredLedger.map((item) => (
                  <tr key={item.id} className="hover:bg-[#fff7e8]/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#713105]">
                      {item.id}
                    </td>
                    <td className="py-3.5 px-4 text-[#7f5e35]">
                      {item.date}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#4f351c]">
                      {item.category}
                    </td>
                    <td className="py-3.5 px-4 text-[#341100] max-w-xs truncate font-medium" title={item.description}>
                      {item.description}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.type === "Income" ? (
                        <span className="inline-flex items-center bg-[#ebf5ed] text-[#15803d] border border-[#c1e1c7] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full gap-1">
                          <ArrowUpRight className="w-3 h-3 text-[#15803d]" /> Income
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full gap-1">
                          <ArrowDownLeft className="w-3 h-3 text-[#b91c1c]" /> Expense
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#7f5e35] text-[11px]">
                      {item.paymentMethod}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold ${item.type === "Income" ? "text-[#15803d]" : "text-[#b91c1c]"}`}>
                      {item.formattedAmount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#341100]">
                      {item.formattedBalance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FinancePage;

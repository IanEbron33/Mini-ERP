"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  ShieldAlert,
  Activity,
  Filter,
  Search,
  Download,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchAuditLogsAction } from "@/app/actions/audit-logs";
import { Select } from "@/components/ui/select";

export function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [moduleFilter, setModuleFilter] = useState<string>("All");

  const loadLogs = async () => {
    setIsLoading(true);
    const res = await fetchAuditLogsAction();
    if (res.success && Array.isArray(res.data)) {
      setLogs(res.data);
    } else {
      setLogs([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Compute available modules
  const modules = ["All", ...Array.from(new Set(logs.map((l) => l.module).filter(Boolean)))];

  // Filtering
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.actor_name && log.actor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.description && log.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.action && log.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.log_code && log.log_code.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLevel = levelFilter === "All" || log.level === levelFilter;
    const matchesModule = moduleFilter === "All" || log.module === moduleFilter;

    return matchesSearch && matchesLevel && matchesModule;
  });

  // Calculate live KPI metrics
  const totalEvents = logs.length;
  const adminAudits = logs.filter((l) => (l.actor_name?.toLowerCase().includes("admin") || l.module === "User Management")).length;
  const salesActions = logs.filter((l) => l.module === "Sales & Orders").length;
  const securityAlerts = logs.filter((l) => l.level === "SECURITY" || l.level === "WARNING").length;

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("No log entries available to export.");
      return;
    }

    const headers = ["Log Code", "Timestamp", "Actor", "Action", "Description", "Module", "IP Address", "Level"];
    const rows = filteredLogs.map((l) => [
      `"${l.log_code || ""}"`,
      `"${new Date(l.timestamp || l.created_at).toLocaleString()}"`,
      `"${l.actor_name || ""}"`,
      `"${l.action || ""}"`,
      `"${(l.description || "").replace(/"/g, '""')}"`,
      `"${l.module || ""}"`,
      `"${l.ip_address || "127.0.0.1"}"`,
      `"${l.level || "INFO"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mini-erp-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredLogs.length} audit log entries as CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white p-6">
        <CardContent className="p-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71]/50 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                Administrator Portal
              </Badge>
              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold">
                Live Supabase Audit Feed
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-[#341100] tracking-tight">
              Audit & System Activity Logs
            </h1>
            <p className="text-xs font-normal text-[#7f5e35] mt-1">
              Immutable activity trail recording user authentication, employee role changes, sales order placements, and stock movements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={loadLogs}
              variant="outline"
              size="sm"
              className="border-[#e8decf] text-[#4f351c] hover:bg-[#fff7e8] rounded-xl text-xs gap-1.5 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Feed
            </Button>
            <Button
              onClick={handleExportCSV}
              className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] gap-2 rounded-xl text-xs font-semibold px-4 py-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              Export CSV Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Total Logged Events</span>
            <Activity className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">
            {isLoading ? "..." : totalEvents}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal">All time records</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Admin Audits</span>
            <ShieldAlert className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">
            {isLoading ? "..." : adminAudits}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Role & system updates</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Sales Actions</span>
            <FileText className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">
            {isLoading ? "..." : salesActions}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Orders & transactions</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Security / Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-[#713105] mt-2">
            {isLoading ? "..." : securityAlerts}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-semibold">Flagged events</span>
        </Card>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Module filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-[#4f351c] uppercase tracking-wider mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#713105]" />
            Module:
          </span>
          {modules.map((mod) => (
            <button
              key={mod}
              onClick={() => setModuleFilter(mod)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                moduleFilter === mod
                  ? "bg-[#713105] text-[#fff7e8] shadow-xs"
                  : "bg-white border border-[#e8decf] text-[#4f351c] hover:bg-[#fff7e8]"
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <Card className="border-[#e8decf] shadow-xs rounded-xl bg-white overflow-hidden">
        <CardHeader className="p-5 border-b border-[#e8decf] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle className="text-sm font-semibold text-[#4f351c]">
            System Activity Feed & Audit Trail
          </CardTitle>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7f5e35]" />
              <Input
                placeholder="Search actor, action or detail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-[#fff7e8] border-[#e8decf] text-xs text-[#341100] rounded-xl placeholder:text-[#7f5e35]/60"
              />
            </div>

            {/* Level Filter */}
            <div className="w-32">
              <Select
                value={levelFilter}
                onValueChange={(val) => setLevelFilter(val)}
                options={[
                  { value: "All", label: "All Levels" },
                  { value: "INFO", label: "INFO" },
                  { value: "WARNING", label: "WARNING" },
                  { value: "SECURITY", label: "SECURITY" },
                ]}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs text-[#341100]">
            <thead className="bg-[#fff7e8] border-b border-[#e8decf] text-[11px] uppercase tracking-wider text-[#7f5e35] font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User / Actor</th>
                <th className="py-3 px-4">Action Code</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-center">Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8decf]/60">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="w-28 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-24 h-3 bg-[#e8decf]/70 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3 bg-[#e8decf]/70 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-48 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3 bg-[#e8decf]/50 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-3 bg-[#e8decf]/50 rounded-md" /></td>
                    <td className="py-3.5 px-4 text-center"><div className="w-14 h-5 bg-[#e8decf]/60 rounded-full mx-auto" /></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#7f5e35]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Clock className="w-8 h-8 text-[#cfab71] mx-auto opacity-70" />
                      <p className="font-semibold text-[#341100]">No Audit Logs Found</p>
                      <p className="text-[11px] text-[#7f5e35]">
                        {searchTerm || levelFilter !== "All" || moduleFilter !== "All"
                          ? "No audit records match your current filters."
                          : "No activity records logged in the database yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#fcf3e3]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#7f5e35]">
                      {new Date(log.timestamp || log.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#341100]">
                      {log.actor_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#713105] font-bold">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 text-[#4f351c] max-w-md break-words">
                      {log.description}
                    </td>
                    <td className="py-3.5 px-4 text-[#7f5e35]">
                      <Badge variant="outline" className="border-[#e8decf] bg-[#fff7e8] text-[#4f351c] text-[10px]">
                        {log.module}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#7f5e35]">
                      {log.ip_address || "127.0.0.1"}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {log.level === "INFO" && (
                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                          INFO
                        </Badge>
                      )}
                      {log.level === "WARNING" && (
                        <Badge className="bg-amber-50 text-[#713105] border-amber-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                          WARNING
                        </Badge>
                      )}
                      {log.level === "SECURITY" && (
                        <Badge className="bg-[#713105] text-[#fff7e8] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                          SECURITY
                        </Badge>
                      )}
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

export default AuditLogsPage;

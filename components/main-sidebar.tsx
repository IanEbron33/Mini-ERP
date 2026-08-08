"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Package,
  ShoppingCart,
  Banknote,
  Users,
  FileText,
} from "lucide-react";

export function MainSidebar() {
  const pathname = usePathname();

  const isOverviewActive = pathname === "/" || pathname === "/dashboard";

  return (
    <aside className="w-64 border-r border-[#e8decf] bg-white flex flex-col shrink-0 h-screen sticky top-0 z-20">
      {/* Brand Header */}
      <div className="h-16 border-b border-[#e8decf] flex items-center px-6 shrink-0">
        <Link href="/dashboard" className="font-serif text-lg font-bold tracking-tight text-[#341100] hover:text-[#713105] transition-colors">
          MINI-ERP
        </Link>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* MAIN MENU */}
        <div>
          <h2 className="text-[10px] font-bold tracking-wider text-[#7f5e35] uppercase px-2 mb-2">
            Main Menu
          </h2>
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all ${
                isOverviewActive
                  ? "bg-[#fcf3e3] text-[#341100] border border-[#cfab71]/40 shadow-xs"
                  : "hover:bg-[#fff7e8] text-[#4f351c]"
              }`}
            >
              <BarChart2 className="w-4 h-4 text-[#713105] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-[#341100]">
                  Overview
                </div>
                <div className="text-[11px] text-[#7f5e35] leading-tight mt-0.5">
                  High-level summary with KPI cards and quick revenue charts.
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* OPERATIONS MODULES */}
        <div>
          <h2 className="text-[10px] font-bold tracking-wider text-[#7f5e35] uppercase px-2 mb-2">
            Operations Modules
          </h2>
          <div className="space-y-1">
            <Link
              href="/dashboard/inventory"
              className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all ${
                pathname === "/dashboard/inventory"
                  ? "bg-[#fcf3e3] text-[#341100] border border-[#cfab71]/40 shadow-xs"
                  : "hover:bg-[#fff7e8] text-[#4f351c]"
              }`}
            >
              <Package className="w-4 h-4 text-[#7f5e35] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-[#4f351c]">
                  Inventory & Products
                </div>
                <div className="text-[11px] text-[#7f5e35] leading-tight mt-0.5">
                  View products, stock levels, categories, and low-stock alerts.
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/sales"
              className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all ${
                pathname === "/dashboard/sales"
                  ? "bg-[#fcf3e3] text-[#341100] border border-[#cfab71]/40 shadow-xs"
                  : "hover:bg-[#fff7e8] text-[#4f351c]"
              }`}
            >
              <ShoppingCart className="w-4 h-4 text-[#7f5e35] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-[#4f351c]">
                  Sales & Orders
                </div>
                <div className="text-[11px] text-[#7f5e35] leading-tight mt-0.5">
                  View transactions, pending orders, invoices, histories.
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/finance"
              className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all ${
                pathname === "/dashboard/finance"
                  ? "bg-[#fcf3e3] text-[#341100] border border-[#cfab71]/40 shadow-xs"
                  : "hover:bg-[#fff7e8] text-[#4f351c]"
              }`}
            >
              <Banknote className="w-4 h-4 text-[#7f5e35] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-[#4f351c]">
                  Finance & Reports
                </div>
                <div className="text-[11px] text-[#7f5e35] leading-tight mt-0.5">
                  Ledgers, revenue vs. expense, export summary reports.
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ADMINISTRATION (ADMIN-ONLY) */}
        <div>
          <h2 className="text-[10px] font-bold tracking-wider text-[#7f5e35] uppercase px-2 mb-2">
            Administration (Admin-Only)
          </h2>
          <div className="space-y-1">
            <Link
              href="/dashboard/users"
              className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all ${
                pathname === "/dashboard/users"
                  ? "bg-[#fcf3e3] text-[#341100] border border-[#cfab71]/40 shadow-xs"
                  : "hover:bg-[#fff7e8] text-[#4f351c]"
              }`}
            >
              <Users className="w-4 h-4 text-[#7f5e35] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-[#4f351c]">
                  User Management
                </div>
                <div className="text-[11px] text-[#7f5e35] leading-tight mt-0.5">
                  View active staff, register employees, assign roles.
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/logs"
              className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all ${
                pathname === "/dashboard/logs"
                  ? "bg-[#fcf3e3] text-[#341100] border border-[#cfab71]/40 shadow-xs"
                  : "hover:bg-[#fff7e8] text-[#4f351c]"
              }`}
            >
              <FileText className="w-4 h-4 text-[#7f5e35] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-[#4f351c]">
                  Audit & System Logs
                </div>
                <div className="text-[11px] text-[#7f5e35] leading-tight mt-0.5">
                  Logs every major system action across modules.
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}

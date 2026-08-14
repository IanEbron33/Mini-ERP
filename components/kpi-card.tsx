"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Package, AlertTriangle, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchDashboardMetricsAction, DashboardMetrics } from "@/app/actions/dashboard";

interface KpiCardsSectionProps {
  metrics?: DashboardMetrics;
  isLoading?: boolean;
}

export function KpiCardsSection({ metrics: propMetrics, isLoading: propIsLoading }: KpiCardsSectionProps) {
  const [internalMetrics, setInternalMetrics] = useState<DashboardMetrics | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);

  useEffect(() => {
    if (propMetrics) {
      setInternalMetrics(propMetrics);
      setInternalLoading(false);
      return;
    }

    async function loadData() {
      const res = await fetchDashboardMetricsAction();
      if (res.success && res.data) {
        setInternalMetrics(res.data);
      }
      setInternalLoading(false);
    }
    loadData();
  }, [propMetrics]);

  const metrics = propMetrics || internalMetrics;
  const isLoading = propIsLoading !== undefined ? propIsLoading : internalLoading;

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-[#e8decf] shadow-xs rounded-2xl bg-white p-5 animate-pulse">
            <div className="flex justify-between items-center mb-3">
              <div className="h-3 w-20 bg-[#fff7e8] rounded-md" />
              <div className="w-4 h-4 bg-[#fff7e8] rounded-full" />
            </div>
            <div className="h-8 w-32 bg-[#fff7e8] rounded-md mb-3" />
            <div className="h-4 w-24 bg-[#fff7e8] rounded-md" />
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: "TOTAL SALES REVENUE",
      value: `$${metrics.totalSales.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      trend: metrics.salesTrend,
      isPositive: metrics.isPositiveTrend,
      icon: TrendingUp,
    },
    {
      title: "TOTAL PRODUCTS IN CATALOG",
      value: `${metrics.totalProducts}`,
      subtext: `Across ${metrics.categoriesCount} active ${metrics.categoriesCount === 1 ? "category" : "categories"}`,
      icon: Package,
    },
    {
      title: "LOW STOCK ALERTS",
      value: `${metrics.lowStockCount}`,
      alertText: metrics.lowStockCount > 0 ? `${metrics.lowStockCount} Requires Restock` : "Inventory Healthy",
      isAlert: metrics.lowStockCount > 0,
      icon: AlertTriangle,
    },
    {
      title: "ACTIVE SYSTEM USERS",
      value: `${metrics.activeStaffCount}`,
      subtext: "Verified staff accounts",
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <Card
          key={index}
          className="border-[#e8decf] shadow-xs hover:border-[#cfab71] transition-all rounded-2xl bg-white"
        >
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7f5e35]">
                {kpi.title}
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#fff7e8] flex items-center justify-center border border-[#e8decf]">
                <kpi.icon className="w-3.5 h-3.5 text-[#713105]" />
              </div>
            </div>

            <div className="text-2xl font-black text-[#341100] tracking-tight">
              {kpi.isAlert ? (
                <span className="text-[#b91c1c]">{kpi.value}</span>
              ) : (
                kpi.value
              )}
            </div>

            <div className="pt-1">
              {kpi.trend && (
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border gap-1 ${
                      kpi.isPositive
                        ? "bg-[#ebf5ed] text-[#15803d] border-[#c1e1c7]"
                        : "bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]"
                    }`}
                  >
                    {kpi.isPositive ? (
                      <TrendingUp className="w-3 h-3 text-[#15803d]" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-[#b91c1c]" />
                    )}
                    {kpi.trend} vs last mo.
                  </span>
                </div>
              )}

              {kpi.subtext && (
                <span className="text-xs font-normal text-[#7f5e35]">
                  {kpi.subtext}
                </span>
              )}

              {kpi.alertText && (
                <span
                  className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border gap-1 ${
                    kpi.isAlert
                      ? "bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]"
                      : "bg-[#ebf5ed] text-[#15803d] border-[#c1e1c7]"
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {kpi.alertText}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default KpiCardsSection;

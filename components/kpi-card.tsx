"use client";

import React from "react";
import { TrendingUp, Package, AlertTriangle, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function KpiCardsSection() {
  const kpis = [
    {
      title: "TOTAL SALES",
      value: "$124,592.00",
      trend: "+12.5%",
      icon: TrendingUp,
    },
    {
      title: "TOTAL PRODUCTS",
      value: "482",
      subtext: "Across 12 categories",
      icon: Package,
    },
    {
      title: "LOW STOCK COUNT",
      value: "14",
      alertText: "Requires attention",
      isAlert: true,
      icon: AlertTriangle,
    },
    {
      title: "ACTIVE STAFF COUNT",
      value: "8",
      subtext: "System registered users",
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <Card
          key={index}
          className="border-[#e8decf] shadow-xs hover:border-[#cfab71] transition-all rounded-xl bg-white"
        >
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7f5e35]">
                {kpi.title}
              </span>
              <kpi.icon className="w-4 h-4 text-[#713105]/70" />
            </div>

            <div className="text-2xl font-bold text-[#341100] tracking-tight">
              {kpi.isAlert ? (
                <span className="text-red-700">{kpi.value}</span>
              ) : (
                kpi.value
              )}
            </div>

            <div className="pt-1">
              {kpi.trend && (
                <div className="flex items-center gap-1">
                  <Badge variant="success" className="text-[11px] font-semibold uppercase tracking-wide gap-1 bg-emerald-50 text-emerald-800 border-emerald-200">
                    <TrendingUp className="w-3 h-3" />
                    {kpi.trend}
                  </Badge>
                </div>
              )}

              {kpi.subtext && (
                <span className="text-xs font-normal text-[#7f5e35]">
                  {kpi.subtext}
                </span>
              )}

              {kpi.alertText && (
                <Badge variant="destructive" className="text-[11px] font-semibold uppercase tracking-wide">
                  {kpi.alertText}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

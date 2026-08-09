"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { KpiCardsSection } from "@/components/kpi-card";
import { RevenueBarChart } from "@/components/revenue-bar-chart";
import { CategoryPieChart } from "@/components/category-pie-chart";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Header Banner Card */}
      <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white p-6">
        <CardContent className="p-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71]/50 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                Administrator Portal
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-[#341100] tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-xs font-normal text-[#7f5e35] mt-1">
              High-level summary displaying KPI cards (Total Sales, Total Products, Low Stock Count, Active Staff Count) and quick revenue charts.
            </p>
          </div>

          {/* Date Input Selector */}
          <div className="relative w-44">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7f5e35]" />
            <Input
              type="text"
              defaultValue="mm/dd/yyyy"
              className="pl-9 bg-[#fff7e8] border-[#e8decf] text-xs font-normal text-[#7f5e35] focus:bg-white rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* 4 KPI Cards Grid */}
      <KpiCardsSection />

      {/* 2 Column Data Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Revenue Analytics Bar Graph & Area Chart */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <RevenueBarChart />
        </div>

        {/* Right: Category Distribution Donut / Pie Chart */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <CategoryPieChart />
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { MonthlyRevenueData } from "@/app/actions/dashboard";

interface RevenueBarChartProps {
  data?: MonthlyRevenueData[];
  isLoading?: boolean;
}

const defaultChartData: MonthlyRevenueData[] = [
  { month: "Mar", revenue: 0, orders: 0 },
  { month: "Apr", revenue: 0, orders: 0 },
  { month: "May", revenue: 0, orders: 0 },
  { month: "Jun", revenue: 0, orders: 0 },
  { month: "Jul", revenue: 0, orders: 0 },
  { month: "Aug", revenue: 0, orders: 0 },
];

const chartConfig: ChartConfig = {
  revenue: {
    label: "Revenue (₱)",
    color: "#713105", // ESPRESSO
  },
  orders: {
    label: "Orders",
    color: "#cfab71", // CREMA
  },
};

export function RevenueBarChart({ data = defaultChartData, isLoading = false }: RevenueBarChartProps) {
  const [chartType, setChartType] = useState<"bar" | "area">("bar");

  const chartData = data && data.length > 0 ? data : defaultChartData;
  const totalPeriodRevenue = chartData.reduce((acc, curr) => acc + curr.revenue, 0);

  const formatYAxisTick = (val: number) => {
    if (val === 0) return "₱0";
    if (val >= 1_000_000) return `₱${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 10_000) return `₱${(val / 1_000).toFixed(0)}k`;
    return `₱${val.toLocaleString("en-US")}`;
  };

  return (
    <Card className="border-[#e8decf] shadow-xs rounded-2xl flex flex-col justify-between bg-white h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#e8decf]">
        <div>
          <CardTitle className="text-sm font-bold text-[#341100]">
            Revenue Analytics
          </CardTitle>
          <p className="text-[11px] text-[#7f5e35] mt-0.5">
            Total 6-Month Volume: <strong className="text-[#713105] font-semibold">₱{totalPeriodRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Chart Type Selector */}
          <div className="flex items-center bg-[#fff7e8] p-0.5 rounded-xl border border-[#e8decf] text-[11px]">
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1 rounded-lg transition-all ${
                chartType === "bar"
                  ? "bg-[#713105] text-[#fff7e8] font-bold shadow-2xs"
                  : "text-[#7f5e35] hover:text-[#341100]"
              }`}
            >
              Bar Graph
            </button>
            <button
              onClick={() => setChartType("area")}
              className={`px-3 py-1 rounded-lg transition-all ${
                chartType === "area"
                  ? "bg-[#713105] text-[#fff7e8] font-bold shadow-2xs"
                  : "text-[#7f5e35] hover:text-[#341100]"
              }`}
            >
              Area Line
            </button>
          </div>

          <span className="text-xs font-semibold text-[#7f5e35] bg-[#fff7e8] border border-[#e8decf] px-3 py-1 rounded-xl hidden sm:inline-block">
            Last 6 Months
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-6 pb-2 flex-1 flex flex-col justify-center">
        {isLoading ? (
          <div className="h-64 w-full bg-[#fff7e8]/50 animate-pulse rounded-xl flex items-center justify-center text-xs text-[#7f5e35]">
            Loading revenue trends...
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            {chartType === "bar" ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8decf" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  className="text-[11px] fill-[#7f5e35] font-semibold"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  className="text-[10px] fill-[#7f5e35]"
                  tickFormatter={formatYAxisTick}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(val) => `₱${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="#713105"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#713105" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#713105" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8decf" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  className="text-[11px] fill-[#7f5e35] font-semibold"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  className="text-[10px] fill-[#7f5e35]"
                  tickFormatter={formatYAxisTick}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(val) => `₱${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#713105"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            )}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default RevenueBarChart;

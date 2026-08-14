"use client";

import React, { useState } from "react";
import { PieChart, Pie, Cell } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { CategoryDistributionData } from "@/app/actions/dashboard";

interface CategoryPieChartProps {
  data?: CategoryDistributionData[];
  isLoading?: boolean;
}

const defaultCategoryData: CategoryDistributionData[] = [
  {
    name: "General Catalog",
    value: 100,
    items: 0,
    revenue: "$0.00",
    color: "#713105",
  },
];

export function CategoryPieChart({ data = defaultCategoryData, isLoading = false }: CategoryPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const categoryData = data && data.length > 0 ? data : defaultCategoryData;
  const totalCatalogItems = categoryData.reduce((acc, curr) => acc + (curr.items || 0), 0);

  // Dynamically generate chartConfig based on input data
  const chartConfig: ChartConfig = categoryData.reduce((acc, curr) => {
    acc[curr.name] = {
      label: curr.name,
      color: curr.color,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card className="border-[#e8decf] shadow-xs rounded-2xl flex flex-col justify-between bg-white h-full">
      <CardHeader className="pb-3 border-b border-[#e8decf] flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-[#341100]">
            Category Distribution
          </CardTitle>
          <p className="text-[11px] text-[#7f5e35] mt-0.5">
            Real-time catalog stock & valuation
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-4 pb-4 flex flex-col items-center justify-center flex-1">
        {isLoading ? (
          <div className="h-56 w-full bg-[#fff7e8]/50 animate-pulse rounded-xl flex items-center justify-center text-xs text-[#7f5e35]">
            Loading catalog categories...
          </div>
        ) : (
          <>
            {/* shadcn Donut Chart Container */}
            <div className="relative w-full h-52 flex items-center justify-center my-1">
              <ChartContainer config={chartConfig} className="h-52 w-full max-w-[220px]">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="name"
                        indicator="dot"
                        className="bg-white/95 border-[#e8decf] shadow-md p-2.5 rounded-xl text-xs z-50 min-w-[130px]"
                        formatter={(value, name, item) => (
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-bold text-xs text-[#341100]">{name}</span>
                              <span className="font-black text-xs text-[#713105]">{value}%</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#7f5e35] pt-0.5 border-t border-[#e8decf]/60">
                              <span>{item.payload.items} {item.payload.items === 1 ? "item" : "items"}</span>
                              <span className="font-mono font-bold text-[#4f351c]">{item.payload.revenue}</span>
                            </div>
                          </div>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={88}
                    paddingAngle={categoryData.length > 1 ? 3 : 0}
                    dataKey="value"
                    strokeWidth={0}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className={`transition-all duration-200 cursor-pointer outline-none ${
                          activeIndex === index ? "opacity-100 filter drop-shadow-xs" : "opacity-85 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>

              {/* Clean Non-Colliding Center Total Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="block font-black text-2xl text-[#341100] leading-none tracking-tight">
                  {totalCatalogItems}
                </span>
                <span className="text-[10px] uppercase font-bold text-[#7f5e35] mt-1 tracking-wider">
                  {totalCatalogItems === 1 ? "Product" : "Products"}
                </span>
              </div>
            </div>

            {/* Detailed Inventory & Category Legend */}
            <div className="w-full space-y-1.5 mt-3 px-1 max-h-44 overflow-y-auto">
              {categoryData.map((item, index) => {
                const isSelected = activeIndex === index;

                return (
                  <div
                    key={index}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-[#fff7e8] border-[#cfab71]/50 shadow-2xs"
                        : "border-transparent hover:bg-[#fff7e8]/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-[#e8decf]"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#341100] truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-[#7f5e35]">
                          {item.items} {item.items === 1 ? "product" : "products"}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <div className="text-xs font-bold text-[#713105]">
                        {item.revenue}
                      </div>
                      <div className="text-[10px] font-medium text-[#7f5e35]">
                        {item.value}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default CategoryPieChart;

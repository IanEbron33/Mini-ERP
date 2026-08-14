"use server";

import { createClient } from "@/lib/supabase/server";

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  orders: number;
}

export interface CategoryDistributionData {
  name: string;
  value: number;
  items: number;
  revenue: string;
  color: string;
}

export interface DashboardMetrics {
  totalSales: number;
  salesTrend: string;
  isPositiveTrend: boolean;
  totalProducts: number;
  categoriesCount: number;
  lowStockCount: number;
  activeStaffCount: number;
  monthlyRevenue: MonthlyRevenueData[];
  categoryDistribution: CategoryDistributionData[];
  recentOrders: any[];
  lowStockProducts: any[];
}

const COFFEE_PALETTE = [
  "#713105", // ESPRESSO
  "#cfab71", // CREMA
  "#7f5e35", // ROAST
  "#4f351c", // GROUNDS
  "#a4784a", // CARAMEL
  "#c49e70", // LATTE
  "#e8decf", // FOAM BORDER TINT
];

export async function fetchDashboardMetricsAction(): Promise<{
  success: boolean;
  data?: DashboardMetrics;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // 1. Parallel fetch of all core collections
    const [ordersRes, productsRes, profilesRes] = await Promise.all([
      supabase
        .from("orders")
        .select("*, order_items(*, products(*))")
        .order("created_at", { ascending: false }),
      supabase
        .from("products")
        .select("*")
        .order("stock_quantity", { ascending: true }),
      supabase
        .from("profiles")
        .select("id, status"),
    ]);

    const orders = ordersRes.data || [];
    const products = productsRes.data || [];
    const profiles = profilesRes.data || [];

    // 2. Compute KPI Metrics
    const validOrders = orders.filter((o) => o.status !== "Cancelled");
    const totalSales = validOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

    let currentMonthSales = 0;
    let prevMonthSales = 0;

    validOrders.forEach((o) => {
      const orderDate = new Date(o.order_date || o.created_at);
      const key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
      if (key === currentMonthKey) {
        currentMonthSales += Number(o.total_amount || 0);
      } else if (key === prevMonthKey) {
        prevMonthSales += Number(o.total_amount || 0);
      }
    });

    let salesTrend = "+12.5%";
    let isPositiveTrend = true;
    if (prevMonthSales > 0) {
      const diff = ((currentMonthSales - prevMonthSales) / prevMonthSales) * 100;
      salesTrend = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
      isPositiveTrend = diff >= 0;
    } else if (currentMonthSales > 0) {
      salesTrend = "+100%";
      isPositiveTrend = true;
    } else {
      salesTrend = "0.0%";
      isPositiveTrend = true;
    }

    const totalProducts = products.length;
    const categoriesSet = new Set(products.map((p) => p.category).filter(Boolean));
    const categoriesCount = categoriesSet.size;

    const lowStockProducts = products.filter(
      (p) => (p.stock_quantity ?? 0) <= (p.reorder_level ?? 10)
    );
    const lowStockCount = lowStockProducts.length;

    const activeStaffCount = profiles.filter(
      (p) => p.status === "Active" || !p.status
    ).length;

    // 3. Compute Rolling 6-Month Revenue & Orders Chart Data
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const rollingMonths: { [key: string]: { month: string; revenue: number; orders: number } } = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = monthNames[d.getMonth()];
      rollingMonths[key] = {
        month: label,
        revenue: 0,
        orders: 0,
      };
    }

    validOrders.forEach((o) => {
      const d = new Date(o.order_date || o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (rollingMonths[key]) {
        rollingMonths[key].revenue += Number(o.total_amount || 0);
        rollingMonths[key].orders += 1;
      }
    });

    const monthlyRevenue: MonthlyRevenueData[] = Object.values(rollingMonths);

    // 4. Compute Dynamic Category Breakdown Donut Data based on Actual Sales Revenue
    const productCategoryMap: { [prodId: string]: string } = {};
    const productCountByCategory: { [cat: string]: number } = {};

    products.forEach((p) => {
      const cat = p.category || "General";
      productCategoryMap[p.id] = cat;
      productCountByCategory[cat] = (productCountByCategory[cat] || 0) + 1;
    });

    const categorySalesMap: { [cat: string]: number } = {};

    validOrders.forEach((o) => {
      const orderItems = o.order_items || [];
      if (orderItems.length > 0) {
        orderItems.forEach((item: any) => {
          const cat = item.products?.category || productCategoryMap[item.product_id] || "General";
          const itemTotal = Number(item.quantity || 1) * Number(item.unit_price || 0);
          categorySalesMap[cat] = (categorySalesMap[cat] || 0) + itemTotal;
        });
      } else {
        const defaultCat = Object.keys(productCountByCategory)[0] || "General";
        categorySalesMap[defaultCat] = (categorySalesMap[defaultCat] || 0) + Number(o.total_amount || 0);
      }
    });

    const allCategoryNames = Array.from(
      new Set([...Object.keys(productCountByCategory), ...Object.keys(categorySalesMap)])
    );

    const totalCalculatedSales = Object.values(categorySalesMap).reduce((a, b) => a + b, 0);

    const categoryDistribution: CategoryDistributionData[] = allCategoryNames.map(
      (catName, idx) => {
        const sales = categorySalesMap[catName] || 0;
        const percent = totalCalculatedSales > 0
          ? Math.round((sales / totalCalculatedSales) * 100)
          : (totalProducts > 0 ? Math.round(((productCountByCategory[catName] || 0) / totalProducts) * 100) : 0);

        const itemCount = productCountByCategory[catName] || 0;

        return {
          name: catName,
          value: percent > 0 ? percent : 100,
          items: itemCount,
          revenue: `₱${sales.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          color: COFFEE_PALETTE[idx % COFFEE_PALETTE.length],
        };
      }
    );

    // If no categories exist, provide graceful empty fallback
    if (categoryDistribution.length === 0) {
      categoryDistribution.push({
        name: "General Catalog",
        value: 100,
        items: 0,
        revenue: "₱0.00",
        color: "#cfab71",
      });
    }

    // 5. Recent 5 Orders for Dashboard Feed
    const recentOrders = orders.slice(0, 5).map((o) => ({
      id: o.order_number || `#ORD-${o.id.slice(0, 4)}`,
      rawId: o.id,
      customer: o.customer_name,
      date: new Date(o.order_date || o.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      }),
      items: o.item_count,
      total: `₱${Number(o.total_amount || 0).toFixed(2)}`,
      payment: o.payment_method,
      status: o.status,
    }));

    return {
      success: true,
      data: {
        totalSales,
        salesTrend,
        isPositiveTrend,
        totalProducts,
        categoriesCount,
        lowStockCount,
        activeStaffCount,
        monthlyRevenue,
        categoryDistribution,
        recentOrders,
        lowStockProducts: lowStockProducts.slice(0, 5),
      },
    };
  } catch (err: any) {
    console.error("fetchDashboardMetricsAction Exception:", err);
    return { success: false, error: err.message || "Failed to load dashboard metrics." };
  }
}

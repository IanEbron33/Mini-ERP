"use server";

import { createClient } from "@/lib/supabase/server";

export interface FinancialLedgerEntry {
  id: string; // e.g. TRX-ORD-4479
  rawId: string;
  date: string;
  rawDate: string;
  category: "Sales Revenue" | "Inventory Restock" | "Logistics & Freight" | "Operational Expense";
  description: string;
  type: "Income" | "Expense";
  amount: number;
  formattedAmount: string;
  balance: number;
  formattedBalance: string;
  paymentMethod: string;
  status: string;
}

export interface FinancialMetrics {
  grossRevenue: number;
  totalExpenses: number;
  netProfit: number;
  estimatedTax: number;
  totalTransactions: number;
  incomeCount: number;
  expenseCount: number;
}

export interface FinancialReportData {
  metrics: FinancialMetrics;
  ledger: FinancialLedgerEntry[];
}

export async function fetchFinancialLedgerAction(): Promise<{
  success: boolean;
  data?: FinancialReportData;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // 1. Fetch sales orders (Inflows) and stock movement logs (Outflows) in parallel
    const [ordersRes, stockLogsRes, productsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("*, order_items(*, products(*))")
        .order("created_at", { ascending: true }),
      supabase
        .from("stock_logs")
        .select("*")
        .order("timestamp", { ascending: true }),
      supabase
        .from("products")
        .select("id, name, sku, wholesale_price, retail_price"),
    ]);

    const orders = ordersRes.data || [];
    const stockLogs = stockLogsRes.data || [];
    const products = productsRes.data || [];

    // Map product wholesale costs for restock expense calculations
    const productCostMap: { [id: string]: number } = {};
    const productCostByName: { [name: string]: number } = {};
    const productCostBySku: { [sku: string]: number } = {};

    products.forEach((p) => {
      const cost = Number(p.wholesale_price || Number(p.retail_price || 0) * 0.6 || 25);
      productCostMap[p.id] = cost;
      if (p.name) productCostByName[p.name.toLowerCase()] = cost;
      if (p.sku) productCostBySku[p.sku.toLowerCase()] = cost;
    });

    const rawEntries: Array<{
      id: string;
      rawId: string;
      date: string;
      rawDate: string;
      category: "Sales Revenue" | "Inventory Restock" | "Logistics & Freight" | "Operational Expense";
      description: string;
      type: "Income" | "Expense";
      amount: number;
      paymentMethod: string;
      status: string;
    }> = [];

    // 2. Map Orders into Income Entries
    orders.forEach((o) => {
      if (o.status === "Cancelled") return; // Skip cancelled orders

      const orderNumberClean = (o.order_number || `#ORD-${o.id.slice(0, 4)}`).replace("#", "");
      const orderDate = new Date(o.order_date || o.created_at || Date.now());

      const firstItem = o.order_items?.[0];
      const prodName = firstItem?.products?.name || "Catalog Items";
      const desc = o.order_items && o.order_items.length > 1
        ? `Sales Order #${orderNumberClean} for ${o.customer_name} (${o.item_count} items)`
        : `Sales Order #${orderNumberClean} for ${o.customer_name} (${o.item_count}x ${prodName})`;

      rawEntries.push({
        id: `TRX-${orderNumberClean}`,
        rawId: o.id,
        date: orderDate.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        rawDate: orderDate.toISOString(),
        category: "Sales Revenue",
        description: desc,
        type: "Income",
        amount: Number(o.total_amount || 0),
        paymentMethod: o.payment_method || "Credit Card",
        status: o.status || "Completed",
      });
    });

    // 3. Map Stock Logs into Expense Entries (Supplier Additions / Restocks)
    stockLogs.forEach((log) => {
      // Exclude restocks resulting from order cancellations so it doesn't double-charge
      const isCancellationRestock = log.reference_note?.toLowerCase().includes("cancelled");
      if (isCancellationRestock) return;

      const isAddition =
        log.type === "Supplier Addition" ||
        log.type === "Addition" ||
        log.quantity_shift > 0;

      if (!isAddition) return; // Only inventory purchase/restock incurs procurement expense

      const logCode = log.movement_code || `LOG-${log.id.slice(0, 4)}`;
      const logDate = new Date(log.timestamp || log.created_at || Date.now());
      const qty = Math.abs(log.quantity_shift || 0);

      const unitCost =
        (log.product_id && productCostMap[log.product_id]) ||
        (log.product_sku && productCostBySku[log.product_sku.toLowerCase()]) ||
        (log.product_name && productCostByName[log.product_name.toLowerCase()]) ||
        25;

      const expenseAmount = qty * unitCost;

      if (expenseAmount <= 0) return;

      rawEntries.push({
        id: `TRX-${logCode}`,
        rawId: log.id,
        date: logDate.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        rawDate: logDate.toISOString(),
        category: "Inventory Restock",
        description: `Supplier Restock: ${qty}x ${log.product_name || "Catalog Product"} (${log.reference_note || "Shipment Inflow"})`,
        type: "Expense",
        amount: expenseAmount,
        paymentMethod: "Supplier Invoice",
        status: "Fulfilled",
      });
    });

    // 4. Sort Chronologically (Oldest first to build running balance)
    rawEntries.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());

    let runningBalance = 0;
    let grossRevenue = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    const ledger: FinancialLedgerEntry[] = rawEntries.map((entry) => {
      if (entry.type === "Income") {
        runningBalance += entry.amount;
        grossRevenue += entry.amount;
        incomeCount += 1;
      } else {
        runningBalance -= entry.amount;
        totalExpenses += entry.amount;
        expenseCount += 1;
      }

      return {
        ...entry,
        formattedAmount: `${entry.type === "Income" ? "+" : "-"}₱${entry.amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        balance: runningBalance,
        formattedBalance: `₱${runningBalance.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      };
    });

    // Sort newest first for table display
    ledger.reverse();

    const netProfit = grossRevenue - totalExpenses;
    const estimatedTax = netProfit > 0 ? netProfit * 0.15 : 0;

    return {
      success: true,
      data: {
        metrics: {
          grossRevenue,
          totalExpenses,
          netProfit,
          estimatedTax,
          totalTransactions: ledger.length,
          incomeCount,
          expenseCount,
        },
        ledger,
      },
    };
  } catch (err: any) {
    console.error("fetchFinancialLedgerAction Error:", err);
    return { success: false, error: err.message || "Failed to load financial records." };
  }
}

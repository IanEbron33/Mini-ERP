"use server";

import { createClient } from "@/lib/supabase/server";

export interface CreateOrderInput {
  customerName: string;
  productName: string;
  quantity: number;
  paymentMethod: string;
  unitPrice: number;
}

export async function fetchOrdersAction() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });

    if (error || !data) {
      return { success: false, data: [] };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function createOrderAction(input: CreateOrderInput) {
  try {
    const supabase = await createClient();

    const orderNumber = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalAmount = input.quantity * input.unitPrice;

    // 1. Create order record
    const { data: orderData, error: orderError } = await supabase.from("orders").insert({
      order_number: orderNumber,
      customer_name: input.customerName,
      item_count: input.quantity,
      total_amount: totalAmount,
      payment_method: input.paymentMethod,
      status: "Pending",
    }).select().single();

    if (orderError) {
      console.error("Supabase Create Order Error:", orderError);
      return { success: false, error: orderError.message };
    }

    // 2. Log stock movement for the order
    const movementCode = `MV-${Math.floor(9000 + Math.random() * 999)}`;
    await supabase.from("stock_logs").insert({
      movement_code: movementCode,
      product_name: input.productName,
      product_sku: "SKU-AUTO",
      type: "Order Deduction",
      quantity_shift: -input.quantity,
      reference_note: `Order ${orderNumber}`,
      actor_name: "Sales Rep",
      balance_after: 0,
    });

    // 3. Log audit event
    const logCode = `LOG-${Math.floor(88000 + Math.random() * 999)}`;
    await supabase.from("audit_logs").insert({
      log_code: logCode,
      actor_name: "Sales Rep",
      action: "CREATE_ORDER",
      description: `Sales Rep created Order ${orderNumber} ($${totalAmount.toFixed(2)}) for ${input.customerName}`,
      module: "Sales & Orders",
      level: "INFO",
    });

    return { success: true, order: orderData };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

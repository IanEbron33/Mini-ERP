"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CreateOrderInput {
  customerName: string;
  productId?: string;
  productName: string;
  productSku?: string;
  quantity: number;
  paymentMethod: string;
  unitPrice: number;
  actorName?: string;
}

export async function fetchOrdersAction() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*, products(*))")
      .order("created_at", { ascending: false });

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
    const adminSupabase = createAdminClient();

    const orderNumber = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalAmount = input.quantity * input.unitPrice;
    const actorName = input.actorName || "Sales Representative";

    // 1. If productId is provided, verify current stock and deduct from products table
    let finalProductId = input.productId;
    let finalSku = input.productSku || "SKU-AUTO";
    let balanceAfter = 0;

    if (finalProductId) {
      const { data: product, error: prodErr } = await supabase
        .from("products")
        .select("id, name, sku, stock_quantity, reorder_level")
        .eq("id", finalProductId)
        .single();

      if (prodErr || !product) {
        return { success: false, error: "Selected product not found in catalog." };
      }

      if (product.stock_quantity < input.quantity) {
        return {
          success: false,
          error: `Insufficient stock! Only ${product.stock_quantity} units available for ${product.name}.`,
        };
      }

      finalSku = product.sku;
      const newStock = Math.max(0, product.stock_quantity - input.quantity);
      balanceAfter = newStock;
      const newStatus = newStock === 0 ? "Out of Stock" : newStock <= product.reorder_level ? "Low Stock" : "In Stock";

      // Decrement stock in products
      await adminSupabase
        .from("products")
        .update({
          stock_quantity: newStock,
          status: newStatus,
        })
        .eq("id", finalProductId);
    } else {
      // Find product by name fallback
      const { data: matchedProd } = await supabase
        .from("products")
        .select("id, name, sku, stock_quantity, reorder_level")
        .ilike("name", `%${input.productName}%`)
        .limit(1)
        .maybeSingle();

      if (matchedProd) {
        finalProductId = matchedProd.id;
        finalSku = matchedProd.sku;
        const newStock = Math.max(0, matchedProd.stock_quantity - input.quantity);
        balanceAfter = newStock;
        const newStatus = newStock === 0 ? "Out of Stock" : newStock <= matchedProd.reorder_level ? "Low Stock" : "In Stock";

        await adminSupabase
          .from("products")
          .update({
            stock_quantity: newStock,
            status: newStatus,
          })
          .eq("id", matchedProd.id);
      }
    }

    // 2. Create order record in orders table
    const { data: orderData, error: orderError } = await adminSupabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: input.customerName,
        item_count: input.quantity,
        total_amount: totalAmount,
        payment_method: input.paymentMethod,
        status: "Pending",
      })
      .select()
      .single();

    if (orderError || !orderData) {
      console.error("Supabase Create Order Error:", orderError);
      return { success: false, error: orderError?.message || "Failed to save order record." };
    }

    // 3. Create order_items entry if product id is known
    if (finalProductId) {
      await adminSupabase.from("order_items").insert({
        order_id: orderData.id,
        product_id: finalProductId,
        quantity: input.quantity,
        unit_price: input.unitPrice,
      });
    }

    // 4. Log stock movement for the order deduction
    const movementCode = `MV-${Math.floor(9000 + Math.random() * 999)}`;
    await adminSupabase.from("stock_logs").insert({
      movement_code: movementCode,
      product_id: finalProductId || null,
      product_name: input.productName,
      product_sku: finalSku,
      type: "Order Deduction",
      quantity_shift: -input.quantity,
      reference_note: `Sales Order ${orderNumber} for ${input.customerName}`,
      actor_name: actorName,
      balance_after: balanceAfter,
    });

    // 5. Log structured audit event
    const logCode = `LOG-${Math.floor(88000 + Math.random() * 999)}`;
    await adminSupabase.from("audit_logs").insert({
      log_code: logCode,
      actor_name: actorName,
      action: "CREATE_ORDER",
      description: `${actorName} placed Order ${orderNumber} ($${totalAmount.toFixed(2)}) for ${input.customerName} (${input.quantity}x ${input.productName})`,
      module: "Sales & Orders",
      level: "INFO",
    });

    return { success: true, order: orderData };
  } catch (err: any) {
    console.error("Create Order Exception:", err);
    return { success: false, error: err.message || "Failed to create sales order." };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: "Pending" | "Fulfilled" | "Cancelled",
  actorName: string = "Staff Member"
) {
  try {
    const adminSupabase = createAdminClient();

    // Fetch existing order to inspect previous status and items
    const { data: existingOrder, error: fetchErr } = await adminSupabase
      .from("orders")
      .select("*, order_items(*, products(*))")
      .eq("id", orderId)
      .single();

    if (fetchErr || !existingOrder) {
      return { success: false, error: "Order not found." };
    }

    const prevStatus = existingOrder.status;

    // Update status in orders table
    const { error: updateErr } = await adminSupabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // If order was cancelled and wasn't previously cancelled, restore stock
    if (newStatus === "Cancelled" && prevStatus !== "Cancelled") {
      const orderItems = existingOrder.order_items || [];
      for (const item of orderItems) {
        if (item.product_id && item.products) {
          const restoredStock = (item.products.stock_quantity || 0) + item.quantity;
          const reorderLvl = item.products.reorder_level || 10;
          const restoredStatus = restoredStock === 0 ? "Out of Stock" : restoredStock <= reorderLvl ? "Low Stock" : "In Stock";

          await adminSupabase
            .from("products")
            .update({
              stock_quantity: restoredStock,
              status: restoredStatus,
            })
            .eq("id", item.product_id);

          await adminSupabase.from("stock_logs").insert({
            movement_code: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
            product_id: item.product_id,
            product_name: item.products.name,
            product_sku: item.products.sku,
            type: "Supplier Addition",
            quantity_shift: item.quantity,
            reference_note: `Restocked from cancelled order ${existingOrder.order_number}`,
            actor_name: actorName,
            balance_after: restoredStock,
          });
        }
      }
    }

    // Insert audit log
    const logCode = `LOG-${Math.floor(88000 + Math.random() * 999)}`;
    await adminSupabase.from("audit_logs").insert({
      log_code: logCode,
      actor_name: actorName,
      action: "UPDATE_ORDER_STATUS",
      description: `${actorName} updated Order ${existingOrder.order_number} status from ${prevStatus} to ${newStatus}`,
      module: "Sales & Orders",
      level: newStatus === "Cancelled" ? "WARNING" : "INFO",
    });

    return { success: true, message: `Order status updated to ${newStatus}.` };
  } catch (err: any) {
    console.error("Update Order Status Error:", err);
    return { success: false, error: err.message || "Failed to update order status." };
  }
}

export async function deleteOrderAction(orderId: string, actorName: string = "Staff Admin") {
  try {
    const adminSupabase = createAdminClient();

    const { data: order } = await adminSupabase
      .from("orders")
      .select("order_number")
      .eq("id", orderId)
      .single();

    await adminSupabase.from("order_items").delete().eq("order_id", orderId);
    const { error } = await adminSupabase.from("orders").delete().eq("id", orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log audit
    const logCode = `LOG-${Math.floor(88000 + Math.random() * 999)}`;
    await adminSupabase.from("audit_logs").insert({
      log_code: logCode,
      actor_name: actorName,
      action: "DELETE_ORDER",
      description: `${actorName} deleted Order ${order?.order_number || orderId}`,
      module: "Sales & Orders",
      level: "WARNING",
    });

    return { success: true, message: "Order deleted successfully." };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete order." };
  }
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CreateProductInput {
  name: string;
  category: string;
  sku: string;
  stockQuantity: number;
  reorderLevel: number;
  retailPrice: number;
  wholesalePrice: number;
  imageUrl?: string;
}

export async function uploadProductImageAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No image file provided." };
    }

    const supabase = await createClient();
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Attempt upload to Supabase Storage bucket 'product-images'
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(filePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (!error && data) {
      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      return {
        success: true,
        url: publicUrlData.publicUrl,
        storageType: "supabase_bucket",
      };
    }

    // Fallback to Base64 Data URL if bucket upload returns error or doesn't exist yet
    console.warn("Supabase Storage bucket upload fallback:", error?.message);
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";
    const base64Url = `data:${mimeType};base64,${base64Data}`;

    return {
      success: true,
      url: base64Url,
      storageType: "base64_fallback",
    };
  } catch (err: any) {
    console.error("Upload Product Image Error:", err);
    return { success: false, error: err.message };
  }
}

export async function fetchProductsAction() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });

    if (error || !data) {
      return { success: false, data: [] };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function createProductAction(input: CreateProductInput) {
  try {
    const supabase = await createClient();

    const productCode = `PRD-${Math.floor(100 + Math.random() * 900)}`;
    const status = input.stockQuantity === 0 ? "Out of Stock" : input.stockQuantity <= input.reorderLevel ? "Low Stock" : "In Stock";

    const { data, error } = await supabase.from("products").insert({
      product_code: productCode,
      name: input.name,
      category: input.category,
      sku: input.sku,
      stock_quantity: input.stockQuantity,
      reorder_level: input.reorderLevel,
      retail_price: input.retailPrice,
      wholesale_price: input.wholesalePrice,
      status,
      image_url: input.imageUrl || "product_img.jpg",
    }).select().single();

    if (error) {
      console.error("Supabase Create Product Error:", error);
      return { success: false, error: error.message };
    }

    // Auto-create initial stock movement log
    if (data && input.stockQuantity > 0) {
      const adminSupabase = createAdminClient();
      await adminSupabase.from("stock_logs").insert({
        movement_code: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        product_id: data.id,
        product_name: input.name,
        product_sku: input.sku,
        type: "Supplier Addition",
        quantity_shift: input.stockQuantity,
        reference_note: "Initial product stock onboarding",
        actor_name: "Staff Admin",
        balance_after: input.stockQuantity,
      });
    }

    return { success: true, product: data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface UpdateProductInput {
  productId: string;
  name: string;
  category: string;
  sku: string;
  reorderLevel: number;
  retailPrice: number;
  wholesalePrice: number;
  imageUrl?: string;
}

export async function updateProductAction(input: UpdateProductInput) {
  try {
    const supabase = await createClient();

    // Fetch current product to check stock status vs new reorder level
    const { data: currentProd } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", input.productId)
      .single();

    const stock = currentProd?.stock_quantity ?? 0;
    const status = stock === 0 ? "Out of Stock" : stock <= input.reorderLevel ? "Low Stock" : "In Stock";

    const { error } = await supabase
      .from("products")
      .update({
        name: input.name,
        category: input.category,
        sku: input.sku,
        reorder_level: input.reorderLevel,
        retail_price: input.retailPrice,
        wholesale_price: input.wholesalePrice,
        status,
        image_url: input.imageUrl || "product_img.jpg",
      })
      .eq("id", input.productId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: "Product SKU updated successfully." };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update product." };
  }
}

export interface AdjustStockInput {
  productId: string;
  productName: string;
  productSku: string;
  currentStock: number;
  shiftAmount: number; // positive for addition/restock, negative for deduction/loss
  reason: string;
  actorName?: string;
  type?: "Addition" | "Deduction" | "Adjustment" | "Initial";
}

export async function adjustStockAction(input: AdjustStockInput) {
  try {
    const supabase = await createClient();

    const newStock = Math.max(0, input.currentStock + input.shiftAmount);

    // Get product reorder level to recalculate status
    const { data: prod } = await supabase
      .from("products")
      .select("reorder_level")
      .eq("id", input.productId)
      .single();

    const reorderLvl = prod?.reorder_level ?? 10;
    const status = newStock === 0 ? "Out of Stock" : newStock <= reorderLvl ? "Low Stock" : "In Stock";

    const adminSupabase = createAdminClient();

    // 1. Update product table stock quantity & status
    const { error: prodError } = await adminSupabase
      .from("products")
      .update({
        stock_quantity: newStock,
        status,
      })
      .eq("id", input.productId);

    if (prodError) {
      return { success: false, error: prodError.message };
    }

    // 2. Insert audit log into public.stock_logs with valid Postgres enum stock_movement_type
    const movementType: "Supplier Addition" | "Order Deduction" =
      input.shiftAmount >= 0 ? "Supplier Addition" : "Order Deduction";
    const logCode = `LOG-${Math.floor(1000 + Math.random() * 9000)}`;

    const { error: logError } = await adminSupabase.from("stock_logs").insert({
      movement_code: logCode,
      product_id: input.productId,
      product_name: input.productName,
      product_sku: input.productSku,
      type: movementType,
      quantity_shift: input.shiftAmount,
      reference_note: input.reason || (input.shiftAmount >= 0 ? "Supplier Restock Inflow" : "Stock Adjustment Deduction"),
      actor_name: input.actorName || "Inventory Manager",
      balance_after: newStock,
    });

    if (logError) {
      console.error("stock_logs insert error:", logError);
    }

    return {
      success: true,
      newStock,
      newStatus: status,
      message: `Stock updated: ${input.productName} is now at ${newStock} units (${status}).`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to adjust stock." };
  }
}

export async function deleteProductAction(productId: string) {
  try {
    const adminSupabase = createAdminClient();

    // 1. Delete associated stock logs to prevent foreign key constraint violations
    await adminSupabase.from("stock_logs").delete().eq("product_id", productId);

    // 2. Delete associated order items to prevent foreign key constraint violations
    await adminSupabase.from("order_items").delete().eq("product_id", productId);

    // 3. Delete product from products table by id or product_code
    const { data, error } = await adminSupabase
      .from("products")
      .delete()
      .or(`id.eq.${productId},product_code.eq.${productId}`)
      .select();

    if (error) {
      console.error("Supabase Admin Delete Error:", error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: "Product record not found in database." };
    }

    return { success: true, message: "Product SKU deleted successfully." };
  } catch (err: any) {
    console.error("Delete Product Exception:", err);
    return { success: false, error: err.message || "Failed to delete product." };
  }
}

export async function fetchStockLogsAction() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stock_logs")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error || !data) {
      return { success: false, data: [] };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}


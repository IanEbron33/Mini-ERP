"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Filter, Plus, Package, AlertTriangle, Image as ImageIcon, X, Check, Edit2, Upload, PlusCircle, MinusCircle, Trash2, ArrowUpDown, Loader2, AlertCircle, LayoutList, LayoutGrid, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import {
  fetchProductsAction,
  createProductAction,
  updateProductAction,
  adjustStockAction,
  deleteProductAction,
  uploadProductImageAction,
} from "@/app/actions/products";
import { useSwrData, invalidateCache } from "@/lib/cache/swr-cache";

const initialCatalog = [
  {
    id: "PRD-101",
    name: "Handcrafted Ceramic Vase",
    category: "Home Decor",
    sku: "HD-VASE-001",
    stock: 45,
    reorderLevel: 10,
    retailPrice: "₱48.00",
    wholesalePrice: "₱32.00",
    status: "In Stock",
    image: "ceramic_vase.jpg",
  },
  {
    id: "PRD-102",
    name: "Minimalist Walnut Table Lamp",
    category: "Lighting",
    sku: "LT-LAMP-088",
    stock: 6,
    reorderLevel: 10,
    retailPrice: "₱125.00",
    wholesalePrice: "₱85.00",
    status: "Low Stock",
    image: "walnut_lamp.jpg",
  },
  {
    id: "PRD-103",
    name: "Stainless Steel Espresso Tamper",
    category: "Kitchenware",
    sku: "KW-ESPR-002",
    stock: 120,
    reorderLevel: 25,
    retailPrice: "₱34.50",
    wholesalePrice: "₱22.00",
    status: "In Stock",
    image: "espresso_tamper.jpg",
  },
  {
    id: "PRD-104",
    name: "Linen Textured Cushion Covers",
    category: "Home Decor",
    sku: "HD-CUSH-014",
    stock: 3,
    reorderLevel: 15,
    retailPrice: "₱28.00",
    wholesalePrice: "₱18.00",
    status: "Low Stock",
    image: "cushion_cover.jpg",
  },
  {
    id: "PRD-105",
    name: "Japanese Teak Pour-Over Stand",
    category: "Kitchenware",
    sku: "KW-TEAK-009",
    stock: 0,
    reorderLevel: 5,
    retailPrice: "₱89.00",
    wholesalePrice: "₱58.00",
    status: "Out of Stock",
    image: "teak_stand.jpg",
  },
  {
    id: "PRD-106",
    name: "Organic Cotton Throw Blanket",
    category: "Home Decor",
    sku: "HD-BLNK-032",
    stock: 84,
    reorderLevel: 20,
    retailPrice: "₱64.00",
    wholesalePrice: "₱42.00",
    status: "In Stock",
    image: "cotton_blanket.jpg",
  },
];

function ProductsCatalogContent() {
  const searchParams = useSearchParams();
  const filterQuery = searchParams.get("filter");

  const {
    data: rawDbProducts,
    isLoading: isLoadingData,
    isRevalidating,
    refresh: loadDbProducts,
  } = useSwrData<any[]>("catalog_products", fetchProductsAction);

  const [catalog, setCatalog] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTabFilter, setActiveTabFilter] = useState(filterQuery === "low_stock" ? "low_stock" : "all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add Product Form State
  const [prodName, setProdName] = useState("");
  const [skuCode, setSkuCode] = useState("");
  const [category, setCategory] = useState("Home Decor");
  const [stockCount, setStockCount] = useState("0");
  const [reorderLvl, setReorderLvl] = useState("10");
  const [retailPrice, setRetailPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Action & Modal States
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<any | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Form State
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("Home Decor");
  const [editSku, setEditSku] = useState("");
  const [editReorderLvl, setEditReorderLvl] = useState("10");
  const [editRetailPrice, setEditRetailPrice] = useState("");
  const [editWholesalePrice, setEditWholesalePrice] = useState("");
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState("");
  const [editIsUploadingImage, setEditIsUploadingImage] = useState(false);

  const handleImageFileSelect = async (file: File | undefined, isEdit = false) => {
    if (!file) return;
    if (isEdit) {
      setEditIsUploadingImage(true);
    } else {
      setIsUploadingImage(true);
      setImageFileName(file.name);
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadProductImageAction(formData);

    if (res.success && res.url) {
      if (isEdit) {
        setEditImagePreviewUrl(res.url);
      } else {
        setImagePreviewUrl(res.url);
      }
      toast.success("Product image uploaded successfully!");
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isEdit) {
          setEditImagePreviewUrl(result);
        } else {
          setImagePreviewUrl(result);
        }
        toast.success("Product image ready for upload.");
      };
      reader.readAsDataURL(file);
    }

    if (isEdit) {
      setEditIsUploadingImage(false);
    } else {
      setIsUploadingImage(false);
    }
  };

  // Quick Stock Shift State
  const [shiftQuantity, setShiftQuantity] = useState<string>("0");
  const [shiftDirection, setShiftDirection] = useState<"add" | "deduct">("add");
  const [shiftReason, setShiftReason] = useState("Supplier Restock Shipment");

  useEffect(() => {
    if (filterQuery === "low_stock") {
      setActiveTabFilter("low_stock");
    }
  }, [filterQuery]);

  useEffect(() => {
    if (rawDbProducts && Array.isArray(rawDbProducts)) {
      const mapped = rawDbProducts.map((p: any) => ({
        id: p.product_code || `PRD-${p.id.slice(0, 4)}`,
        dbId: p.id,
        name: p.name,
        category: p.category,
        sku: p.sku,
        stock: p.stock_quantity,
        reorderLevel: p.reorder_level,
        retailPrice: `₱${Number(p.retail_price).toFixed(2)}`,
        wholesalePrice: `₱${Number(p.wholesale_price).toFixed(2)}`,
        status: p.status,
        image: p.image_url || "product_img.jpg",
      }));
      setCatalog(mapped);
    }
  }, [rawDbProducts]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !skuCode) return;

    setActionLoading(true);
    const finalImg = imagePreviewUrl || imageFileName || "product_img.jpg";

    const res = await createProductAction({
      name: prodName,
      category,
      sku: skuCode,
      stockQuantity: Number(stockCount) || 0,
      reorderLevel: Number(reorderLvl) || 10,
      retailPrice: parseFloat(retailPrice) || 0,
      wholesalePrice: parseFloat(wholesalePrice) || 0,
      imageUrl: finalImg,
    });

    setActionLoading(false);

    if (res.success && res.product) {
      const p = res.product;
      const newProd = {
        id: p.product_code || `PRD-${p.id.slice(0, 4)}`,
        dbId: p.id,
        name: p.name,
        category: p.category,
        sku: p.sku,
        stock: p.stock_quantity,
        reorderLevel: p.reorder_level,
        retailPrice: `₱${Number(p.retail_price).toFixed(2)}`,
        wholesalePrice: `₱${Number(p.wholesale_price).toFixed(2)}`,
        status: p.status,
        image: p.image_url || "product_img.jpg",
      };

      setCatalog([newProd, ...catalog]);
      toast.success(`Product SKU "${prodName}" added successfully to catalog!`);
      setFeedback({ type: "success", message: `Product ${prodName} added to catalog!` });
      setIsModalOpen(false);
      setProdName("");
      setSkuCode("");
      setStockCount("0");
      setReorderLvl("10");
      setRetailPrice("");
      setWholesalePrice("");
      setImageFileName("");
      setImagePreviewUrl("");
      invalidateCache(["catalog_products", "admin_sales_data", "admin_dashboard_metrics", "admin_finance_ledger", "sales_portal_data"]);
      await loadDbProducts();
    } else {
      toast.error(res.error || "Failed to add product SKU.");
      setFeedback({ type: "error", message: res.error || "Failed to add product." });
    }
  };

  const handleStartEdit = (product: any) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditCategory(product.category);
    setEditSku(product.sku);
    setEditReorderLvl(String(product.reorderLevel));
    setEditRetailPrice(product.retailPrice.replace("₱", "").replace("$", ""));
    setEditWholesalePrice(product.wholesalePrice.replace("₱", "").replace("$", ""));
    setEditImagePreviewUrl(product.image || "");
  };

  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setActionLoading(true);

    const res = await updateProductAction({
      productId: editingProduct.dbId || editingProduct.id,
      name: editName,
      category: editCategory,
      sku: editSku,
      reorderLevel: Number(editReorderLvl),
      retailPrice: parseFloat(editRetailPrice),
      wholesalePrice: parseFloat(editWholesalePrice),
      imageUrl: editImagePreviewUrl || editingProduct.image,
    });

    setActionLoading(false);

    if (res.success) {
      setCatalog(
        catalog.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: editName,
                category: editCategory,
                sku: editSku,
                reorderLevel: Number(editReorderLvl),
                retailPrice: `₱${parseFloat(editRetailPrice).toFixed(2)}`,
                wholesalePrice: `₱${parseFloat(editWholesalePrice).toFixed(2)}`,
                image: editImagePreviewUrl || p.image,
              }
            : p
        )
      );
      toast.success(`Product SKU "${editName}" updated successfully.`);
      setFeedback({ type: "success", message: res.message || "Product SKU updated successfully." });
      setEditingProduct(null);
      invalidateCache(["catalog_products", "admin_sales_data", "admin_dashboard_metrics", "admin_finance_ledger", "sales_portal_data"]);
      await loadDbProducts();
    } else {
      toast.error(res.error || "Failed to update product SKU.");
      setFeedback({ type: "error", message: res.error || "Failed to update product." });
    }
  };

  const handleAdjustStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    setActionLoading(true);

    const parsedQty = Math.abs(Number(shiftQuantity)) || 0;
    const shiftAmount = shiftDirection === "add" ? parsedQty : -parsedQty;

    const res = await adjustStockAction({
      productId: adjustingProduct.dbId || adjustingProduct.id,
      productName: adjustingProduct.name,
      productSku: adjustingProduct.sku,
      currentStock: adjustingProduct.stock,
      shiftAmount,
      reason: shiftReason,
      actorName: "Inventory Manager",
    });

    setActionLoading(false);

    if (res.success) {
      const newStock = res.newStock ?? Math.max(0, adjustingProduct.stock + shiftAmount);
      const newStatus = res.newStatus ?? (newStock === 0 ? "Out of Stock" : newStock <= adjustingProduct.reorderLevel ? "Low Stock" : "In Stock");

      setCatalog(
        catalog.map((p) =>
          p.id === adjustingProduct.id
            ? { ...p, stock: newStock, status: newStatus }
            : p
        )
      );

      toast.success(`Stock level for "${adjustingProduct.name}" updated to ${newStock} units.`);
      setFeedback({ type: "success", message: res.message || `Stock for ${adjustingProduct.name} updated to ${newStock} units.` });
      setAdjustingProduct(null);
      invalidateCache(["catalog_products", "admin_sales_data", "admin_dashboard_metrics", "admin_finance_ledger", "sales_portal_data"]);
      await loadDbProducts();
    } else {
      toast.error(res.error || "Failed to adjust stock.");
      setFeedback({ type: "error", message: res.error || "Failed to adjust stock." });
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    setActionLoading(true);

    const targetId = deletingProduct.dbId || deletingProduct.id;
    const res = await deleteProductAction(targetId);
    setActionLoading(false);

    if (res.success) {
      setCatalog(catalog.filter((p) => p.id !== deletingProduct.id && p.dbId !== deletingProduct.dbId));
      toast.success(`Product SKU "${deletingProduct.sku}" permanently deleted.`);
      setFeedback({ type: "success", message: res.message || "Product SKU deleted successfully." });
      setDeletingProduct(null);
      invalidateCache(["catalog_products", "admin_sales_data", "admin_dashboard_metrics", "admin_finance_ledger", "sales_portal_data"]);
      await loadDbProducts();
    } else {
      toast.error(res.error || "Failed to delete product SKU.");
      setFeedback({ type: "error", message: res.error || "Failed to delete product SKU." });
    }
  };

  const filteredCatalog = catalog.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTabFilter === "low_stock") {
      return product.stock <= product.reorderLevel;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between animate-in fade-in slide-in-from-top-2 text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-700" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-700" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-stone-500 hover:text-stone-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white p-6">
        <CardContent className="p-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71]/50 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                Inventory Manager Portal
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-[#341100] tracking-tight">
              Products & Catalog
            </h1>
            <p className="text-xs font-normal text-[#7f5e35] mt-1">
              Primary workspace: Add new SKUs, edit stock counts, update categories, adjust unit pricing, and upload product images.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={loadDbProducts}
              disabled={isLoadingData || isRevalidating}
              variant="outline"
              size="sm"
              className="border-[#e8decf] bg-white text-[#713105] hover:bg-[#fff7e8] rounded-xl h-9 px-3 gap-1.5 font-semibold text-xs shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] gap-2 rounded-xl text-xs font-semibold px-4 py-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add New SKU / Product
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs Header */}
      <div className="flex items-center gap-2 border-b border-[#e8decf] pb-3">
        <Button
          variant="ghost"
          onClick={() => setActiveTabFilter("all")}
          className={`text-xs font-semibold rounded-xl px-4 py-2 ${
            activeTabFilter === "all"
              ? "bg-[#713105] text-[#fff7e8]"
              : "text-[#7f5e35] hover:bg-[#fff7e8]"
          }`}
        >
          All Catalog SKUs ({catalog.length})
        </Button>

        <Button
          variant="ghost"
          onClick={() => setActiveTabFilter("low_stock")}
          className={`text-xs font-semibold rounded-xl px-4 py-2 gap-1.5 ${
            activeTabFilter === "low_stock"
              ? "bg-[#713105] text-[#fff7e8]"
              : "text-amber-800 hover:bg-amber-50"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Low Stock & Restock Action ({catalog.filter((i) => i.stock <= i.reorderLevel).length})
        </Button>
      </div>

      {/* Product Catalog Data Table */}
      <Card className="border-[#e8decf] shadow-xs rounded-xl bg-white overflow-hidden">
        <CardHeader className="p-5 border-b border-[#e8decf] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle className="text-sm font-semibold text-[#4f351c]">
            {activeTabFilter === "low_stock"
              ? "Low Stock & Restock Action List"
              : "Complete Product Catalog Directory"}
          </CardTitle>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7f5e35]" />
              <Input
                placeholder="Filter by product name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-[#fff7e8] border-[#e8decf] text-xs text-[#341100] rounded-xl placeholder:text-[#7f5e35]/60"
              />
            </div>
            
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 border border-[#e8decf] rounded-xl p-1 bg-[#fff7e8]">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-[#713105] text-[#fff7e8] shadow-xs"
                    : "text-[#7f5e35] hover:text-[#341100]"
                }`}
                title="Table View"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#713105] text-[#fff7e8] shadow-xs"
                    : "text-[#7f5e35] hover:text-[#341100]"
                }`}
                title="Visual Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {viewMode === "grid" ? (
            <div className="p-5">
              {isLoadingData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-[#e8decf] p-4 space-y-3 animate-pulse">
                      <div className="w-full h-36 bg-[#e8decf]/60 rounded-xl" />
                      <div className="w-3/4 h-4 bg-[#e8decf]/70 rounded-md" />
                      <div className="w-1/2 h-3 bg-[#e8decf]/40 rounded-md" />
                      <div className="w-full h-10 bg-[#e8decf]/50 rounded-xl mt-4" />
                    </div>
                  ))}
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#7f5e35]">
                  <div className="max-w-xs mx-auto space-y-2">
                    <Package className="w-10 h-10 text-[#cfab71] mx-auto opacity-70" />
                    <p className="font-semibold text-sm text-[#341100]">No Product SKUs Found</p>
                    <p className="text-xs text-[#7f5e35]">
                      {searchTerm ? "No products match your search query." : "No product items registered yet."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredCatalog.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-[#e8decf] shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Product Image Header */}
                        <div className="relative h-40 bg-[#fff7e8] border-b border-[#e8decf] flex items-center justify-center overflow-hidden">
                          {product.image && (product.image.startsWith("data:") || product.image.startsWith("http")) ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-[#713105]">
                              <ImageIcon className="w-8 h-8 opacity-60 mb-1" />
                              <span className="text-[10px] text-[#7f5e35] font-semibold">{product.category}</span>
                            </div>
                          )}

                          {/* Status Badge Overlay */}
                          <div className="absolute top-2.5 right-2.5">
                            {product.status === "In Stock" && (
                              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                                In Stock
                              </Badge>
                            )}
                            {product.status === "Low Stock" && (
                              <Badge className="bg-amber-50 text-[#713105] border-amber-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                                Low Stock
                              </Badge>
                            )}
                            {product.status === "Out of Stock" && (
                              <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                                Out of Stock
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="p-4 space-y-2">
                          <h3 className="font-bold text-xs text-[#341100] line-clamp-2 h-8">{product.name}</h3>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-[#713105] font-semibold">{product.sku}</span>
                            <span className="text-[#7f5e35] bg-[#fff7e8] px-2 py-0.5 rounded-md border border-[#e8decf]">{product.category}</span>
                          </div>

                          <div className="pt-2 border-t border-[#e8decf]/60 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] text-[#7f5e35] block">Current Stock</span>
                              <span className="font-bold text-[#341100]">{product.stock} units</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#7f5e35] block">Retail Price</span>
                              <span className="font-bold text-[#713105]">{product.retailPrice}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-3 bg-[#fff7e8]/50 border-t border-[#e8decf] flex items-center justify-between gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(product)}
                          className="text-[#7f5e35] hover:text-[#341100] hover:bg-[#fcf3e3] gap-1 text-[11px] h-7 px-2 rounded-lg cursor-pointer flex-1 justify-center"
                        >
                          <Edit2 className="w-3 h-3 text-[#713105]" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAdjustingProduct(product);
                            setShiftQuantity("10");
                            setShiftDirection("add");
                            setShiftReason("Supplier Restock Shipment");
                          }}
                          className="border-[#e8decf] text-[#713105] hover:bg-[#fff7e8] gap-1 text-[11px] h-7 px-2 rounded-lg cursor-pointer font-semibold flex-1 justify-center"
                        >
                          <ArrowUpDown className="w-3 h-3 text-[#713105]" />
                          Adjust
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingProduct(product)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 rounded-lg cursor-pointer"
                          title="Delete Product SKU"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs text-[#341100]">
              <thead className="bg-[#fff7e8] border-b border-[#e8decf] text-[11px] uppercase tracking-wider text-[#7f5e35] font-semibold">
                <tr>
                  <th className="py-3 px-4">Image</th>
                  <th className="py-3 px-4">Product Info</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Retail Price</th>
                  <th className="py-3 px-4">Wholesale Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8decf]/60">
                {isLoadingData ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-4">
                        <div className="w-9 h-9 rounded-lg bg-[#e8decf]/60" />
                      </td>
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="w-36 h-3 bg-[#e8decf]/70 rounded-md" />
                        <div className="w-20 h-2.5 bg-[#e8decf]/40 rounded-md" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-24 h-3 bg-[#e8decf]/60 rounded-md" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-24 h-3 bg-[#e8decf]/60 rounded-md" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-16 h-3 bg-[#e8decf]/60 rounded-md" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-14 h-3 bg-[#e8decf]/60 rounded-md" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-14 h-3 bg-[#e8decf]/60 rounded-md" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-16 h-5 bg-[#e8decf]/60 rounded-full" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="w-16 h-6 bg-[#e8decf]/60 rounded-lg ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredCatalog.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-[#7f5e35]">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Package className="w-8 h-8 text-[#cfab71] mx-auto opacity-70" />
                        <p className="font-semibold text-[#341100]">No Product SKUs Found</p>
                        <p className="text-[11px] text-[#7f5e35]">
                          {searchTerm
                            ? "No products match your search query."
                            : "No product catalog items registered in the database yet."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCatalog.map((product) => (
                    <tr key={product.id} className="hover:bg-[#fcf3e3]/50 transition-colors">
                      <td className="py-3 px-4">
                        {product.image && (product.image.startsWith("data:") || product.image.startsWith("http")) ? (
                          <img src={product.image} alt={product.name} className="w-9 h-9 rounded-lg object-cover border border-[#e8decf]" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[#fff7e8] border border-[#e8decf] flex items-center justify-center text-[#713105]">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#341100]">
                        {product.name}
                        <div className="text-[10px] text-[#7f5e35] font-normal">{product.id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#7f5e35]">{product.category}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#4f351c]">{product.sku}</td>
                      <td className="py-3.5 px-4 font-semibold text-[#341100]">
                        {product.stock} units
                        <div className="text-[10px] text-[#7f5e35] font-normal">Reorder level: {product.reorderLevel}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#713105]">{product.retailPrice}</td>
                      <td className="py-3.5 px-4 text-[#7f5e35] font-medium">{product.wholesalePrice}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {product.status === "In Stock" && (
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 whitespace-nowrap">
                            In Stock
                          </Badge>
                        )}
                        {product.status === "Low Stock" && (
                          <Badge className="bg-amber-50 text-[#713105] border-amber-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 whitespace-nowrap">
                            Low Stock
                          </Badge>
                        )}
                        {product.status === "Out of Stock" && (
                          <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 whitespace-nowrap">
                            Out of Stock
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(product)}
                            className="text-[#7f5e35] hover:text-[#341100] hover:bg-[#fcf3e3] gap-1 text-xs h-8 px-2.5 rounded-lg cursor-pointer"
                            title="Edit SKU details"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#713105]" />
                            Edit SKU
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAdjustingProduct(product);
                              setShiftQuantity("10");
                              setShiftDirection("add");
                              setShiftReason("Supplier Restock Shipment");
                            }}
                            className="border-[#e8decf] text-[#713105] hover:bg-[#fff7e8] gap-1 text-xs h-8 px-2.5 rounded-lg cursor-pointer font-semibold"
                            title="Quick Stock Adjustment"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5 text-[#713105]" />
                            Adjust Stock
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingProduct(product)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 rounded-lg cursor-pointer"
                            title="Delete Product SKU"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add New SKU Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#e8decf] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#e8decf] flex items-center justify-between bg-[#fff7e8]">
              <h2 className="font-bold text-sm text-[#341100] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#713105]" />
                Add New SKU & Product Catalog Item
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#7f5e35] hover:text-[#341100]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-5 space-y-4 text-xs text-[#341100]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#4f351c] mb-1">Product Title *</label>
                  <Input
                    required
                    placeholder="e.g. Modern Brass Table Lamp"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4f351c] mb-1">SKU Code *</label>
                  <Input
                    required
                    placeholder="e.g. LT-LAMP-099"
                    value={skuCode}
                    onChange={(e) => setSkuCode(e.target.value)}
                    className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-[#4f351c] mb-1">Category</label>
                  <Select
                    value={category}
                    onValueChange={setCategory}
                    options={[
                      { value: "Home Decor", label: "Home Decor" },
                      { value: "Kitchenware", label: "Kitchenware" },
                      { value: "Lighting", label: "Lighting" },
                      { value: "Furniture", label: "Furniture" },
                      { value: "Office Supplies", label: "Office Supplies" },
                    ]}
                    size="sm"
                    placeholder="Select Category"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4f351c] mb-1">Initial Stock</label>
                  <Input
                    type="number"
                    placeholder="e.g. 25"
                    value={stockCount}
                    onChange={(e) => setStockCount(e.target.value)}
                    className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4f351c] mb-1">Reorder Level</label>
                  <Input
                    type="number"
                    placeholder="e.g. 10"
                    value={reorderLvl}
                    onChange={(e) => setReorderLvl(e.target.value)}
                    className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#4f351c] mb-1">Retail Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 49.99"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs font-bold text-[#713105] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4f351c] mb-1">Wholesale Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 30.00"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(e.target.value)}
                    className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#4f351c] mb-1">Upload Product Image</label>
                {isUploadingImage ? (
                  <div className="border border-dashed border-[#e8decf] bg-[#fff7e8]/60 rounded-xl p-4 text-center flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-5 h-5 text-[#713105] animate-spin" />
                    <span className="text-[11px] font-semibold text-[#713105]">Uploading image to storage...</span>
                  </div>
                ) : imagePreviewUrl ? (
                  <div className="relative border border-[#e8decf] bg-[#fff7e8] rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={imagePreviewUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-[#e8decf]" />
                      <div>
                        <p className="text-xs font-bold text-[#341100]">{imageFileName || "Selected Image"}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold">Image uploaded</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFileName("");
                        setImagePreviewUrl("");
                      }}
                      className="p-1 text-stone-500 hover:text-red-600 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border border-dashed border-[#e8decf] bg-[#fff7e8]/60 hover:bg-[#fff7e8] rounded-xl p-4 text-center flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-[#713105] mb-1" />
                    <span className="text-[11px] font-semibold text-[#713105]">Click here to select image file</span>
                    <span className="text-[10px] text-[#7f5e35] mt-0.5">Supports PNG, JPG, JPEG, WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileSelect(e.target.files?.[0], false)}
                    />
                  </label>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#e8decf]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-[#e8decf] text-[#7f5e35] text-xs rounded-xl"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] text-xs font-semibold rounded-xl px-4 py-2 cursor-pointer flex items-center justify-center min-w-32"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Save Product to Catalog
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit SKU Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#e8decf] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#e8decf] flex items-center justify-between bg-[#fff7e8]">
              <h2 className="font-bold text-sm text-[#341100] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#713105]" />
                Edit Product SKU Details
              </h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-[#7f5e35] hover:text-[#341100] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProductSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#4f351c] mb-1">Product Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs font-semibold text-[#341100]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#4f351c] mb-1">SKU Code</label>
                  <Input
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#4f351c] mb-1">Category</label>
                  <Select
                    value={editCategory}
                    onValueChange={setEditCategory}
                    options={[
                      { value: "Home Decor", label: "Home Decor" },
                      { value: "Lighting", label: "Lighting" },
                      { value: "Kitchenware", label: "Kitchenware" },
                      { value: "Furniture", label: "Furniture" },
                      { value: "Office Supplies", label: "Office Supplies" },
                    ]}
                    size="sm"
                    placeholder="Select Category"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#4f351c] mb-1">Reorder Level</label>
                  <Input
                    type="number"
                    value={editReorderLvl}
                    onChange={(e) => setEditReorderLvl(e.target.value)}
                    className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#4f351c] mb-1">Retail Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editRetailPrice}
                    onChange={(e) => setEditRetailPrice(e.target.value)}
                    className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs font-bold text-[#713105] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#4f351c] mb-1">Wholesale ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editWholesalePrice}
                    onChange={(e) => setEditWholesalePrice(e.target.value)}
                    className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#4f351c] mb-1">Product Image</label>
                {editIsUploadingImage ? (
                  <div className="border border-dashed border-[#e8decf] bg-[#fff7e8]/60 rounded-xl p-4 text-center flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-5 h-5 text-[#713105] animate-spin" />
                    <span className="text-[11px] font-semibold text-[#713105]">Uploading image to storage...</span>
                  </div>
                ) : editImagePreviewUrl ? (
                  <div className="relative border border-[#e8decf] bg-[#fff7e8] rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={editImagePreviewUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-[#e8decf]" />
                      <div>
                        <p className="text-xs font-bold text-[#341100]">Current Image</p>
                        <p className="text-[10px] text-emerald-700 font-semibold">Image loaded</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditImagePreviewUrl("")}
                      className="p-1 text-stone-500 hover:text-red-600 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border border-dashed border-[#e8decf] bg-[#fff7e8]/60 hover:bg-[#fff7e8] rounded-xl p-4 text-center flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-[#713105] mb-1" />
                    <span className="text-[11px] font-semibold text-[#713105]">Click to change image</span>
                    <span className="text-[10px] text-[#7f5e35] mt-0.5">Supports PNG, JPG, JPEG, WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileSelect(e.target.files?.[0], true)}
                    />
                  </label>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e8decf]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
                  className="border-[#e8decf] text-[#7f5e35] text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] text-xs font-semibold rounded-xl px-4 py-2 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                  Save SKU Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#e8decf] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#e8decf] flex items-center justify-between bg-[#fff7e8]">
              <h2 className="font-bold text-sm text-[#341100] flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-[#713105]" />
                Adjust Stock Level
              </h2>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="text-[#7f5e35] hover:text-[#341100] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustStockSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-[#fff7e8] border border-[#e8decf] rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#341100]">{adjustingProduct.name}</p>
                  <p className="text-[11px] font-mono text-[#7f5e35]">SKU: {adjustingProduct.sku}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#7f5e35]">Current Stock:</span>
                  <p className="text-sm font-bold text-[#713105]">{adjustingProduct.stock} units</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4f351c] mb-1.5">Movement Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShiftDirection("add")}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                      shiftDirection === "add"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-white border-[#e8decf] text-[#7f5e35]"
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    + Add / Restock
                  </button>
                  <button
                    type="button"
                    onClick={() => setShiftDirection("deduct")}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                      shiftDirection === "deduct"
                        ? "bg-red-50 border-red-300 text-red-800"
                        : "bg-white border-[#e8decf] text-[#7f5e35]"
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" />
                    - Deduct / Loss
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4f351c] mb-1">
                  Quantity ({shiftDirection === "add" ? "+" : "-"})
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 10"
                  value={shiftQuantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d+$/.test(val)) {
                      setShiftQuantity(val);
                    }
                  }}
                  className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs font-bold text-[#341100]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4f351c] mb-1">Reference Reason / Note</label>
                <Input
                  value={shiftReason}
                  onChange={(e) => setShiftReason(e.target.value)}
                  placeholder="e.g. Supplier Shipment #4021 or Inventory Audit adjustment"
                  className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e8decf]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAdjustingProduct(null)}
                  className="border-[#e8decf] text-[#7f5e35] text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] text-xs font-semibold rounded-xl px-4 py-2 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                  Confirm Stock Shift
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product SKU Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#e8decf] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#e8decf] flex items-center justify-between bg-red-50">
              <h2 className="font-bold text-sm text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Confirm SKU Deletion
              </h2>
              <button
                onClick={() => setDeletingProduct(null)}
                className="text-stone-500 hover:text-stone-800 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-[#341100]">
              <p>
                Are you sure you want to delete product SKU <strong className="text-red-700">{deletingProduct.name}</strong> ({deletingProduct.sku})?
              </p>
              <p className="text-[11px] text-[#7f5e35] bg-[#fff7e8] p-3 rounded-xl border border-[#e8decf]">
                This will permanently remove the product from the catalog database. Stock history logs will be retained.
              </p>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#e8decf]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingProduct(null)}
                  className="border-[#e8decf] text-[#7f5e35] text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmDeleteProduct}
                  className="bg-red-600 text-white hover:bg-red-700 text-xs font-semibold rounded-xl px-4 py-2 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Trash2 className="w-3.5 h-3.5 mr-1" />}
                  Delete Product SKU
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-semibold text-[#7f5e35]">
          Loading products catalog...
        </div>
      }
    >
      <ProductsCatalogContent />
    </Suspense>
  );
}

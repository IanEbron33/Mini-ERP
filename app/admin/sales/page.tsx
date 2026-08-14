"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  ShoppingCart,
  Clock,
  CheckCircle2,
  DollarSign,
  Download,
  X,
  Check,
  FileText,
  RefreshCw,
  Trash2,
  AlertCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchOrdersAction, createOrderAction, updateOrderStatusAction, deleteOrderAction } from "@/app/actions/orders";
import { fetchProductsAction } from "@/app/actions/products";
import { InvoiceModal, InvoiceOrderData } from "@/components/invoice-modal";
import { DeleteConfirmModal } from "@/components/delete-confirm-modal";
import { Select } from "@/components/ui/select";

export function AdminSalesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [deleteOrderNumber, setDeleteOrderNumber] = useState<string>("");
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  // Invoice Modal state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceOrderData | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // New Order Form state
  const [customerName, setCustomerName] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number | string>(1);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [pricingTier, setPricingTier] = useState<"retail" | "wholesale">("retail");

  const loadData = async () => {
    setIsLoading(true);
    const [ordersRes, prodsRes] = await Promise.all([
      fetchOrdersAction(),
      fetchProductsAction(),
    ]);

    if (ordersRes.success && Array.isArray(ordersRes.data)) {
      const mapped = ordersRes.data.map((o: any) => {
        const orderItems = o.order_items || [];
        const firstItem = orderItems[0];
        const firstProduct = firstItem?.products;

        return {
          id: o.order_number || `#ORD-${o.id.slice(0, 4)}`,
          rawId: o.id,
          customer: o.customer_name,
          date: new Date(o.order_date || o.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }),
          items: o.item_count,
          total: `$${Number(o.total_amount || 0).toFixed(2)}`,
          payment: o.payment_method,
          status: o.status,
          productName: firstProduct?.name || "Catalog Product Item",
          productSku: firstProduct?.sku || "SKU-AUTO",
          unitPrice: firstItem?.unit_price || 0,
          quantity: firstItem?.quantity || o.item_count,
          orderItems: orderItems.map((item: any) => ({
            productName: item.products?.name || "Catalog Product Item",
            sku: item.products?.sku || "SKU-AUTO",
            quantity: item.quantity,
            unitPrice: item.unit_price,
            total: item.quantity * item.unit_price,
          })),
        };
      });
      setOrders(mapped);
    } else {
      setOrders([]);
    }

    if (prodsRes.success && Array.isArray(prodsRes.data)) {
      setProducts(prodsRes.data);
      if (prodsRes.data.length > 0 && !selectedProductId) {
        setSelectedProductId(prodsRes.data[0].id);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentSelectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const retailUnitPrice = currentSelectedProduct ? Number(currentSelectedProduct.retail_price || 0) : 0;
  const wholesaleUnitPrice = currentSelectedProduct ? Number(currentSelectedProduct.wholesale_price || 0) : 0;
  const selectedUnitPrice = pricingTier === "wholesale" ? wholesaleUnitPrice : retailUnitPrice;

  const availableStock = currentSelectedProduct ? (currentSelectedProduct.stock_quantity ?? 0) : 0;
  const qtyNum = typeof quantity === "number" ? quantity : parseInt(quantity, 10) || 0;
  const calculatedTotal = (qtyNum * selectedUnitPrice).toFixed(2);
  const retailTotal = (qtyNum * retailUnitPrice).toFixed(2);
  const wholesaleTotal = (qtyNum * wholesaleUnitPrice).toFixed(2);

  const isStockOverlapped = availableStock > 0 && qtyNum > availableStock;
  const isInvalidQty = qtyNum <= 0 || isStockOverlapped;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Please enter a customer name.");
      return;
    }
    if (!currentSelectedProduct) {
      toast.error("Please select a product.");
      return;
    }
    if (availableStock <= 0) {
      toast.error(`"${currentSelectedProduct.name}" is out of stock!`);
      return;
    }

    const finalQty = typeof quantity === "number" ? quantity : parseInt(quantity, 10) || 0;
    if (finalQty <= 0) {
      toast.error("Please enter a valid quantity of at least 1.");
      return;
    }
    if (finalQty > availableStock) {
      toast.error(`Quantity (${finalQty}) exceeds warehouse stock (${availableStock} units).`);
      return;
    }

    setIsSubmitting(true);
    const res = await createOrderAction({
      customerName: customerName.trim(),
      productId: currentSelectedProduct.id,
      productName: `${currentSelectedProduct.name} (${pricingTier.toUpperCase()} TIER)`,
      productSku: currentSelectedProduct.sku,
      quantity: finalQty,
      unitPrice: selectedUnitPrice,
      paymentMethod,
      actorName: "Staff Admin",
    });

    if (res.success && res.order) {
      toast.success(`Order ${res.order.order_number} created successfully!`);
      setIsModalOpen(false);
      setCustomerName("");
      setQuantity(1);
      await loadData();
    } else {
      toast.error(res.error || "Failed to create order.");
    }
    setIsSubmitting(false);
  };

  const handleStatusChange = async (orderId: string, newStatus: "Pending" | "Fulfilled" | "Cancelled") => {
    const res = await updateOrderStatusAction(orderId, newStatus, "Staff Admin");
    if (res.success) {
      toast.success(res.message);
      setOrders((prev) =>
        prev.map((o) => (o.rawId === orderId ? { ...o, status: newStatus } : o))
      );
    } else {
      toast.error(res.error || "Failed to update order status.");
    }
  };

  const promptDeleteOrder = (orderId: string, orderNumber: string) => {
    setDeleteOrderId(orderId);
    setDeleteOrderNumber(orderNumber);
  };

  const handleExecuteDeleteOrder = async () => {
    if (!deleteOrderId) return;
    setIsDeletingOrder(true);
    const res = await deleteOrderAction(deleteOrderId, "Staff Admin");
    if (res.success) {
      toast.success(res.message);
      setOrders((prev) => prev.filter((o) => o.rawId !== deleteOrderId));
      setDeleteOrderId(null);
    } else {
      toast.error(res.error || "Failed to delete order.");
    }
    setIsDeletingOrder(false);
  };

  const openInvoiceModal = (order: any) => {
    setSelectedInvoice({
      id: order.id,
      customer: order.customer,
      date: order.date,
      items: order.items,
      total: order.total,
      payment: order.payment,
      status: order.status,
      issuedBy: "System Administrator",
      issuedRole: "Administrator Portal",
      productName: order.productName,
      productSku: order.productSku,
      unitPrice: order.unitPrice,
      quantity: order.quantity,
      orderItems: order.orderItems,
    });
    setIsInvoiceOpen(true);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.payment?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "All" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((acc, o) => acc + (parseFloat(o.total.replace(/[^0-9.-]+/g, "")) || 0), 0);

  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const completedCount = orders.filter((o) => o.status === "Fulfilled").length;
  const avgOrderVal = orders.length > 0 ? (totalRevenue / (orders.length || 1)).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="border-[#e8decf] shadow-xs rounded-2xl bg-white p-6">
        <CardContent className="p-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71]/50 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                Administrator Portal
              </Badge>
              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold">
                Live Sales Records
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-[#341100] tracking-tight">
              Sales Orders & Invoicing Management
            </h1>
            <p className="text-xs font-normal text-[#7f5e35] mt-1">
              Admin overview: Track company-wide sales transactions, update order fulfillment states, issue invoices, and manage client orders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              className="border-[#e8decf] text-[#4f351c] hover:bg-[#fff7e8] rounded-xl text-xs gap-1.5 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] gap-2 rounded-xl text-xs font-semibold px-4 py-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Create Order
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Total Sales Revenue</span>
            <DollarSign className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">
            ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Active revenue</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Pending Orders</span>
            <Clock className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#713105] mt-2">{pendingCount}</div>
          <span className="text-[11px] text-[#7f5e35] font-semibold">Awaiting fulfillment</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Completed Orders</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">{completedCount}</div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Fulfilled & settled</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Avg Order Value</span>
            <ShoppingCart className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">${avgOrderVal}</div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Per transaction</span>
        </Card>
      </div>

      {/* Orders Data Table */}
      <Card className="border-[#e8decf] shadow-xs rounded-xl bg-white overflow-hidden">
        <CardHeader className="p-5 border-b border-[#e8decf] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle className="text-sm font-semibold text-[#4f351c]">
            Recent Orders & Transaction History
          </CardTitle>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7f5e35]" />
              <Input
                placeholder="Search order ID or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-[#fff7e8] border-[#e8decf] text-xs text-[#341100] rounded-xl placeholder:text-[#7f5e35]/60"
              />
            </div>

            <div className="w-36">
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val)}
                options={[
                  { value: "All", label: "All Statuses" },
                  { value: "Pending", label: "Pending" },
                  { value: "Fulfilled", label: "Fulfilled" },
                  { value: "Cancelled", label: "Cancelled" },
                ]}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs text-[#341100]">
            <thead className="bg-[#fff7e8] border-b border-[#e8decf] text-[11px] uppercase tracking-wider text-[#7f5e35] font-semibold">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Units</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status & Action</th>
                <th className="py-3 px-4 text-right">Invoice & Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8decf]/60">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="w-20 h-3 bg-[#e8decf]/70 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-28 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3 bg-[#e8decf]/50 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-14 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-3 bg-[#e8decf]/70 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3 bg-[#e8decf]/60 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="w-24 h-5 bg-[#e8decf]/60 rounded-full" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-20 h-6 bg-[#e8decf]/60 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#7f5e35]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <ShoppingCart className="w-8 h-8 text-[#cfab71] mx-auto opacity-70" />
                      <p className="font-semibold text-[#341100]">No Orders Found</p>
                      <p className="text-[11px] text-[#7f5e35]">
                        {searchTerm
                          ? "No orders match your search query."
                          : "No orders recorded in the system yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.rawId || order.id} className="hover:bg-[#fcf3e3]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#713105]">
                      {order.id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#341100]">
                      {order.customer}
                    </td>
                    <td className="py-3.5 px-4 text-[#7f5e35]">{order.date}</td>
                    <td className="py-3.5 px-4 text-[#4f351c] font-medium">{order.items} units</td>
                    <td className="py-3.5 px-4 font-bold text-[#341100]">{order.total}</td>
                    <td className="py-3.5 px-4 text-[#7f5e35]">{order.payment}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {order.status === "Fulfilled" && (
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                            Fulfilled
                          </Badge>
                        )}
                        {order.status === "Pending" && (
                          <Badge className="bg-amber-50 text-[#713105] border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                            Pending
                          </Badge>
                        )}
                        {order.status === "Cancelled" && (
                          <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold uppercase tracking-wider">
                            Cancelled
                          </Badge>
                        )}

                        <div className="w-32">
                          <Select
                            size="sm"
                            value={order.status}
                            onValueChange={(val) =>
                              handleStatusChange(
                                order.rawId,
                                val as "Pending" | "Fulfilled" | "Cancelled"
                              )
                            }
                            options={[
                              { value: "Pending", label: "Set Pending" },
                              { value: "Fulfilled", label: "Set Fulfilled" },
                              { value: "Cancelled", label: "Cancel & Restock" },
                            ]}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openInvoiceModal(order)}
                          className="text-[#713105] hover:text-[#341100] hover:bg-[#fff7e8] gap-1 text-xs h-7 px-2 font-medium"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF Invoice
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => promptDeleteOrder(order.rawId, order.id)}
                          className="text-[#7f5e35] hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
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
        </CardContent>
      </Card>

      {/* Add New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-[#e8decf] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#e8decf] flex items-center justify-between bg-[#fff7e8]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#713105] flex items-center justify-center text-[#fff7e8] font-bold text-xs">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-[#341100]">
                    Create Order (Administrator)
                  </h2>
                  <p className="text-[10px] text-[#7f5e35]">
                    Real-time stock deduction from Supabase catalog
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#7f5e35] hover:text-[#341100] p-1 rounded-lg hover:bg-[#cfab71]/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4 text-xs text-[#341100]">
              <div>
                <label className="block font-semibold text-[#4f351c] mb-1">
                  Customer Full Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Acme Corporation / John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs h-9"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4f351c] mb-1">
                  Select Product *
                </label>
                <Select
                  value={selectedProductId}
                  onValueChange={(val) => setSelectedProductId(val)}
                  options={products.map((p) => ({
                    value: p.id,
                    label: `${p.name} (${p.sku})`,
                    sublabel: `Retail: $${Number(p.retail_price).toFixed(2)} | Wholesale: $${Number(p.wholesale_price).toFixed(2)} | Stock: ${p.stock_quantity ?? 0}`,
                  }))}
                  placeholder="Select product from catalog..."
                />
              </div>

              {currentSelectedProduct && (
                <div className="p-3.5 rounded-2xl bg-[#fff7e8]/70 border border-[#e8decf] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#7f5e35] uppercase font-bold tracking-wider block">
                        Warehouse Stock
                      </span>
                      <span className={`font-extrabold ${availableStock === 0 ? "text-red-700" : "text-[#713105]"}`}>
                        {availableStock} units available
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#7f5e35] uppercase font-bold tracking-wider block">
                        Pricing Tier Summary
                      </span>
                      <span className="text-[11px] font-semibold text-[#341100]">
                        Retail: ${retailUnitPrice.toFixed(2)} | Wholesale: ${wholesaleUnitPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Dual Pricing Preview Cards (Option C) */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPricingTier("retail")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        pricingTier === "retail"
                          ? "bg-white border-[#713105] ring-2 ring-[#713105]/20 shadow-xs"
                          : "bg-[#fff7e8]/40 border-[#e8decf] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-[#7f5e35]">
                          Retail Tier
                        </span>
                        {pricingTier === "retail" && (
                          <Badge className="bg-[#713105] text-[#fff7e8] text-[9px] px-1.5 py-0">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="font-bold text-[#341100] text-xs mt-0.5">
                        ${retailUnitPrice.toFixed(2)} <span className="text-[10px] text-[#7f5e35] font-normal">/ unit</span>
                      </div>
                      <div className="text-[10px] font-semibold text-[#713105] mt-1">
                        Total: ${retailTotal}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPricingTier("wholesale")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        pricingTier === "wholesale"
                          ? "bg-white border-[#713105] ring-2 ring-[#713105]/20 shadow-xs"
                          : "bg-[#fff7e8]/40 border-[#e8decf] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-[#7f5e35]">
                          Wholesale Tier
                        </span>
                        {pricingTier === "wholesale" && (
                          <Badge className="bg-[#713105] text-[#fff7e8] text-[9px] px-1.5 py-0">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="font-bold text-emerald-800 text-xs mt-0.5">
                        ${wholesaleUnitPrice.toFixed(2)} <span className="text-[10px] text-[#7f5e35] font-normal">/ unit</span>
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-800 mt-1">
                        Total: ${wholesaleTotal}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#4f351c] mb-1">
                    Quantity (Max {availableStock}) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={Math.max(1, availableStock)}
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setQuantity("");
                      } else {
                        const num = parseInt(val, 10);
                        setQuantity(isNaN(num) ? "" : num);
                      }
                    }}
                    onBlur={() => {
                      if (quantity === "" || Number(quantity) < 1) {
                        setQuantity(1);
                      }
                    }}
                    className={`rounded-xl text-xs h-9 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      isStockOverlapped
                        ? "bg-red-50 border-red-500 text-red-900 focus:ring-red-500 ring-2 ring-red-500/20 font-bold"
                        : "bg-[#fff7e8] border-[#e8decf] text-[#341100]"
                    }`}
                  />
                  {isStockOverlapped && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-red-700 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>Quantity ({qtyNum}) exceeds max available stock ({availableStock} units)</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-[#4f351c] mb-1">
                    Payment Method
                  </label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(val) => setPaymentMethod(val)}
                    options={[
                      { value: "Credit Card", label: "Credit Card" },
                      { value: "PayPal", label: "PayPal" },
                      { value: "Bank Transfer", label: "Bank Transfer" },
                      { value: "Cash on Delivery", label: "Cash on Delivery" },
                    ]}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#cfab71] flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#7f5e35] tracking-wider block">
                    Calculated Order Total ({pricingTier.toUpperCase()} TIER)
                  </span>
                  <div className="text-xl font-black text-[#713105] mt-0.5">
                    ${calculatedTotal}
                  </div>
                </div>
                <div className="text-right text-[11px] text-[#7f5e35]">
                  <span className="font-semibold text-[#341100] block">{qtyNum}x units</span>
                  <span>@ ${selectedUnitPrice.toFixed(2)} / unit</span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e8decf]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-[#e8decf] text-[#7f5e35] text-xs rounded-xl h-9"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting || availableStock <= 0 || isInvalidQty}
                  className={`text-xs font-semibold rounded-xl px-5 h-9 shadow-xs ${
                    isInvalidQty
                      ? "bg-stone-300 text-stone-500 cursor-not-allowed border border-stone-300 shadow-none"
                      : "bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c]"
                  }`}
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Save & Process Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={selectedInvoice}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteOrderId}
        onClose={() => setDeleteOrderId(null)}
        onConfirm={handleExecuteDeleteOrder}
        title="Delete Sales Order"
        itemName={deleteOrderNumber ? `Order ${deleteOrderNumber}` : "this order"}
        description="This action will permanently remove the order record from the system and cannot be undone."
        isDeleting={isDeletingOrder}
      />
    </div>
  );
}

export default AdminSalesPage;

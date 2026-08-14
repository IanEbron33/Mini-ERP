"use client";

import React, { useState } from "react";
import { X, Printer, Download, CheckCircle2, Clock, AlertCircle, Coffee, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

export interface InvoiceOrderItem {
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceOrderData {
  id: string; // e.g. #ORD-1042
  customer: string;
  date: string;
  items?: number;
  total: string | number;
  payment?: string;
  status?: string;
  issuedBy?: string;
  issuedRole?: string;
  productName?: string;
  productSku?: string;
  unitPrice?: number;
  quantity?: number;
  orderItems?: InvoiceOrderItem[];
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: InvoiceOrderData | null;
}

export function InvoiceModal({ isOpen, onClose, order }: InvoiceModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !order) return null;

  const rawTotal = typeof order.total === "string" 
    ? parseFloat(order.total.replace(/[^0-9.-]+/g, "")) || 0
    : order.total || 0;

  const taxRate = 0.15;
  const subtotal = rawTotal / (1 + taxRate);
  const taxAmount = rawTotal - subtotal;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const element = document.getElementById("printable-invoice-container");
      if (!element) {
        toast.error("Invoice element not found.");
        setIsDownloading(false);
        return;
      }

      // Generate high-resolution PNG using browser-native engine (100% compatible with Tailwind v4)
      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 8;
      const printWidth = pdfWidth - margin * 2;
      const printHeight = (imgProps.height * printWidth) / imgProps.width;

      pdf.addImage(dataUrl, "PNG", margin, margin, printWidth, printHeight);

      const cleanOrderId = order.id.replace(/[^a-zA-Z0-9_-]/g, "");
      pdf.save(`Invoice-${cleanOrderId}.pdf`);

      toast.success(`Invoice ${order.id} downloaded successfully!`);
    } catch (err: any) {
      console.error("Direct PDF download error:", err);
      toast.error("Falling back to print dialog.");
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const lineItems: InvoiceOrderItem[] = order.orderItems && order.orderItems.length > 0
    ? order.orderItems
    : [
        {
          productName: order.productName || "Catalog Product Item",
          sku: order.productSku || `SKU-${order.id.replace(/[^0-9]/g, "") || "901"}`,
          quantity: order.quantity || order.items || 1,
          unitPrice: order.unitPrice || rawTotal / (order.quantity || order.items || 1),
          total: rawTotal,
        },
      ];

  const issuedByName = order.issuedBy || "Sales Operations";
  const issuedRoleTitle = order.issuedRole || "Mini-ERP Staff";

  return (
    <>
      {/* Print Isolation Style Tag */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            body * {
              visibility: hidden !important;
            }
            #printable-invoice-container, #printable-invoice-container * {
              visibility: visible !important;
            }
            #printable-invoice-container {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              box-shadow: none !important;
              border: none !important;
              z-index: 999999 !important;
            }
            @page {
              size: portrait;
              margin: 8mm;
            }
          }
        `
      }} />

      <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl border border-[#e8decf] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
          {/* Top Actions Bar (Hidden on Print) */}
          <div className="p-4 bg-[#fff7e8] border-b border-[#e8decf] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#713105]" />
              <span className="text-xs font-bold text-[#341100] tracking-wide uppercase">
                Sales Order Invoice Preview
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                disabled={isDownloading}
                onClick={handleDownloadPDF}
                size="sm"
                className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] gap-1.5 text-xs rounded-xl px-3.5 py-1.5 h-8 font-semibold shadow-xs"
              >
                {isDownloading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {isDownloading ? "Generating PDF..." : "Save as PDF"}
              </Button>

              <Button
                type="button"
                disabled={isDownloading}
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="border-[#e8decf] bg-white text-[#713105] hover:bg-[#fff7e8] gap-1.5 text-xs rounded-xl px-3 py-1.5 h-8 font-semibold shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-[#7f5e35] hover:text-[#341100] hover:bg-[#cfab71]/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Printable Invoice Sheet */}
          <div className="p-8 space-y-8 bg-white" id="printable-invoice-container">
            {/* Header Branding & Status */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#e8decf]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#713105] flex items-center justify-center text-[#fff7e8] shadow-xs">
                    <Coffee className="w-4 h-4 text-[#fff7e8]" />
                  </div>
                  <h1 className="text-xl font-bold text-[#341100] tracking-tight">
                    Mini-ERP Systems
                  </h1>
                </div>
                <p className="text-[11px] text-[#7f5e35] mt-1">
                  Enterprise Commerce & Inventory Platform
                </p>
                <p className="text-[11px] text-[#7f5e35]/80">
                  100 Enterprise Way, Suite 400 • Commerce City
                </p>
              </div>

              <div className="sm:text-right">
                <div className="text-xs font-mono font-bold text-[#713105]">
                  {order.id}
                </div>
                <div className="text-2xl font-black text-[#341100] tracking-tight mt-0.5">
                  INVOICE
                </div>
                <div className="mt-1.5">
                  {order.status === "Fulfilled" && (
                    <span className="inline-flex items-center bg-[#ebf5ed] text-[#15803d] border border-[#c1e1c7] text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#15803d]" /> Paid & Fulfilled
                    </span>
                  )}
                  {order.status === "Pending" && (
                    <span className="inline-flex items-center bg-[#fdf0e6] text-[#713105] border border-[#f1d0b5] text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full gap-1">
                      <Clock className="w-3 h-3 text-[#713105]" /> Payment Pending
                    </span>
                  )}
                  {order.status === "Cancelled" && (
                    <span className="inline-flex items-center bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full gap-1">
                      <AlertCircle className="w-3 h-3 text-[#b91c1c]" /> Cancelled & Restocked
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Customer & Invoice Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-4 rounded-2xl bg-[#fff7e8]/60 border border-[#e8decf]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7f5e35] tracking-wider block mb-1">
                  Billed To
                </span>
                <div className="text-xs font-bold text-[#341100]">{order.customer}</div>
                <div className="text-[11px] text-[#7f5e35]">Verified Customer</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#7f5e35] tracking-wider block mb-1">
                  Date Issued
                </span>
                <div className="text-xs font-semibold text-[#341100]">{order.date}</div>
                <div className="text-[11px] text-[#7f5e35]">Due upon receipt</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#7f5e35] tracking-wider block mb-1">
                  Payment Method
                </span>
                <div className="text-xs font-semibold text-[#341100]">{order.payment || "Credit Card"}</div>
                <div className="text-[11px] text-[#15803d] font-medium">Standard Gateway</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#7f5e35] tracking-wider block mb-1">
                  Issued By
                </span>
                <div className="text-xs font-bold text-[#713105]">{issuedByName}</div>
                <div className="text-[11px] text-[#7f5e35] font-medium">{issuedRoleTitle}</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="rounded-xl border border-[#e8decf] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fff7e8] border-b border-[#e8decf] text-[10px] uppercase tracking-wider text-[#7f5e35] font-bold">
                  <tr>
                    <th className="py-3 px-4">Item Description & Catalog SKU</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Rate</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8decf]/60 text-[#341100]">
                  {lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3.5 px-4 font-medium">
                        <div className="text-xs font-bold text-[#341100]">{item.productName}</div>
                        <div className="text-[10px] text-[#7f5e35] font-mono mt-0.5">
                          SKU: {item.sku}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-[#4f351c]">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#7f5e35]">
                        ₱{Number(item.unitPrice || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#341100]">
                        ₱{Number(item.total || item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2">
              <div className="text-[11px] text-[#7f5e35] max-w-xs space-y-1">
                <div className="font-semibold text-[#4f351c]">Terms & Conditions:</div>
                <p>
                  Thank you for your business. For billing inquiries or invoice reconciliation, please contact support@minierp.com.
                </p>
              </div>

              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-[#7f5e35]">
                  <span>Subtotal (Net):</span>
                  <span className="font-medium text-[#341100]">₱{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#7f5e35]">
                  <span>Estimated Tax (15%):</span>
                  <span className="font-medium text-[#341100]">₱{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-b border-[#e8decf] font-bold text-sm text-[#341100]">
                  <span>Grand Total:</span>
                  <span className="text-[#713105] text-base">₱{rawTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-4 border-t border-[#e8decf] text-center text-[10px] text-[#7f5e35]">
              Mini-ERP Commercial Invoice • Generated securely via Supabase PostgreSQL Cloud
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default InvoiceModal;

"use client";

import React from "react";
import { Trash2, AlertCircle, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  itemName?: string;
  description?: string;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Order Record",
  itemName = "this order",
  description = "This action will permanently delete the transaction record and cannot be undone.",
  isDeleting = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl border border-[#e8decf] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-[#e8decf] flex items-center justify-between bg-[#fff7e8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-700 shadow-2xs">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#341100]">{title}</h2>
              <p className="text-[10px] text-[#7f5e35]">Irreversible system action</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-[#7f5e35] hover:text-[#341100] p-1 rounded-lg hover:bg-[#cfab71]/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs text-[#341100]">
          <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-red-900">
                Confirm deletion for {itemName}?
              </div>
              <p className="text-[11px] text-red-800 mt-0.5 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#e8decf]">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={onClose}
              className="border-[#e8decf] text-[#7f5e35] text-xs rounded-xl h-9 hover:bg-[#fff7e8]"
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-xl px-4 h-9 shadow-xs gap-1.5"
            >
              {isDeleting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              {isDeleting ? "Deleting..." : "Delete Record"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;

"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  size?: "default" | "sm";
  align?: "left" | "right";
  className?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select option...",
  disabled = false,
  size = "default",
  align = "left",
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
    openUpwards: boolean;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const isSmall = size === "sm";

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const minWidth = isSmall ? 150 : Math.max(rect.width, 180);
    const menuWidth = Math.max(rect.width, minWidth);

    // Calculate space below vs above to prevent clipping
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < 220 && rect.top > 220;

    let leftPos = rect.left;
    if (align === "right") {
      leftPos = rect.right - menuWidth;
    }

    // Ensure it doesn't overflow screen horizontal bounds
    if (leftPos + menuWidth > window.innerWidth - 12) {
      leftPos = window.innerWidth - menuWidth - 12;
    }
    if (leftPos < 12) {
      leftPos = 12;
    }

    setDropdownPosition({
      top: openUpwards ? rect.top - 6 : rect.bottom + 6,
      left: leftPos,
      width: menuWidth,
      openUpwards,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleScrollOrResize() {
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, align, isSmall]);

  return (
    <div className={`relative inline-block ${className || (isSmall ? "w-auto" : "w-full")}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full bg-[#fff7e8] border border-[#e8decf] rounded-xl text-[#341100] flex items-center justify-between gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#713105]/30 ${
          isSmall ? "h-7 px-2.5 text-[11px] font-medium" : "h-9 px-3 text-xs"
        } ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-white"
        } ${isOpen ? "ring-2 ring-[#713105]/40 border-[#713105] bg-white" : ""}`}
      >
        <span className="truncate font-medium text-left">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`transition-transform duration-200 shrink-0 ${
            isSmall ? "w-3 h-3 text-[#7f5e35]" : "w-3.5 h-3.5 text-[#7f5e35]"
          } ${isOpen ? "rotate-180 text-[#713105]" : ""}`}
        />
      </button>

      {/* Portal-Based Floating Dropdown Menu */}
      {isOpen &&
        mounted &&
        dropdownPosition &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              transform: dropdownPosition.openUpwards ? "translateY(-100%)" : "none",
              zIndex: 9999,
            }}
            className="bg-white border border-[#e8decf] rounded-2xl shadow-2xl max-h-56 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95"
          >
            {options.length === 0 ? (
              <div className="p-3 text-xs text-[#7f5e35] text-center">No options available</div>
            ) : (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                      if (!option.disabled) {
                        onValueChange(option.value);
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-colors ${
                      isSmall ? "text-[11px]" : "text-xs"
                    } ${
                      option.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : isSelected
                        ? "bg-[#fff7e8] text-[#713105] font-bold"
                        : "text-[#341100] hover:bg-[#fcf3e3]"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate">{option.label}</div>
                      {option.sublabel && (
                        <div className="text-[10px] text-[#7f5e35] font-normal truncate">
                          {option.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#713105] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

export default Select;

"use client";

import React, { useState } from "react";
import { Store, Home, Package, Receipt, Users, Settings } from "lucide-react";

export function SidebarRail() {
  const [activeTab, setActiveTab] = useState("home");

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "inventory", icon: Package, label: "Inventory" },
    { id: "sales", icon: Receipt, label: "Sales & Orders" },
    { id: "users", icon: Users, label: "User Management" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside className="w-16 border-r border-[#e8decf] bg-white flex flex-col items-center py-4 shrink-0 justify-between h-screen sticky top-0 z-20">
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Top Store Badge Icon in ESPRESSO */}
        <button className="w-10 h-10 rounded-lg bg-[#713105] text-[#fff7e8] flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95">
          <Store className="w-5 h-5" />
        </button>

        {/* Navigation Icon List */}
        <nav className="flex flex-col items-center gap-3 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-[#fcf3e3] text-[#713105] font-semibold border border-[#cfab71]/40"
                    : "text-[#7f5e35] hover:text-[#341100] hover:bg-[#fff7e8]"
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom status indicator */}
      <div className="w-2 h-2 rounded-full bg-[#cfab71] mb-2" title="System Online" />
    </aside>
  );
}

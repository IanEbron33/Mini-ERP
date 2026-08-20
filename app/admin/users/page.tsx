"use client";

import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Users,
  ShieldCheck,
  ShoppingBag,
  Package,
  Search,
  Filter,
  MoreHorizontal,
  X,
  Check,
  Key,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Edit,
  UserX,
  UserCheck,
  MailCheck,
  Trash2,
  Shield,
  AlertTriangle,
  Target,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  registerEmployeeAction,
  fetchProfilesAction,
  updateUserRoleAction,
  toggleUserStatusAction,
  sendPasswordResetAction,
  deleteEmployeeAction,
  updateUserQuotaAction,
} from "@/app/actions/users";

const initialMockUsers = [
  {
    id: "EMP-001",
    dbId: "db-001",
    name: "John Miller",
    email: "john.miller@minierp.com",
    role: "Sales",
    department: "Sales & Outbound",
    status: "Active",
    initials: "JM",
  },
  {
    id: "EMP-002",
    dbId: "db-002",
    name: "Jane Smith",
    email: "jane.smith@minierp.com",
    role: "Admin",
    department: "Executive Management",
    status: "Active",
    initials: "JS",
  },
  {
    id: "EMP-003",
    dbId: "db-003",
    name: "Robert Fox",
    email: "robert.fox@minierp.com",
    role: "Inventory",
    department: "Warehouse & Logistics",
    status: "Active",
    initials: "RF",
  },
  {
    id: "EMP-004",
    dbId: "db-004",
    name: "Alice Cooper",
    email: "alice.cooper@minierp.com",
    role: "Sales",
    department: "Sales & Outbound",
    status: "Active",
    initials: "AC",
  },
  {
    id: "EMP-005",
    dbId: "db-005",
    name: "David Chen",
    email: "david.chen@minierp.com",
    role: "Inventory",
    department: "Warehouse & Logistics",
    status: "Inactive",
    initials: "DC",
  },
];

export function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Dropdown & Action States
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newRoleSelection, setNewRoleSelection] = useState<"Admin" | "Sales" | "Inventory">("Sales");
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [quotaUser, setQuotaUser] = useState<any | null>(null);
  const [quotaInput, setQuotaInput] = useState<number | string>(20000);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter states
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"Admin" | "Sales" | "Inventory">("Sales");
  const [department, setDepartment] = useState("Sales & Outbound");

  // Load profiles from Supabase if connected
  useEffect(() => {
    async function loadProfiles() {
      setIsLoadingData(true);
      const res = await fetchProfilesAction();
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map((p: any) => ({
          id: p.employee_id || `EMP-${p.id.slice(0, 4)}`,
          dbId: p.id,
          name: p.full_name,
          email: p.email,
          role: p.role,
          department: p.department,
          status: p.status,
          initials: p.initials || p.full_name.slice(0, 2).toUpperCase(),
          monthlyQuota: Number(p.monthly_quota || 20000),
        }));
        setUsers(mapped);
      } else {
        setUsers([]);
      }
      setIsLoadingData(false);
    }
    loadProfiles();
  }, []);

  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await registerEmployeeAction({
      fullName,
      email,
      password,
      role,
      department,
    });

    setIsSubmitting(false);

    if (res.success) {
      const newEmpId = `EMP-${100 + users.length + 1}`;
      const initials = fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const newUser = {
        id: newEmpId,
        dbId: res.user?.id || `db-${Date.now()}`,
        name: fullName,
        email,
        role,
        department,
        status: "Active",
        initials,
      };

      setUsers([newUser, ...users]);
      setFeedback({ type: "success", message: res.message || `Employee ${fullName} registered successfully!` });
      setIsModalOpen(false);
      setFullName("");
      setEmail("");
      setPassword("");
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to register employee via Supabase Admin API." });
    }
  };

  // Action 1: Save Role Change
  const handleSaveRole = async () => {
    if (!editingUser) return;
    setActionLoading(true);

    const res = await updateUserRoleAction(editingUser.dbId, newRoleSelection);
    setActionLoading(false);

    if (res.success) {
      setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, role: newRoleSelection } : u)));
      setFeedback({ type: "success", message: res.message || `Role updated to ${newRoleSelection}.` });
      setEditingUser(null);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to update role." });
    }
  };

  // Action 2: Toggle Status
  const handleToggleStatus = async (user: any) => {
    setActiveDropdownId(null);
    setActionLoading(true);

    const res = await toggleUserStatusAction(user.dbId, user.status);
    setActionLoading(false);

    if (res.success) {
      const updatedStatus = res.newStatus || (user.status === "Active" ? "Inactive" : "Active");
      setUsers(users.map((u) => (u.id === user.id ? { ...u, status: updatedStatus } : u)));
      setFeedback({ type: "success", message: res.message || `Account status updated.` });
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to update account status." });
    }
  };

  // Action 3: Password Reset
  const handleSendReset = async (user: any) => {
    setActiveDropdownId(null);
    setActionLoading(true);

    const res = await sendPasswordResetAction(user.email);
    setActionLoading(false);

    if (res.success) {
      setFeedback({ type: "success", message: res.message || `Password reset link sent to ${user.email}.` });
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to send reset email." });
    }
  };

  // Action 4: Delete Account
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setActionLoading(true);

    const res = await deleteEmployeeAction(deletingUser.dbId);
    setActionLoading(false);

    if (res.success) {
      setUsers(users.filter((u) => u.id !== deletingUser.id));
      setFeedback({ type: "success", message: res.message || `Staff account deleted.` });
      setDeletingUser(null);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to delete account." });
    }
  };

  // Action 5: Save Staff Quota
  const handleSaveQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotaUser) return;
    setActionLoading(true);

    const parsed = typeof quotaInput === "number" ? quotaInput : parseFloat(String(quotaInput).replace(/[^0-9.]/g, "")) || 0;
    const res = await updateUserQuotaAction(quotaUser.dbId, parsed);
    setActionLoading(false);

    if (res.success) {
      setUsers(users.map((u) => (u.id === quotaUser.id ? { ...u, monthlyQuota: parsed } : u)));
      setFeedback({ type: "success", message: res.message || `Monthly sales quota updated to ₱${parsed.toLocaleString("en-US", { minimumFractionDigits: 2 })}.` });
      setQuotaUser(null);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to update quota." });
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "All" || user.role === roleFilter;
    const matchesStatus = statusFilter === "All" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-28">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-[#341100]">
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
                Administrator Portal
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-[#341100] tracking-tight">
              User Management
            </h1>
            <p className="text-xs font-normal text-[#7f5e35] mt-1">
              Account management panel: view active staff, register new employees via Supabase Auth Admin API, and assign portal access roles.
            </p>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] gap-2 rounded-xl text-xs font-semibold px-4 py-2 cursor-pointer shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            Register Employee
          </Button>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#e8decf] bg-white p-4 rounded-xl">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Total Registered Staff</span>
            <Users className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">{users.length}</div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Active accounts</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Administrators</span>
            <ShieldCheck className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">{users.filter((u) => u.role === "Admin").length}</div>
          <span className="text-[11px] text-[#713105] font-semibold">Full system permissions</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Sales Representatives</span>
            <ShoppingBag className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">{users.filter((u) => u.role === "Sales").length}</div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Orders & invoicing</span>
        </Card>

        <Card className="border-[#e8decf] bg-white p-4 rounded-xl">
          <div className="flex items-center justify-between text-[#7f5e35] text-xs font-semibold uppercase">
            <span>Inventory Managers</span>
            <Package className="w-4 h-4 text-[#713105]" />
          </div>
          <div className="text-2xl font-bold text-[#341100] mt-2">{users.filter((u) => u.role === "Inventory").length}</div>
          <span className="text-[11px] text-[#7f5e35] font-normal">Stock & warehouse control</span>
        </Card>
      </div>

      {/* Staff Roster Table */}
      <Card className="border-[#e8decf] shadow-xs rounded-xl bg-white overflow-visible">
        <CardHeader className="p-5 border-b border-[#e8decf] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle className="text-sm font-semibold text-[#4f351c]">
            Employee Directory & Role Assignments
          </CardTitle>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7f5e35]" />
              <Input
                placeholder="Search employee name, email or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-[#fff7e8] border-[#e8decf] text-xs text-[#341100] rounded-xl placeholder:text-[#7f5e35]/60"
              />
            </div>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`border-[#e8decf] gap-1.5 text-xs rounded-xl cursor-pointer ${
                  roleFilter !== "All" || statusFilter !== "All"
                    ? "bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c]"
                    : "text-[#4f351c] hover:bg-[#fff7e8]"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filter
                {(roleFilter !== "All" || statusFilter !== "All") && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </Button>

              {/* Filter Dropdown Popover */}
              {isFilterOpen && (
                <div className="absolute right-0 top-11 w-64 bg-white rounded-2xl border border-[#e8decf] shadow-xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 text-xs text-[#341100]">
                  <div className="flex items-center justify-between border-b border-[#e8decf] pb-2">
                    <span className="font-bold text-[#341100] flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-[#713105]" />
                      Filter Directory
                    </span>
                    {(roleFilter !== "All" || statusFilter !== "All") && (
                      <button
                        onClick={() => {
                          setRoleFilter("All");
                          setStatusFilter("All");
                        }}
                        className="text-[11px] font-semibold text-[#713105] hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#7f5e35] mb-1">
                      By Assigned Role
                    </label>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full h-8 bg-[#fff7e8] border border-[#e8decf] rounded-xl px-2.5 text-xs text-[#341100] focus:outline-hidden"
                    >
                      <option value="All">All Roles</option>
                      <option value="Admin">Admin</option>
                      <option value="Sales">Sales</option>
                      <option value="Inventory">Inventory</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#7f5e35] mb-1">
                      By Account Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full h-8 bg-[#fff7e8] border border-[#e8decf] rounded-xl px-2.5 text-xs text-[#341100] focus:outline-hidden"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => setIsFilterOpen(false)}
                      className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] rounded-xl text-[11px] h-7 px-3 cursor-pointer"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Active Filter Badges Bar */}
        {(roleFilter !== "All" || statusFilter !== "All" || searchTerm) && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-[#fff7e8]/70 border-b border-[#e8decf] text-xs flex-wrap">
            <span className="text-[11px] font-semibold text-[#7f5e35]">Active Filters:</span>
            {roleFilter !== "All" && (
              <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71] text-[10px] gap-1.5 px-2 py-0.5 font-semibold">
                Role: {roleFilter}
                <X className="w-3 h-3 cursor-pointer hover:text-[#341100]" onClick={() => setRoleFilter("All")} />
              </Badge>
            )}
            {statusFilter !== "All" && (
              <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71] text-[10px] gap-1.5 px-2 py-0.5 font-semibold">
                Status: {statusFilter}
                <X className="w-3 h-3 cursor-pointer hover:text-[#341100]" onClick={() => setStatusFilter("All")} />
              </Badge>
            )}
            {searchTerm && (
              <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71] text-[10px] gap-1.5 px-2 py-0.5 font-semibold">
                Search: "{searchTerm}"
                <X className="w-3 h-3 cursor-pointer hover:text-[#341100]" onClick={() => setSearchTerm("")} />
              </Badge>
            )}
            <button
              onClick={() => {
                setRoleFilter("All");
                setStatusFilter("All");
                setSearchTerm("");
              }}
              className="text-[11px] text-[#713105] underline font-medium ml-auto cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}

        <CardContent className="p-0 overflow-visible">
          <table className="w-full text-left text-xs text-[#341100]">
            <thead className="bg-[#fff7e8] border-b border-[#e8decf] text-[11px] uppercase tracking-wider text-[#7f5e35] font-semibold">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8decf]/60">
              {isLoadingData ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#e8decf]/60" />
                        <div className="space-y-1">
                          <div className="w-28 h-3 bg-[#e8decf]/70 rounded-md" />
                          <div className="w-36 h-2.5 bg-[#e8decf]/40 rounded-md" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-16 h-3 bg-[#e8decf]/60 rounded-md" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-14 h-5 bg-[#e8decf]/60 rounded-full" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-24 h-3 bg-[#e8decf]/60 rounded-md" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-14 h-5 bg-[#e8decf]/60 rounded-full" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="w-6 h-6 bg-[#e8decf]/60 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#7f5e35]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Users className="w-8 h-8 text-[#cfab71] mx-auto opacity-70" />
                      <p className="font-semibold text-[#341100]">No Staff Accounts Found</p>
                      <p className="text-[11px] text-[#7f5e35]">
                        {searchTerm || roleFilter !== "All" || statusFilter !== "All"
                          ? "No employees match your active filter criteria."
                          : "No staff members registered in the database yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const isNearBottom = idx >= filteredUsers.length - 2 && filteredUsers.length > 2;
                  return (
                    <tr key={user.id} className="hover:bg-[#fcf3e3]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 border border-[#e8decf]">
                            <AvatarFallback className="bg-[#713105] text-[#fff7e8] text-xs font-semibold">
                              {user.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-[#341100]">{user.name}</div>
                            <div className="text-[10px] text-[#7f5e35]">{user.email}</div>
                          </div>
                        </div>
                      </td>
                    <td className="py-3.5 px-4 font-mono text-[#713105]">{user.id}</td>
                    <td className="py-3.5 px-4">
                      {user.role === "Admin" && (
                        <Badge className="bg-[#713105] text-[#fff7e8] text-[11px] uppercase tracking-wide">
                          Admin
                        </Badge>
                      )}
                      {user.role === "Sales" && (
                        <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71] text-[11px] uppercase tracking-wide">
                          Sales
                        </Badge>
                      )}
                      {user.role === "Inventory" && (
                        <Badge className="bg-stone-100 text-[#4f351c] border-stone-300 text-[11px] uppercase tracking-wide">
                          Inventory
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#7f5e35]">{user.department}</td>
                    <td className="py-3.5 px-4">
                      {user.status === "Active" ? (
                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px] uppercase tracking-wide">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-700 border-red-200 text-[11px] uppercase tracking-wide">
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setActiveDropdownId(activeDropdownId === user.id ? null : user.id)}
                        className="h-8 w-8 text-[#7f5e35] hover:text-[#341100] hover:bg-[#fcf3e3] rounded-lg cursor-pointer"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>

                      {/* 3 Dots Actions Contextual Popover */}
                      {activeDropdownId === user.id && (
                        <div
                          className={`absolute right-4 ${
                            isNearBottom ? "bottom-10 mb-1" : "top-12"
                          } w-52 bg-white rounded-2xl border border-[#e8decf] shadow-xl z-40 p-1.5 space-y-1 text-left animate-in fade-in zoom-in-95`}
                        >
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setNewRoleSelection(user.role as "Admin" | "Sales" | "Inventory");
                            setActiveDropdownId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#341100] hover:bg-[#fff7e8] rounded-xl transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#713105]" />
                          Edit Staff Role
                        </button>

                        <button
                          onClick={() => handleToggleStatus(user)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#341100] hover:bg-[#fff7e8] rounded-xl transition-colors"
                        >
                          {user.status === "Active" ? (
                            <>
                              <UserX className="w-3.5 h-3.5 text-amber-700" />
                              Deactivate Account
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                              Activate Account
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleSendReset(user)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#341100] hover:bg-[#fff7e8] rounded-xl transition-colors"
                        >
                          <MailCheck className="w-3.5 h-3.5 text-[#713105]" />
                          Send Password Reset
                        </button>

                        {user.role === "Sales" && (
                          <button
                            onClick={() => {
                              setQuotaUser(user);
                              setQuotaInput(user.monthlyQuota || 20000);
                              setActiveDropdownId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#341100] hover:bg-[#fff7e8] rounded-xl transition-colors"
                          >
                            <Target className="w-3.5 h-3.5 text-[#713105]" />
                            Set Target Quota
                          </button>
                        )}

                        <div className="border-t border-[#e8decf]/60 my-1" />

                        <button
                          onClick={() => {
                            setDeletingUser(user);
                            setActiveDropdownId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          Delete Account
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
              }))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Admin Register Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#e8decf] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#e8decf] flex items-center justify-between bg-[#fff7e8]">
              <h2 className="font-bold text-sm text-[#341100] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#713105]" />
                Register New Employee (Admin Privilege)
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#7f5e35] hover:text-[#341100]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterEmployee} className="p-5 space-y-4 text-xs text-[#341100]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#4f351c] mb-1">Full Name *</label>
                  <Input
                    required
                    placeholder="e.g. Alexander Wright"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4f351c] mb-1">Work Email *</label>
                  <Input
                    required
                    type="email"
                    placeholder="alex.wright@minierp.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#4f351c] mb-1">Initial Password *</label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7f5e35]" />
                    <Input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f5e35] hover:text-[#341100] transition-colors focus:outline-hidden"
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[#4f351c] mb-1">Assigned Portal Role *</label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const selectedRole = e.target.value as "Admin" | "Sales" | "Inventory";
                      setRole(selectedRole);
                      if (selectedRole === "Sales") setDepartment("Sales & Outbound");
                      else if (selectedRole === "Inventory") setDepartment("Warehouse & Logistics");
                      else setDepartment("Executive Management");
                    }}
                    className="w-full h-9 bg-[#fff7e8] border border-[#e8decf] rounded-xl px-3 text-xs text-[#341100] focus:outline-hidden"
                  >
                    <option value="Sales">Sales Representative (/sales/*)</option>
                    <option value="Inventory">Inventory Manager (/inventory/*)</option>
                    <option value="Admin">Administrator (/admin/*)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#4f351c] mb-1">Department</label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs"
                />
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
                  disabled={isSubmitting}
                  className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] text-xs font-semibold rounded-xl px-4 py-2 gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Register Employee Account
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action 1: Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#e8decf] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#e8decf] flex items-center justify-between bg-[#fff7e8]">
              <h2 className="font-bold text-sm text-[#341100] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#713105]" />
                Change Role for {editingUser.name}
              </h2>
              <button onClick={() => setEditingUser(null)} className="text-[#7f5e35] hover:text-[#341100]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-[#341100]">
              <p className="text-[#7f5e35]">
                Updating assigned role for <strong>{editingUser.email}</strong>.
              </p>

              <div>
                <label className="block font-medium text-[#4f351c] mb-1">Select New Portal Role</label>
                <select
                  value={newRoleSelection}
                  onChange={(e) => setNewRoleSelection(e.target.value as any)}
                  className="w-full h-10 bg-[#fff7e8] border border-[#e8decf] rounded-xl px-3 text-xs text-[#341100] focus:outline-hidden"
                >
                  <option value="Sales">Sales Representative (/sales/*)</option>
                  <option value="Inventory">Inventory Manager (/inventory/*)</option>
                  <option value="Admin">Administrator (/admin/*)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#e8decf]">
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  className="border-[#e8decf] text-[#7f5e35] text-xs rounded-xl"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleSaveRole}
                  disabled={actionLoading}
                  className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] text-xs font-semibold rounded-xl px-4 py-2 gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Assigned Role
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action 4: Delete Account Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#e8decf] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-red-200 flex items-center justify-between bg-red-50">
              <h2 className="font-bold text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Confirm Account Deletion
              </h2>
              <button onClick={() => setDeletingUser(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-[#341100]">
              <p className="text-[#4f351c]">
                Are you sure you want to permanently delete the staff account for{" "}
                <strong className="text-[#341100]">{deletingUser.name}</strong> ({deletingUser.email})?
              </p>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px]">
                Warning: This action will permanently revoke access to the Mini-ERP system and remove their profile from Supabase.
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#e8decf]">
                <Button
                  variant="outline"
                  onClick={() => setDeletingUser(null)}
                  className="border-[#e8decf] text-[#7f5e35] text-xs rounded-xl"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleConfirmDelete}
                  disabled={actionLoading}
                  className="bg-red-600 text-white hover:bg-red-700 text-xs font-semibold rounded-xl px-4 py-2 gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Confirm Permanent Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action 5: Set Monthly Quota Modal */}
      {quotaUser && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#e8decf] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#e8decf] flex items-center justify-between bg-[#fff7e8]">
              <h2 className="font-bold text-sm text-[#341100] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#713105]" />
                Set Sales Quota for {quotaUser.name}
              </h2>
              <button onClick={() => setQuotaUser(null)} className="text-[#7f5e35] hover:text-[#341100]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuota} className="p-5 space-y-4 text-xs text-[#341100]">
              <p className="text-[#7f5e35]">
                Configure monthly sales quota performance target for <strong>{quotaUser.email}</strong>.
              </p>

              <div>
                <label className="block font-semibold text-[#4f351c] mb-1.5">
                  Preset Target Goals
                </label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[20000, 50000, 100000, 200000].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuotaInput(preset)}
                      className={`h-7 text-[11px] font-bold rounded-lg border-[#e8decf] ${
                        Number(quotaInput) === preset
                          ? "bg-[#713105] text-[#fff7e8] border-[#713105]"
                          : "bg-[#fff7e8] text-[#713105] hover:bg-[#cfab71]/30"
                      }`}
                    >
                      ₱{(preset / 1000)}k
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4f351c] mb-1.5">
                  Assigned Monthly Target Quota (₱ PHP) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-[#713105]">
                    ₱
                  </span>
                  <Input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={quotaInput}
                    onChange={(e) => setQuotaInput(e.target.value)}
                    className="pl-8 bg-[#fff7e8] border-[#e8decf] rounded-xl text-sm font-bold text-[#341100] h-10 focus:bg-white"
                    placeholder="20000"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#e8decf]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQuotaUser(null)}
                  className="border-[#e8decf] text-[#7f5e35] text-xs rounded-xl"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={actionLoading || Number(quotaInput || 0) <= 0}
                  className="bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] text-xs font-semibold rounded-xl px-4 py-2 gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Assign Target Quota
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagementPage;

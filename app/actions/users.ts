"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface RegisterEmployeeInput {
  fullName: string;
  email: string;
  password: string;
  role: "Admin" | "Sales" | "Inventory";
  department: string;
  employeeId?: string;
}

export async function registerEmployeeAction(input: RegisterEmployeeInput) {
  try {
    const supabaseAdmin = createAdminClient();

    const empId = input.employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Create auth user in Supabase using Service Role key (Admin privilege)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        role: input.role,
        department: input.department,
        employee_id: empId,
      },
    });

    if (authError) {
      console.error("Supabase Admin Auth Error:", authError);
      return { success: false, error: authError.message };
    }

    // 2. Ensure profile entry exists in public.profiles (if trigger didn't catch it)
    if (authData?.user) {
      const initials = input.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
        id: authData.user.id,
        employee_id: empId,
        full_name: input.fullName,
        email: input.email,
        role: input.role,
        department: input.department,
        status: "Active",
        initials,
      });

      if (profileError) {
        console.warn("Profile upsert warning:", profileError.message);
      }
    }

    return {
      success: true,
      message: `Employee ${input.fullName} registered successfully as ${input.role}.`,
      user: authData.user,
    };
  } catch (err: any) {
    console.error("registerEmployeeAction exception:", err);
    return { success: false, error: err.message || "Failed to register employee." };
  }
}

export async function fetchProfilesAction() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });

    if (error || !data) {
      return { success: false, data: [] };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

export async function updateUserRoleAction(userId: string, newRole: "Admin" | "Sales" | "Inventory") {
  try {
    const supabaseAdmin = createAdminClient();

    // 1. Update profile role in public.profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // 2. Update user metadata in auth.users
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { role: newRole },
    });

    return { success: true, message: `Staff role updated to ${newRole}.` };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update role." };
  }
}

export async function toggleUserStatusAction(userId: string, currentStatus: "Active" | "Inactive") {
  try {
    const supabaseAdmin = createAdminClient();
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, newStatus, message: `Account status updated to ${newStatus}.` };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update status." };
  }
}

export async function sendPasswordResetAction(email: string) {
  try {
    const supabaseAdmin = createAdminClient();

    // Determine current host & origin dynamically for local vs Vercel deployment
    let origin = process.env.NEXT_PUBLIC_SITE_URL;

    if (!origin) {
      try {
        const headersList = await headers();
        const host = headersList.get("x-forwarded-host") || headersList.get("host");
        const proto =
          headersList.get("x-forwarded-proto") ||
          (host && !host.includes("localhost") ? "https" : "http");
        if (host) {
          origin = `${proto}://${host}`;
        }
      } catch {
        // In case headers context is not accessible
      }
    }

    if (!origin && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      origin = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    } else if (!origin && process.env.VERCEL_URL) {
      origin = `https://${process.env.VERCEL_URL}`;
    }

    const resolvedOrigin = origin || "http://localhost:3000";
    const redirectTo = `${resolvedOrigin}/login`;

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: `Password reset email dispatched to ${email}.` };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send reset email." };
  }
}


export async function deleteEmployeeAction(userId: string) {
  try {
    const supabaseAdmin = createAdminClient();

    // Delete from public.profiles
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    // Delete from auth.users
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: "Staff account deleted successfully." };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete account." };
  }
}


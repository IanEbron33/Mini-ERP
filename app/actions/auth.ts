"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface SignInInput {
  email: string;
  password: string;
}

export async function signInAction(input: SignInInput) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || "Invalid email or password." };
    }

    // 2. Fetch user profile role from public.profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, full_name, department")
      .eq("id", data.user.id)
      .single();

    const role = profile?.role || data.user.user_metadata?.role || "Sales";

    // 3. Determine redirect URL based on role
    let redirectUrl = "/sales/overview";
    if (role === "Admin") {
      redirectUrl = "/admin/dashboard";
    } else if (role === "Inventory") {
      redirectUrl = "/inventory/overview";
    }

    return {
      success: true,
      redirectUrl,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.full_name || data.user.user_metadata?.full_name || data.user.email,
        role,
      },
    };
  } catch (err: any) {
    console.error("signInAction exception:", err);
    return { success: false, error: err.message || "An unexpected error occurred during sign in." };
  }
}

export async function signOutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("signOutAction error:", err);
  }
  redirect("/login");
}

export async function getCurrentUserAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { authenticated: false, user: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: profile?.full_name || user.user_metadata?.full_name || user.email,
        role: profile?.role || user.user_metadata?.role || "Sales",
        initials: profile?.initials || (profile?.full_name ? profile.full_name.slice(0, 2).toUpperCase() : "EM"),
        employeeId: profile?.employee_id || "EMP-000",
        department: profile?.department || "General",
      },
    };
  } catch (err) {
    return { authenticated: false, user: null };
  }
}

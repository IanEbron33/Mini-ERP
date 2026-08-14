"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface LogAuditInput {
  actorName: string;
  action: string;
  description: string;
  module: string;
  level?: "INFO" | "WARNING" | "SECURITY";
  ipAddress?: string;
}

export async function fetchAuditLogsAction() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("audit_logs")
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

export async function logAuditEventAction(input: LogAuditInput) {
  try {
    const adminSupabase = createAdminClient();
    const logCode = `LOG-${Math.floor(88000 + Math.random() * 999)}`;

    const { data, error } = await adminSupabase
      .from("audit_logs")
      .insert({
        log_code: logCode,
        actor_name: input.actorName,
        action: input.action,
        description: input.description,
        module: input.module,
        level: input.level || "INFO",
        ip_address: input.ipAddress || "127.0.0.1",
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

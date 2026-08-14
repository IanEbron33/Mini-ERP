"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, Store, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signInAction } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMsg("");

    const res = await signInAction({ email, password });

    if (res.success && res.redirectUrl) {
      router.push(res.redirectUrl);
    } else {
      setIsLoading(false);
      setErrorMsg(res.error || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7e8] flex items-center justify-center p-4">
      {/* Full-Screen Circular Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#e8decf] p-6 rounded-3xl shadow-2xl flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#713105]" />
          </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-6">
        {/* Brand Header & Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#713105] text-[#fff7e8] shadow-md mb-2">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-[#341100]">
            MINI-ERP
          </h1>
          <p className="text-xs text-[#7f5e35]">
            Enterprise Resource Planning & Multi-Portal System
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-[#e8decf] shadow-lg rounded-2xl bg-white p-6">
          <CardHeader className="p-0 mb-6 border-b border-[#e8decf] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-[#341100]">
                Sign In to Portal
              </CardTitle>
              <Badge className="bg-[#fcf3e3] text-[#713105] border-[#cfab71]/60 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                Staff Authentication
              </Badge>
            </div>
            <p className="text-xs text-[#7f5e35] mt-1">
              Enter your registered staff email and password to access your assigned portal.
            </p>
          </CardHeader>

          <CardContent className="p-0">
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4f351c] mb-1.5">
                  Staff Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f5e35]" />
                  <Input
                    required
                    type="email"
                    placeholder="name@minierp.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs text-[#341100] h-10 focus:border-[#713105] focus:ring-1 focus:ring-[#713105]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4f351c] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f5e35]" />
                  <Input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-[#fff7e8] border-[#e8decf] rounded-xl text-xs text-[#341100] h-10 focus:border-[#713105] focus:ring-1 focus:ring-[#713105]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f5e35] hover:text-[#341100] transition-colors focus:outline-hidden"
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#713105] text-[#fff7e8] hover:bg-[#4f351c] rounded-xl h-10 text-xs font-semibold shadow-xs flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating Session...
                  </>
                ) : (
                  <>
                    Sign In to Assigned Portal
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#e8decf] text-center">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#7f5e35]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#713105]" />
                <span>Protected by Supabase Auth & Role-Based Access Control</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


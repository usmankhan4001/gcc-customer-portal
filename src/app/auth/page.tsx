"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { WhatsappLogo, LockKey, EnvelopeSimple, CircleNotch, ArrowRight } from "@phosphor-icons/react";

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect") || "/dashboard";

  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");

  // OTP State
  const [step, setStep] = useState<1 | 2>(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");

  // Password State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Feedback State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 7) {
      setError("Please enter a valid WhatsApp phone number with country code.");
      return;
    }
    setError("");
    setInfoMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.devOtp) {
          setOtp(data.devOtp);
          setInfoMessage(`Demo Mode Active: Verification code is ${data.devOtp}`);
        } else {
          setInfoMessage("Verification code sent to your WhatsApp!");
        }
        setStep(2);
      } else {
        setError(data.error || "Failed to send OTP.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("OTP must be 6 digits.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, otp }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.isNewUser) {
          router.push(`/onboarding${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`);
        } else {
          router.push(redirectTo || "/dashboard");
        }
      } else {
        setError(data.error || "Invalid OTP code.");
      }
    } catch {
      setError("An error occurred during verification. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please enter your email/phone and password.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(redirectTo || "/dashboard");
      } else {
        setError(data.error || "Incorrect login credentials.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main id="main-content" className="min-h-[100dvh] flex items-center justify-center bg-gray-50/70 p-4 select-none">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6 text-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Member Access</span>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Sign In to GCC Startup</h1>
          <p className="text-xs text-gray-500 mt-1">Access your companies, bank accounts, and visa applications</p>
        </div>

        {/* Method Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("otp");
              setError("");
              setInfoMessage("");
            }}
            className={`py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              authMethod === "otp" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <WhatsappLogo className="w-4 h-4 text-emerald-600" />
            WhatsApp OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("password");
              setError("");
              setInfoMessage("");
            }}
            className={`py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              authMethod === "password" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <LockKey className="w-4 h-4 text-gray-600" />
            Password
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-medium">
            ℹ️ {infoMessage}
          </div>
        )}

        {/* Tab 1: WhatsApp OTP Flow */}
        {authMethod === "otp" && (
          <>
            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1">
                    WhatsApp Phone Number
                  </label>
                  <div className="relative">
                    <WhatsappLogo className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+971501234567"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !phoneNumber.trim()}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-60 flex justify-center items-center gap-2 text-sm shadow-sm"
                >
                  {isLoading ? <CircleNotch className="w-4 h-4 animate-spin" /> : "Send WhatsApp Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-xs font-semibold text-gray-700 mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-primary hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-60 flex justify-center items-center gap-2 text-sm shadow-sm"
                >
                  {isLoading ? <CircleNotch className="w-4 h-4 animate-spin" /> : "Verify & Sign In"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="w-full text-xs text-gray-500 hover:text-gray-900 transition mt-1"
                >
                  Change Phone Number
                </button>
              </form>
            )}
          </>
        )}

        {/* Tab 2: Password Login Flow */}
        {authMethod === "password" && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address or WhatsApp Number
              </label>
              <div className="relative">
                <EnvelopeSimple className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="alexander@company.com or +97150..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <LockKey className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !identifier || !password}
              className="w-full bg-primary hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-60 flex justify-center items-center gap-2 text-sm shadow-sm"
            >
              {isLoading ? <CircleNotch className="w-4 h-4 animate-spin" /> : "Sign In with Password"}
            </button>
          </form>
        )}

        {/* Register link */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Don&apos;t have an account yet?{" "}
            <Link
              href={`/onboarding${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="text-primary font-bold hover:underline inline-flex items-center gap-1"
            >
              Register & Onboard <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageInner />
    </Suspense>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  WhatsappLogo,
  LockKey,
  EnvelopeSimple,
  CircleNotch,
  ArrowRight,
  UserPlus,
  User,
  ShieldCheck,
  CheckCircle,
} from "@phosphor-icons/react";
import PhoneInputWithCountry from "@/components/ui/PhoneInputWithCountry";
import { safeRedirectPath } from "@/lib/safe-redirect";

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams?.get("redirect"));
  const initialMode = searchParams?.get("mode") === "register" ? "register" : "password";

  const [authMethod, setAuthMethod] = useState<"password" | "otp" | "register">(initialMode);

  // OTP State
  const [step, setStep] = useState<1 | 2>(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");

  // Login State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Registration State
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");

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
      setError("Please enter your email or phone number and password.");
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
        if (data.user?.role === "admin" || data.user?.role === "super_admin") {
          router.push(redirectTo || "/admin");
        } else {
          router.push(redirectTo || "/dashboard");
        }
      } else {
        setError(data.error || "Invalid credentials. Please verify your details.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      setError("Please enter your full legal name.");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: regFullName,
          email: regEmail,
          password: regPassword,
          phone: regPhone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(redirectTo || "/dashboard");
      } else {
        setError(data.error || "Could not complete account creation.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main id="main-content" className="min-h-[100dvh] flex items-center justify-center bg-[#FFFFFF] p-4 select-none font-sans">
      <div className="max-w-md w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl sm:rounded-3xl p-6 sm:p-9 shadow-[0_10px_25px_-5px_rgba(10,20,47,0.08)]">
        {/* Header */}
        <div className="mb-6 text-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#F26522] block mb-1">
            {authMethod === "register" ? "Create Account" : "Member Access"}
          </span>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {authMethod === "register" ? "Join GCC Startup" : "Sign In to GCC Startup"}
          </h1>
          <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
            {authMethod === "register"
              ? "Instant member account for company formation, KYC vault & banking"
              : "Access your companies, document vault, and milestone pipeline"}
          </p>
        </div>

        {/* Method Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-[#F1F5F9] p-1 rounded-full mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("password");
              setError("");
              setInfoMessage("");
            }}
            className={`py-2 rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMethod === "password"
                ? "bg-[#FFFFFF] text-[#0F172A] shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <LockKey className="w-3.5 h-3.5" />
            Password
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("otp");
              setError("");
              setInfoMessage("");
            }}
            className={`py-2 rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMethod === "otp"
                ? "bg-[#FFFFFF] text-[#0F172A] shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <WhatsappLogo className="w-3.5 h-3.5 text-[#16A34A]" />
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("register");
              setError("");
              setInfoMessage("");
            }}
            className={`py-2 rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMethod === "register"
                ? "bg-[#FFFFFF] text-[#0F172A] shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-[#F26522]" />
            Register
          </button>
        </div>

        {/* Sandbox Demo Quick Fill & Auto-Seed */}
        <div className="mb-5 p-3.5 bg-[#FEF1E9] border border-[#F26522]/20 rounded-2xl text-xs">
          <div className="flex items-center justify-between font-bold text-[#14204A] mb-2">
            <span className="text-[#F26522] uppercase tracking-wider text-[11px] flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#F26522]" /> Sandbox Demo Access
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("password");
                setIdentifier("admin@gccstartup.com");
                setPassword("AdminPassword123!");
                setError("");
              }}
              className="p-2.5 text-left bg-white border border-[#E2E8F0] hover:border-[#F26522] rounded-xl transition-all group cursor-pointer shadow-xs"
            >
              <div className="font-bold text-[#14204A] text-xs group-hover:text-[#F26522] flex items-center justify-between">
                <span>Admin User</span>
                <span className="text-[10px] text-[#F26522] font-bold">&rarr;</span>
              </div>
              <div className="text-[10px] text-[#64748B] font-mono mt-0.5 truncate">admin@gccstartup.com</div>
              <div className="text-[10px] text-[#94A3B8] font-mono">AdminPassword123!</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("password");
                setIdentifier("client@gccstartup.com");
                setPassword("ClientPassword123!");
                setError("");
              }}
              className="p-2.5 text-left bg-white border border-[#E2E8F0] hover:border-[#F26522] rounded-xl transition-all group cursor-pointer shadow-xs"
            >
              <div className="font-bold text-[#14204A] text-xs group-hover:text-[#F26522] flex items-center justify-between">
                <span>Client User</span>
                <span className="text-[10px] text-[#F26522] font-bold">&rarr;</span>
              </div>
              <div className="text-[10px] text-[#64748B] font-mono mt-0.5 truncate">client@gccstartup.com</div>
              <div className="text-[10px] text-[#94A3B8] font-mono">ClientPassword123!</div>
            </button>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#F26522]/15 flex items-center justify-between text-[11px]">
            <span className="text-[#64748B]">Bypass typing &amp; 1-click log in:</span>
            <div className="flex gap-2 font-bold">
              <a href="/api/dev/seed-test-users?login=admin" className="text-[#F26522] hover:underline">1-Click Admin</a>
              <span className="text-[#CBD5E1]">|</span>
              <a href="/api/dev/seed-test-users?login=client" className="text-[#F26522] hover:underline">1-Click Client</a>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] rounded-xl text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-5 p-3.5 bg-[#EFF6FF] text-[#1B4FD8] border border-[#BFDBFE] rounded-xl text-xs font-semibold flex items-center gap-2">
            <span>ℹ️</span>
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Tab 1: Password Login */}
        {authMethod === "password" && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                Email Address or WhatsApp Number
              </label>
              <div className="relative">
                <EnvelopeSimple className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@gccstartup.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                Password
              </label>
              <div className="relative">
                <LockKey className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !identifier || !password}
              className="w-full bg-[#F26522] hover:bg-[#14204A] text-white font-bold py-3.5 px-6 rounded-full transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2 text-sm shadow-[0_4px_14px_rgba(242,101,34,0.25)] cursor-pointer"
            >
              {isLoading ? <CircleNotch className="w-4 h-4 animate-spin" /> : "Sign In with Password"}
            </button>
          </form>
        )}

        {/* Tab 2: WhatsApp OTP */}
        {authMethod === "otp" && (
          <>
            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                    WhatsApp Phone Number
                  </label>
                  <PhoneInputWithCountry
                    id="phone"
                    value={phoneNumber}
                    onChange={(val) => setPhoneNumber(val)}
                    placeholder="50 123 4567"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !phoneNumber.trim()}
                  className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-3.5 px-6 rounded-full transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2 text-sm shadow-[0_4px_14px_rgba(22,163,74,0.25)] cursor-pointer"
                >
                  {isLoading ? <CircleNotch className="w-4 h-4 animate-spin" /> : <WhatsappLogo className="w-5 h-5" />}
                  Send WhatsApp Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-2.5 text-center text-lg tracking-widest font-mono border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                    disabled={isLoading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-[#F26522] hover:bg-[#14204A] text-white font-bold py-3.5 px-6 rounded-full transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2 text-sm shadow-[0_4px_14px_rgba(242,101,34,0.25)] cursor-pointer"
                >
                  {isLoading ? <CircleNotch className="w-4 h-4 animate-spin" /> : "Verify & Sign In"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp("");
                      setError("");
                    }}
                    className="text-xs font-bold text-[#64748B] hover:text-[#0F172A]"
                  >
                    &larr; Change Phone Number
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Tab 3: Create Account */}
        {authMethod === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="regName" className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                Full Legal Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="regName"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Tariq Al-Mansoor"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="regEmail" className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <EnvelopeSimple className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="regEmail"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="tariq@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="regPassword" className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                Create Password (min. 6 characters)
              </label>
              <div className="relative">
                <LockKey className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  id="regPassword"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/10 transition-all text-[#0F172A]"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="regPhone" className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                WhatsApp Phone Number (Optional)
              </label>
              <PhoneInputWithCountry
                id="regPhone"
                value={regPhone}
                onChange={(val) => setRegPhone(val)}
                placeholder="50 123 4567"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !regFullName || !regEmail || regPassword.length < 6}
              className="w-full bg-[#F26522] hover:bg-[#14204A] text-white font-bold py-3.5 px-6 rounded-full transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2 text-sm shadow-[0_4px_14px_rgba(242,101,34,0.25)] cursor-pointer"
            >
              {isLoading ? <CircleNotch className="w-4 h-4 animate-spin" /> : "Create Account &amp; Access Portal"}
            </button>
          </form>
        )}

        {/* Footer info & Guided wizard link */}
        <div className="mt-8 pt-5 border-t border-[#E2E8F0] text-center space-y-2">
          {authMethod !== "register" ? (
            <p className="text-xs text-[#64748B]">
              New to GCC Startup?{" "}
              <button
                type="button"
                onClick={() => setAuthMethod("register")}
                className="text-[#F26522] font-bold hover:underline cursor-pointer"
              >
                Create an Account &rarr;
              </button>
            </p>
          ) : (
            <p className="text-xs text-[#64748B]">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setAuthMethod("password")}
                className="text-[#14204A] font-bold hover:underline cursor-pointer"
              >
                Sign In &rarr;
              </button>
            </p>
          )}

          <p className="text-xs text-[#94A3B8]">
            Need a tailored corporate package?{" "}
            <Link
              href={`/onboarding${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="text-[#14204A] font-semibold hover:underline inline-flex items-center gap-1"
            >
              Start Guided Onboarding <ArrowRight className="w-3 h-3" />
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

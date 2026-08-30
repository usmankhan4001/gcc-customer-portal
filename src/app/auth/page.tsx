"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2>(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError("Please enter a valid phone number.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setStep(2);
      } else {
        setError(data.error || "Failed to send OTP.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
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
        const redirectTo = searchParams.get("redirect");
        if (data.isNewUser) {
          router.push(`/onboarding${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`);
        } else {
          router.push(redirectTo || "/dashboard");
        }
      } else {
        setError(data.error || "Invalid OTP.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full border border-gray-200 rounded-md p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Welcome to GCC Startup
          </h1>
          <p className="text-sm text-gray-600">
            {step === 1
              ? "Sign in with your WhatsApp number"
              : "Enter the OTP sent to your WhatsApp"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">
                WhatsApp Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center text-sm"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Send OTP"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-1">
                6-Digit Code
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none text-center tracking-widest text-lg"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center text-sm"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Verify & Login"
              )}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={isLoading}
              className="w-full text-sm text-gray-600 hover:text-gray-900 transition mt-2"
            >
              Back to Phone Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageInner />
    </Suspense>
  );
}

"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Shield,
  User,
  Loader2,
  ArrowLeft,
  Compass,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { loginSchema, LoginInput } from "@/validations/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const registered = searchParams.get("registered");
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"host" | "attendee">("host");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: searchParams.get("email") || "",
      password: "",
      role: "host",
    },
  });

  const handleRoleChange = (newRole: "host" | "attendee") => {
    setRole(newRole);
    setValue("role", newRole);
    setGlobalError(null);
  };

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setGlobalError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        role: data.role,
        redirect: false,
      });

      if (result?.error) {
        setGlobalError(
          result.error || "Invalid credentials. Please verify your email and password."
        );
      } else {
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          router.push(data.role === "host" ? "/dashboard" : "/my-events");
        }
        router.refresh();
      }
    } catch {
      setGlobalError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Switcher Pill */}
      <div className="grid grid-cols-2 p-1.5 bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl">
        <button
          type="button"
          onClick={() => handleRoleChange("host")}
          className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            role === "host"
              ? "bg-[#5146E5] text-white shadow-xs"
              : "text-[#686D78] hover:text-[#171923]"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Host Account</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange("attendee")}
          className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            role === "attendee"
              ? "bg-[#5146E5] text-white shadow-xs"
              : "text-[#686D78] hover:text-[#171923]"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Attendee Account</span>
        </button>
      </div>

      {registered && (
        <div
          role="status"
          className="p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-[#059669] text-xs flex items-center gap-2 font-medium"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Account created successfully! Please sign in with your password.</span>
        </div>
      )}

      {globalError && (
        <div
          role="alert"
          className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#DC2626] text-xs flex items-center gap-2 font-medium"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#171923] uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              placeholder="name@example.com"
              disabled={isLoading}
              {...register("email")}
              className={`w-full pl-10 pr-3.5 py-3 bg-[#FAF9F6] border rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:outline-none focus:bg-white transition-all ${
                errors.email
                  ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10"
                  : "border-[#E8E5DF] focus:border-[#5146E5] focus:ring-2 focus:ring-[#5146E5]/15"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-[#DC2626] text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#171923] uppercase tracking-wider">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={isLoading}
              {...register("password")}
              className={`w-full pl-10 pr-10 py-3 bg-[#FAF9F6] border rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:outline-none focus:bg-white transition-all ${
                errors.password
                  ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10"
                  : "border-[#E8E5DF] focus:border-[#5146E5] focus:ring-2 focus:ring-[#5146E5]/15"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#686D78] hover:text-[#171923] p-1 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[#DC2626] text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#5146E5] hover:bg-[#4338CA] text-white font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 active:scale-[0.99]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In to EventScout</span>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-[#686D78] border-t border-[#E8E5DF] pt-4">
        Don&apos;t have an account yet?{" "}
        <Link
          href="/signup"
          className="text-[#5146E5] hover:text-[#4338CA] font-bold transition-colors"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#171923] flex flex-col justify-center items-center px-4 py-8 sm:py-16 selection:bg-[#EEEAFE] selection:text-[#5146E5]">
      {/* Top back navigation */}
      <div className="w-full max-w-4xl mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#686D78] hover:text-[#171923] text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Elevated Dual-Panel Container */}
      <div className="w-full max-w-4xl bg-white border border-[#E8E5DF] rounded-3xl shadow-[0_16px_50px_rgba(23,25,35,0.08)] overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Side: Visual Editorial Vibe Panel (hidden on small mobile) */}
        <div className="hidden md:flex md:col-span-5 bg-[#171923] text-white p-8 lg:p-10 flex-col justify-between relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[#5146E5]/30 blur-3xl pointer-events-none"
          />

          <div className="relative z-10 space-y-6">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#5146E5] flex items-center justify-center text-white shadow-xs">
                <Compass className="w-4.5 h-4.5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Event<span className="text-[#DDD6FE]">Scout</span>
              </span>
            </Link>

            <div className="space-y-3 pt-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#DDD6FE] text-[11px] font-semibold uppercase tracking-wider border border-white/15">
                <Sparkles className="w-3 h-3 text-[#A7F3D0]" />
                <span>Community Ecosystem</span>
              </div>
              <h2 className="text-2xl font-bold text-white leading-snug">
                Where great events find their audience.
              </h2>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Connect with organizers, reserve seats at hackathons, or host and track attendance in real time.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10 space-y-2 text-xs text-[#9CA3AF]">
            <div className="flex items-center gap-2 text-white font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>Live SerpApi Discovery</span>
            </div>
            <div className="flex items-center gap-2 text-white font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>Concurrency-Safe RSVPs</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="mb-6 space-y-1.5">
            <div className="md:hidden flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#5146E5] flex items-center justify-center text-white shadow-xs">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-[#171923]">EventScout</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#171923] tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs text-[#686D78]">
              Sign in to manage your events, registrations, and host settings
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-[#5146E5] mb-2" />
                <p className="text-xs text-[#686D78]">Loading authentication...</p>
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

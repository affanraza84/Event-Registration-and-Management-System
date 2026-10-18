"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Shield,
  Loader2,
  ArrowLeft,
  Compass,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { signupSchema, SignupInput } from "@/validations/auth";
import { signUpAction } from "@/actions/auth";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"host" | "attendee">("host");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "host",
    },
  });

  const handleRoleChange = (newRole: "host" | "attendee") => {
    setRole(newRole);
    setValue("role", newRole);
    setGlobalError(null);
  };

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    setGlobalError(null);
    setStatusMsg(null);

    try {
      const result = await signUpAction(data);

      if (result?.error) {
        setGlobalError(result.error);
        setIsLoading(false);
        return;
      }

      setStatusMsg("Account created! Signing you in...");

      const loginResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        role: data.role,
        redirect: false,
      });

      if (loginResult?.error) {
        setStatusMsg("Redirecting to login...");
        router.push(`/login?registered=true&email=${encodeURIComponent(data.email)}`);
      } else {
        setStatusMsg("Success! Directing to your workspace...");
        router.refresh();
        router.push(data.role === "host" ? "/dashboard" : "/my-events");
      }
    } catch {
      setGlobalError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#171923] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Back Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[#686D78] hover:text-[#171923] text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5146E5] flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#171923]">
              Event<span className="text-[#5146E5]">Scout</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-[#171923]">
            Create Your Account
          </h1>
          <p className="text-xs text-[#686D78]">
            Discover gatherings or publish and organize your own community events
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-white border border-[#E8E5DF] rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(23,25,35,0.06)]">
          {/* Role Toggle */}
          <div className="grid grid-cols-2 p-1 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl mb-6">
            <button
              type="button"
              onClick={() => handleRoleChange("host")}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                role === "host"
                  ? "bg-[#5146E5] text-white shadow-xs"
                  : "text-[#686D78] hover:text-[#171923]"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Host Account</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange("attendee")}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                role === "attendee"
                  ? "bg-[#5146E5] text-white shadow-xs"
                  : "text-[#686D78] hover:text-[#171923]"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Attendee Account</span>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {globalError && (
              <div
                role="alert"
                className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#DC2626] text-xs flex items-center gap-2 font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{globalError}</span>
              </div>
            )}

            {statusMsg && (
              <div
                role="status"
                className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-[#059669] text-xs flex items-center gap-2 font-medium"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Your full name"
                  disabled={isLoading}
                  {...register("name")}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:outline-none focus:bg-white transition-all ${
                    errors.name
                      ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10"
                      : "border-[#E8E5DF] focus:border-[#5146E5] focus:ring-2 focus:ring-[#5146E5]/15"
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-[#DC2626] text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  disabled={isLoading}
                  {...register("email")}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-[#FAF9F6] border rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:outline-none focus:bg-white transition-all ${
                    errors.email
                      ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10"
                      : "border-[#E8E5DF] focus:border-[#5146E5] focus:ring-2 focus:ring-[#5146E5]/15"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[#DC2626] text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#171923] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#686D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  disabled={isLoading}
                  {...register("password")}
                  className={`w-full pl-10 pr-10 py-2.5 bg-[#FAF9F6] border rounded-xl text-sm text-[#171923] placeholder-[#9CA3AF] focus:outline-none focus:bg-white transition-all ${
                    errors.password
                      ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10"
                      : "border-[#E8E5DF] focus:border-[#5146E5] focus:ring-2 focus:ring-[#5146E5]/15"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#686D78] hover:text-[#171923] p-1 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[#DC2626] text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#5146E5] hover:bg-[#4338CA] text-white font-medium rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create {role === "host" ? "Host" : "Attendee"} Account</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#686D78] border-t border-[#E8E5DF] pt-4">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#5146E5] hover:text-[#4338CA] font-semibold transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

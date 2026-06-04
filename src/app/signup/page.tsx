"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Shield, Loader2, UserPlus } from "lucide-react";
import { signupSchema, SignupInput } from "@/validations/auth";
import { signUpAction } from "@/actions/auth";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"host" | "attendee">("host");
  const [globalError, setGlobalError] = useState<string | null>(null);

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

    try {
      const result = await signUpAction(data);

      if (result?.error) {
        setGlobalError(result.error);
        setIsLoading(false);
        return;
      }

      // Automatically sign the user in after successful signup
      const loginResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        role: data.role,
        redirect: false,
      });

      if (loginResult?.error) {
        // Fallback: send them to login page if auto-login failed
        router.push(`/login?registered=true&email=${encodeURIComponent(data.email)}`);
      } else {
        router.push(data.role === "host" ? "/dashboard" : "/my-events");
        router.refresh();
      }
    } catch {
      setGlobalError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-neutral-950 px-4">
      {/* Background blobs for premium glow effect */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity"
          >
            Luma
          </Link>
          <p className="text-neutral-400 mt-2 text-sm">
            Create an account to start hosting or attending events
          </p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-8 shadow-2xl">
          {/* Role Tabs */}
          <div className="grid grid-cols-2 p-1 bg-neutral-950/80 rounded-lg mb-6 border border-neutral-800/50">
            <button
              type="button"
              onClick={() => handleRoleChange("host")}
              className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                role === "host"
                  ? "bg-purple-600 text-white shadow"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Shield className="w-4 h-4" />
              Host Account
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange("attendee")}
              className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                role === "attendee"
                  ? "bg-purple-600 text-white shadow"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <User className="w-4 h-4" />
              Attendee Account
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {globalError && (
              <div className="p-3.5 bg-red-950/40 border border-red-900/50 rounded-lg text-red-400 text-sm font-medium">
                {globalError}
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <UserPlus className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="John Doe"
                  disabled={isLoading}
                  {...register("name")}
                  className={`w-full pl-10 pr-4 py-3 bg-neutral-950/50 border rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                    errors.name
                      ? "border-red-900/50 focus:border-red-500"
                      : "border-neutral-800/80 focus:border-purple-500/80"
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  disabled={isLoading}
                  {...register("email")}
                  className={`w-full pl-10 pr-4 py-3 bg-neutral-950/50 border rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                    errors.email
                      ? "border-red-900/50 focus:border-red-500"
                      : "border-neutral-800/80 focus:border-purple-500/80"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  {...register("password")}
                  className={`w-full pl-10 pr-4 py-3 bg-neutral-950/50 border rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                    errors.password
                      ? "border-red-900/50 focus:border-red-500"
                      : "border-neutral-800/80 focus:border-purple-500/80"
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 shadow-lg shadow-purple-950/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-400 border-t border-neutral-800/50 pt-4">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

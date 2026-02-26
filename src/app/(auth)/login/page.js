"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, Layers } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { loginUser } from "@/services/auth.service";

const schema = yup.object({
  email: yup
    .string()
    .email("Enter a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);

    // Trigger animation after mount
    setTimeout(() => setMounted(true), 50);

    return () => mq.removeEventListener("change", handler);
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const { login } = useAuth();

  const handleLogin = async (data) => {
    try {
      const user = await loginUser(data);

      login(user);

      router.replace(`/${user.role}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Login Failed");
      console.log(error);
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideUpFade {
          0% {
            opacity: 0;
            transform: translateY(60px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .mobile-card-enter {
          animation: slideUpFade 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .bg-overlay-enter {
          animation: fadeIn 0.4s ease forwards;
        }
      `}</style>

      <div className="min-h-screen flex">
        {/* ══ MOBILE ONLY: fullscreen bg + animated card ══ */}
        {isMobile && (
          <>
            {/* Background image */}
            <div
              className="fixed inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: "url('/waterpark.webp')" }}
            />
            {/* Dark overlay */}
            <div
              className={`fixed inset-0 bg-black/50 ${mounted ? "bg-overlay-enter" : "opacity-0"}`}
            />

            {/* Animated card */}
            <div className="relative z-10 flex flex-col justify-end min-h-screen pb-8 px-4">
              <div className="flex items-center gap-2 mb-6">
                <h1
                  className="text-[50px] font-black tracking-wide
                 bg-[url('/waterpark.webp')]
                 bg-cover bg-top items-start text-center
                 bg-clip-text text-teal-500/30"
                >
                  SYNERGY
                </h1>
              </div>
              <div
                className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl ${
                  mounted ? "mobile-card-enter" : "opacity-0"
                }`}
              >
                {/* Logo */}

                <h2 className="text-2xl font-bold text-white mb-1">
                  Welcome back
                </h2>
                <p className="text-white/60 text-sm mb-6">
                  Sign in to your Synergy workspace
                </p>

                <form
                  onSubmit={handleSubmit(handleLogin)}
                  className="space-y-4"
                >
                  {/* Email */}
                  <div>
                    <label className="text-white/80 text-xs font-medium mb-1.5 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        {...register("email")}
                        type="email"
                        placeholder="you@example.com"
                        className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1">
                        ⚠ {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-white/80 text-xs font-medium">
                        Password
                      </label>
                      <a
                        href="#"
                        className="text-blue-400 text-xs hover:text-blue-300"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        {...register("password")}
                        type={showPw ? "text" : "password"}
                        placeholder="••••••••••"
                        className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-12 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      >
                        {showPw ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-400 text-xs mt-1">
                        ⚠ {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 text-sm mt-2 disabled:opacity-60 active:scale-98"
                  >
                    {isSubmitting ? "Signing in…" : "Sign In"}
                  </button>
                </form>

                <p className="text-center text-white/40 text-xs mt-5">
                  Need access?{" "}
                  <a href="#" className="text-blue-400 hover:text-blue-300">
                    Contact your administrator
                  </a>
                </p>
              </div>
            </div>
          </>
        )}

        {/* ══ LEFT PANEL (desktop) ══ */}
        {!isMobile && (
          <div
            className="hidden md:flex md:w-1/2 lg:w-3/5 relative flex-col justify-between p-10"
            style={{
              backgroundImage: "url('/waterpark.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-teal-900/50"></div>

            <div className="relative z-10 p-12 flex flex-col justify-start items-center h-full w-full">
              <h1
                className="text-[100px] font-black tracking-wide
                 bg-[url('/waterpark.webp')]
                 bg-cover bg-top
                 bg-clip-text text-teal-500/30"
              >
                SYNERGY
              </h1>
            </div>
          </div>
        )}

        {/* ══ RIGHT PANEL (desktop) ══ */}
        {!isMobile && (
          <div className="flex flex-col justify-center items-center w-full md:w-1/2 lg:w-2/5 px-8 bg-white">
            <div className="w-full max-w-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Welcome back
              </h2>
              <p className="text-gray-500 text-sm mb-8">
                Sign in to your Synergy workspace
              </p>

              <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
                <div>
                  <label className="text-gray-700 text-sm font-medium mb-1.5 block">
                    <Mail className="inline w-4 h-4 mr-1" /> Email Address
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    // defaultValue="dev03.nexcore@gmail.com"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      ⚠ {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-gray-700 text-sm font-medium">
                      <Lock className="inline w-4 h-4 mr-1" /> Password
                    </label>
                    <a
                      href="#"
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      {...register("password")}
                      type={showPw ? "text" : "password"}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      ⚠ {errors.password.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-700 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
                >
                  {isSubmitting ? "Signing in…" : "Sign In"}
                </button>
              </form>

              <p className="text-center text-gray-400 text-sm mt-6">
                Need access?{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Contact your administrator
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

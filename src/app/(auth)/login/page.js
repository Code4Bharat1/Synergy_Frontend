"use client";

import { useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";

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

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");

    if (token && role) {
      router.replace(`/${role}/dashboard`);
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const handleLogin = async (data) => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        data,
        { withCredentials: true },
      );

      const role = res.data.user.role;

      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("role", role);

      router.replace(`/${role}/dashboard`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Login Failed");
    }
  };

  return (
    <div className="min-h-screen flex font-inter bg-white">
      {/* LEFT SIDE — UNCHANGED ✅ */}
      <div
        className="hidden md:flex w-1/2 relative text-white min-h-screen"
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

      {/* RIGHT SIDE */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-gray-50">
        <div className="w-full max-w-md px-6">
          <div className="w-full p-3">
            <form onSubmit={handleSubmit(handleLogin)}>
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-extra-darkblue">
                  Sign in to Synergy
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  Enter your credentials to access the workspace.
                </p>
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Email Address
                </label>

                <input
                  type="email"
                  {...register("email")}
                  className={`w-full mt-1.5 px-3 py-2.5 border rounded-lg text-sm transition-all
                    ${
                      errors.email
                        ? "border-red-300"
                        : "border-gray-200 focus:border-medium-blue"
                    }`}
                />

                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">
                    Password
                  </label>

                  <span className="text-xs text-extra-blue cursor-pointer hover:text-extra-darkblue transition-all">
                    Forgot password?
                  </span>
                </div>

                <input
                  type="password"
                  {...register("password")}
                  className={`w-full mt-1.5 px-3 py-2.5 border rounded-lg text-sm transition-all
                    ${
                      errors.password
                        ? "border-red-300"
                        : "border-gray-200 focus:border-medium-blue"
                    }`}
                />

                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-extra-darkblue text-white py-2.5 rounded-lg text-sm font-medium
                           hover:bg-extra-blue transition-all disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

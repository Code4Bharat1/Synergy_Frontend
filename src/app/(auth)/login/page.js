"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");

    if (token && role) {
      router.replace(`/${role}/dashboard`);
    }
  }, [router]);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        form,
        { withCredentials: true }
      );

      const role = res.data.user.role;

      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("role", role);

      console.log("Redirecting to:", `/${role}/dashboard`);

      router.replace(`/${role}/dashboard`);

    } catch (error) {
      console.error("Full error:", error.response?.data);
      alert(error.response?.data?.message || "Login Failed");
    }

  };



  return (
    <div className="min-h-screen flex select-none">

      {/* LEFT SIDE */}
      <div
        className="hidden md:flex w-1/2 relative text-white min-h-screen"
        style={{
          backgroundImage: "url('/waterpark.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-teal-900/70"></div>

        <div className="relative z-10 p-12 flex flex-col justify-start items-center  h-full w-full">

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
      <div className="flex w-full md:w-1/2 items-center justify-center bg-gray-100 p-8">

        <form
          onSubmit={handleSubmit}
          className="bg-white p-10 rounded-xl text-black shadow-xl w-full max-w-md"
        >
          <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
          <p className="text-gray-500 mb-6">
            Enter your credentials to access the workspace.
          </p>

          <label className="text-sm font-medium">Email Address</label>
          <input
            type="email"
            name="email"
            value={form.email}
            className="w-full mb-4 mt-1 p-3 border rounded-lg"
            onChange={handleChange}
            required
          />

          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Password</label>
            <span className="text-sm text-teal-700 cursor-pointer">
              Forgot password?
            </span>
          </div>

          <input
            type="password"
            name="password"
            value={form.password}
            className="w-full mb-4 mt-1 p-3 border rounded-lg"
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="w-full bg-teal-700 text-white p-3 rounded-lg hover:bg-teal-800 transition"
          >
            Sign In to Portal
          </button>



          <p className="text-xs text-center text-gray-400 mt-6">
            Restricted Access. Authorized Personnel Only.
          </p>

        </form>
      </div>
    </div>
  );
}

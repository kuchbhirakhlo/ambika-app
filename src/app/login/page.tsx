"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

const STORAGE_KEY = "dashboardSelectedYear";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Year selection state
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const start = Math.max(2000, currentYear - 20);
    const end = currentYear + 1;
    const arr: string[] = [];
    for (let y = start; y <= end; y++) arr.push(String(y));
    return arr;
  }, [currentYear]);

  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved && /^\d{4}$/.test(saved)) {
      setSelectedYear(saved);
    } else {
      sessionStorage.setItem(STORAGE_KEY, String(currentYear));
    }
  }, [currentYear]);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, year);
    }
  };

  // Check if the app can be installed (PWA)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setError("");
      setLoading(true);

      // Make API call to login endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store user in sessionStorage
        sessionStorage.setItem("user", JSON.stringify(data.user));

        // Redirect based on user role
        if (data.user.role === 'employee') {
          router.push("/dashboard/sales"); // Redirect employees to sales page
        } else {
          router.push("/dashboard"); // Redirect admins to main dashboard
        }
      } else {
        setError(data.error || "Invalid username or password");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during login";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#34495e]/10 to-[#2c3e50]/10 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border border-[#34495e]/20">
        <div className="flex justify-center mb-6">
          <Link href="/" className="block">
            <div className="w-[180px] h-[180px] relative flex items-center justify-center rounded-full overflow-hidden border-2 border-[#34495e] shadow-lg">
              <Image
                src="/logo.png"
                alt="Ambika Empire Logo"
                width={180}
                height={180}
                className="object-cover"
                priority
              />
            </div>
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-center text-[#34495e] mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-[#34495e]/80 mb-6">
          Sign in to access your vendor dashboard
        </p>

        {error && (
          <div className="bg-[#34495e]/10 border border-[#34495e]/20 text-[#34495e] px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Year Selector - visible on mobile */}
          <div className="sm:hidden">
            <label htmlFor="year-mobile" className="block text-sm font-medium text-[#34495e] mb-1">
              Select Year
            </label>
            <select
              id="year-mobile"
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-full px-3 py-2 border border-[#34495e]/20 rounded-md focus:outline-none focus:ring-2 text-black focus:ring-[#34495e]"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[#34495e] mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-[#34495e]/20 rounded-md focus:outline-none focus:ring-2 text-black focus:ring-[#34495e]"
              placeholder="Enter your username"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#34495e] mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[#34495e]/20 rounded-md focus:outline-none focus:ring-2 text-black focus:ring-[#34495e]"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#34495e] text-white py-2 px-4 rounded-md hover:bg-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#34495e] focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Year Selector - visible on desktop */}
        <div className="hidden sm:flex items-center justify-center mt-4 pt-4 border-t border-[#34495e]/20">
          <label htmlFor="year-desktop" className="text-sm font-medium text-[#34495e] mr-2">
            Select Year:
          </label>
          <select
            id="year-desktop"
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="px-3 py-1 border border-[#34495e]/20 rounded-md focus:outline-none focus:ring-2 text-black focus:ring-[#34495e] text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 pt-6 border-t border-[#34495e]/20">
          <p className="text-xs text-center text-[#34495e]/60">
            © {new Date().getFullYear()} Ambika Empire. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

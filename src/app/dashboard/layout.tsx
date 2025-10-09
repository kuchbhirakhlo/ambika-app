"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User } from "@/types/user";
import { registerServiceWorker } from "../sw-register";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Register service worker for PWA functionality
    registerServiceWorker();
    
    // Check if user is logged in
    const userStr = sessionStorage.getItem("user");
    
    if (userStr) {
      try {
        const userData = JSON.parse(userStr) as User;
        setUser(userData);
      } catch {
        // Invalid user data, redirect to login
        router.push("/login");
      }
    } else {
      // No user data, redirect to login
      router.push("/login");
    }
    
    setLoading(false);
  }, [router]);
  
  const handleLogout = () => {
    sessionStorage.removeItem("user");
    router.push("/login");
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // This will be handled by the useEffect redirect
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-[#34495e] to-[#2c3e50] text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="w-[50px] h-[50px] relative flex items-center justify-center rounded-full overflow-hidden border-2 border-white shadow-lg mr-3">
                <Image
                  src="/logo.png"
                  alt="Ambika Empire Logo"
                  width={50}
                  height={50}
                  className="object-cover"
                  priority
                />
              </div>
              <h1 className="text-xl font-semibold text-white hidden sm:block">Ambika Empire</h1>
            </Link>
          </div>
          
          <div className="flex items-center">
            <div className="mr-4 hidden sm:block">
              <p className="text-sm text-white">Welcome, {user.name || user.username}</p>
              <p className="text-xs text-[#34495e]/80">{user.role}</p>
            </div>
            
            <button 
              onClick={handleLogout}
              className="bg-white text-[#34495e] hover:bg-[#34495e]/10 py-1 px-3 rounded text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      {/* Always visible menu with horizontal scroll */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 overflow-x-auto py-1 scrollbar-hide">
            <Link 
              href="/dashboard" 
              className={`border-b-2 whitespace-nowrap ${pathname === '/dashboard' ? 'border-[#34495e] text-[#34495e]' : 'border-transparent hover:border-[#34495e]/30 text-gray-600 hover:text-[#34495e]'} px-3 py-4 text-sm font-medium transition-colors flex-shrink-0`}
            >
              Dashboard
            </Link>
            <Link 
              href="/dashboard/sales" 
              className={`border-b-2 whitespace-nowrap ${pathname === '/dashboard/sales' ? 'border-[#34495e] text-[#34495e]' : 'border-transparent hover:border-[#34495e]/30 text-gray-600 hover:text-[#34495e]'} px-3 py-4 text-sm font-medium transition-colors flex-shrink-0`}
            >
              Sales
            </Link>
            <Link 
              href="/dashboard/customers" 
              className={`border-b-2 whitespace-nowrap ${pathname === '/dashboard/customers' ? 'border-[#34495e] text-[#34495e]' : 'border-transparent hover:border-[#34495e]/30 text-gray-600 hover:text-[#34495e]'} px-3 py-4 text-sm font-medium transition-colors flex-shrink-0`}
            >
              Customers
            </Link>
            <Link 
              href="/dashboard/products" 
              className={`border-b-2 whitespace-nowrap ${pathname === '/dashboard/products' ? 'border-[#34495e] text-[#34495e]' : 'border-transparent hover:border-[#34495e]/30 text-gray-600 hover:text-[#34495e]'} px-3 py-4 text-sm font-medium transition-colors flex-shrink-0`}
            >
              Products
            </Link>
            <Link 
              href="/dashboard/suppliers" 
              className={`border-b-2 whitespace-nowrap ${pathname === '/dashboard/suppliers' ? 'border-[#34495e] text-[#34495e]' : 'border-transparent hover:border-[#34495e]/30 text-gray-600 hover:text-[#34495e]'} px-3 py-4 text-sm font-medium transition-colors flex-shrink-0`}
            >
              Suppliers
            </Link>
            <Link 
              href="/dashboard/agents" 
              className={`border-b-2 whitespace-nowrap ${pathname === '/dashboard/agents' ? 'border-[#34495e] text-[#34495e]' : 'border-transparent hover:border-[#34495e]/30 text-gray-600 hover:text-[#34495e]'} px-3 py-4 text-sm font-medium transition-colors flex-shrink-0`}
            >
              Agents
            </Link>
            <Link 
              href="/dashboard/inventory" 
              className={`border-b-2 whitespace-nowrap ${pathname === '/dashboard/inventory' ? 'border-[#34495e] text-[#34495e]' : 'border-transparent hover:border-[#34495e]/30 text-gray-600 hover:text-[#34495e]'} px-3 py-4 text-sm font-medium transition-colors flex-shrink-0`}
            >
              Inventory
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Mobile user info */}
      <div className="bg-white shadow-sm p-2 block sm:hidden">
        <div className="max-w-7xl mx-auto px-2">
          <p className="text-sm text-gray-800 font-medium">Welcome, {user.name || user.username}</p>
          <p className="text-xs text-gray-600">{user.role}</p>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
      
      <footer className="bg-white py-4 sm:py-6 border-t border-gray-200 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            © {new Date().getFullYear()} Ambika Empire. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 
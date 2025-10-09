"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "@/types/user";
import Image from "next/image";

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
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
              <h1 className="text-xl font-semibold text-white">Ambika Empire</h1>
            </Link>
          </div>
          
          <div className="flex items-center">
            <div className="mr-4">
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
      
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            <Link href="/dashboard" className="border-b-2 border-transparent hover:border-[#34495e]/30 text-gray-600 hover:text-[#34495e] px-3 py-4 text-sm font-medium transition-colors">Dashboard</Link>
            <Link href="/dashboard/vendors" className="border-b-2 border-transparent hover:border-[#34495e]/30 text-gray-600 hover:text-[#34495e] px-3 py-4 text-sm font-medium transition-colors">Vendors</Link>
            <Link href="/dashboard/products" className="border-b-2 border-transparent hover:border-[#34495e]/30 text-gray-600 hover:text-[#34495e] px-3 py-4 text-sm font-medium transition-colors">Products</Link>
            <Link href="/dashboard/orders" className="border-b-2 border-transparent hover:border-[#34495e]/30 text-gray-600 hover:text-[#34495e] px-3 py-4 text-sm font-medium transition-colors">Orders</Link>
            <Link href="/dashboard/inventory" className="border-b-2 border-transparent hover:border-[#34495e]/30 text-gray-600 hover:text-[#34495e] px-3 py-4 text-sm font-medium transition-colors">Inventory</Link>
            <Link href="/dashboard/reports" className="border-b-2 border-transparent hover:border-[#34495e]/30 text-gray-600 hover:text-[#34495e] px-3 py-4 text-sm font-medium transition-colors">Reports</Link>
            <Link href="/dashboard/settings" className="border-b-2 border-[#34495e] text-[#34495e] px-3 py-4 text-sm font-medium">Settings</Link>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
          <p className="text-gray-600">Manage your account and application preferences</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-800">Settings Menu</h3>
              </div>
              <div className="p-4">
                <nav className="space-y-1">
                  <button className="flex items-center w-full px-3 py-2 rounded-md bg-red-50 text-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>
                  <button className="flex items-center w-full px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Security
                  </button>
                  <button className="flex items-center w-full px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Notifications
                  </button>
                  <button className="flex items-center w-full px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Billing
                  </button>
                  <button className="flex items-center w-full px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    General Settings
                  </button>
                  <button className="flex items-center w-full px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </nav>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-800">Profile Information</h3>
                <p className="text-sm text-gray-500 mt-1">Update your account information and profile details</p>
              </div>
              <div className="p-6">
                <div className="mb-8">
                  <div className="flex items-center">
                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center font-bold text-2xl text-gray-600 mr-4">
                      {user.name ? user.name.charAt(0) : user.username.charAt(0)}
                    </div>
                    <div>
                      <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                        </svg>
                        Change Profile Photo
                      </button>
                      <div className="text-sm text-gray-500 mt-1">JPG, GIF or PNG. Max size 2MB</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      defaultValue={user.name ? user.name.split(' ')[0] : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      defaultValue={user.name ? user.name.split(' ')[1] || '' : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      defaultValue={user.email || ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      defaultValue={user.phone || ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-md p-2 text-sm bg-gray-50"
                      readOnly
                      defaultValue={user.role || 'User'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select className="w-full border border-gray-300 rounded-md p-2 text-sm">
                      <option>Management</option>
                      <option>Finance</option>
                      <option>Operations</option>
                      <option>Marketing</option>
                      <option>IT</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea 
                      className="w-full border border-gray-300 rounded-md p-2 text-sm" 
                      rows={3}
                      placeholder="A brief description about yourself..."
                    ></textarea>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm transition-colors mr-3">
                    Cancel
                  </button>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white py-6 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Ambika Empire Vendor Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 
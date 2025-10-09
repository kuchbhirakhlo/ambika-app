"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "@/types/user";
import Image from "next/image";

export default function Orders() {
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
            <Link href="/dashboard/orders" className="border-b-2 border-[#34495e] text-[#34495e] px-3 py-4 text-sm font-medium">Orders</Link>
            <Link href="/dashboard/inventory" className="border-b-2 border-transparent hover:border-[#34495e]/30 text-gray-600 hover:text-[#34495e] px-3 py-4 text-sm font-medium transition-colors">Inventory</Link>
            <Link href="/dashboard/reports" className="border-b-2 border-transparent hover:border-[#34495e]/30 text-gray-600 hover:text-[#34495e] px-3 py-4 text-sm font-medium transition-colors">Reports</Link>
            <Link href="/dashboard/settings" className="border-b-2 border-transparent hover:border-[#34495e]/30 text-gray-600 hover:text-[#34495e] px-3 py-4 text-sm font-medium transition-colors">Settings</Link>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
          <p className="text-gray-600">Track and manage all orders</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-600">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Orders</div>
                <div className="text-2xl font-bold text-gray-800">42</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Completed</div>
                <div className="text-2xl font-bold text-gray-800">28</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-600">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Pending</div>
                <div className="text-2xl font-bold text-gray-800">10</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-600">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gray-100 text-gray-600 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Cancelled</div>
                <div className="text-2xl font-bold text-gray-800">4</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6 flex justify-between items-center border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">Recent Orders</h3>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Order
            </button>
          </div>
          <div className="p-6 flex justify-between items-center border-b border-gray-200">
            <div className="flex items-center">
              <span className="mr-2 text-gray-600">Status:</span>
              <select className="border border-gray-300 rounded-md p-1 text-sm">
                <option>All Status</option>
                <option>Completed</option>
                <option>Processing</option>
                <option>Shipped</option>
                <option>Cancelled</option>
              </select>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search orders..."
                className="border border-gray-300 rounded-md p-1 pl-8 text-sm w-64"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 absolute left-2 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#ORD-2023-1042</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                        RS
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Rahul Sharma</div>
                        <div className="text-sm text-gray-500">rahul.s@example.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aug 15, 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹12,499</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href="#" className="text-indigo-600 hover:text-indigo-900 mr-3">View</a>
                    <a href="#" className="text-indigo-600 hover:text-indigo-900">Invoice</a>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#ORD-2023-1041</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-xs">
                        PK
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Priya Kumar</div>
                        <div className="text-sm text-gray-500">priya.k@example.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aug 14, 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹7,200</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Shipped</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href="#" className="text-indigo-600 hover:text-indigo-900 mr-3">View</a>
                    <a href="#" className="text-indigo-600 hover:text-indigo-900">Invoice</a>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#ORD-2023-1040</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xs">
                        AJ
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Amit Jain</div>
                        <div className="text-sm text-gray-500">amit.j@example.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aug 12, 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹94,500</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Processing</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href="#" className="text-indigo-600 hover:text-indigo-900 mr-3">View</a>
                    <a href="#" className="text-indigo-600 hover:text-indigo-900">Invoice</a>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#ORD-2023-1039</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-xs">
                        SM
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Sunita Mehta</div>
                        <div className="text-sm text-gray-500">sunita.m@example.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aug 10, 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹3,299</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Cancelled</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href="#" className="text-indigo-600 hover:text-indigo-900 mr-3">View</a>
                    <a href="#" className="text-indigo-600 hover:text-indigo-900">Invoice</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <div className="text-sm text-gray-600">Showing 4 of 42 orders</div>
            <div className="flex">
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-l-md">Previous</button>
              <button className="px-3 py-1 bg-red-600 text-white">1</button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700">2</button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700">3</button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-r-md">Next</button>
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
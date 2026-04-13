"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const [showClearDbModal, setShowClearDbModal] = useState(false);
  const [clearingDb, setClearingDb] = useState(false);
  const [clearDbResult, setClearDbResult] = useState<any>(null);

  const handleClearDatabase = async () => {
    setClearingDb(true);
    setClearDbResult(null);

    try {
      // Check if user is admin
      if (!user || user.role !== 'admin') {
        throw new Error("Admin privileges required");
      }

      // Get token from localStorage (as stored by AuthContext)
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch('/api/admin/clear-db', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to clear database');
      }

      setClearDbResult(result);
      setShowClearDbModal(false);
      alert('Database cleared successfully!');

    } catch (error: any) {
      console.error('Clear database error:', error);
      alert(`Failed to clear database: ${error.message}`);
    } finally {
      setClearingDb(false);
    }
  };

  return (
    <>
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
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                   General Settings
                 </button>
                 <button className="flex items-center w-full px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                   </svg>
                   Database Management
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
                    U
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
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 text-sm bg-gray-50"
                    readOnly
                    defaultValue="Employee"
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

          {/* Database Management Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
            <div className="p-6 bg-red-50 border-b border-red-200">
              <h3 className="text-lg font-medium text-red-800">Database Management</h3>
              <p className="text-sm text-red-600 mt-1">⚠️ Critical operations - Admin access required</p>
            </div>
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Warning: Data Loss Risk
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Clearing the database will permanently delete all business data including:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>All orders and estimates</li>
                        <li>All inventory records</li>
                        <li>All customer and supplier information</li>
                        <li>All product data</li>
                        <li>All employee and agent records</li>
                      </ul>
                      <p className="mt-2 font-medium">This action cannot be undone!</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Clear All Data</h4>
                  <p className="text-sm text-gray-500">Remove all business data while preserving admin accounts</p>
                </div>
                <button
                  onClick={() => setShowClearDbModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  disabled={clearingDb}
                >
                  {clearingDb ? 'Clearing...' : 'Clear Database'}
                </button>
              </div>

              {clearDbResult && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Database Cleared Successfully</h4>
                  <div className="text-sm text-green-700">
                    <p><strong>Preserved:</strong> {clearDbResult.details?.preservedAdmins || 0} admin accounts</p>
                    <p><strong>Deleted:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>{clearDbResult.details?.deletedUsers || 0} users</li>
                      <li>{clearDbResult.details?.deletedVendors || 0} vendors</li>
                      <li>{clearDbResult.details?.deletedProducts || 0} products</li>
                      <li>{clearDbResult.details?.deletedOrders || 0} orders</li>
                      <li>{clearDbResult.details?.deletedAgents || 0} agents</li>
                      <li>{clearDbResult.details?.deletedCustomers || 0} customers</li>
                      <li>{clearDbResult.details?.deletedEmployees || 0} employees</li>
                      <li>{clearDbResult.details?.deletedEstimates || 0} estimates</li>
                      <li>{clearDbResult.details?.deletedInventory || 0} inventory items</li>
                      <li>{clearDbResult.details?.deletedSuppliers || 0} suppliers</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Clear Database Confirmation Modal */}
      {showClearDbModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">⚠️ CRITICAL WARNING</h2>
              <button
                onClick={() => setShowClearDbModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      IRREVERSIBLE ACTION
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p className="font-semibold">This will permanently delete ALL business data:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Customer orders and estimates</li>
                        <li>Inventory and stock records</li>
                        <li>Product catalog</li>
                        <li>Customer and supplier data</li>
                        <li>Employee records</li>
                        <li>All transaction history</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      What will be preserved?
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Only admin user accounts will be kept. All other data will be permanently removed.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "CONFIRM" to proceed:
              </label>
              <input
                type="text"
                id="confirm-input"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                placeholder="Type CONFIRM here"
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClearDbModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                disabled={clearingDb}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const confirmInput = (document.getElementById('confirm-input') as HTMLInputElement)?.value;
                  if (confirmInput === 'CONFIRM') {
                    handleClearDatabase();
                  } else {
                    alert('Please type "CONFIRM" to proceed with database clearing.');
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                disabled={clearingDb}
              >
                {clearingDb ? 'Clearing Database...' : 'Yes, Clear Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
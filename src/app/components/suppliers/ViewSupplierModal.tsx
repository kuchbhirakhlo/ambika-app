"use client";

import { useState, useEffect } from "react";

interface Supplier {
  _id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ViewSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string | null;
}

export default function ViewSupplierModal({ isOpen, onClose, supplierId }: ViewSupplierModalProps) {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && supplierId) {
      fetchSupplierDetails();
    }
  }, [isOpen, supplierId]);

  const fetchSupplierDetails = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/suppliers/${supplierId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch supplier details");
      }
      
      setSupplier(data.supplier);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Supplier Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-500">Loading supplier details...</p>
          </div>
        ) : supplier ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Supplier ID</h3>
              <p className="mt-1 text-sm text-gray-900">{supplier._id}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Supplier Name</h3>
              <p className="mt-1 text-sm text-gray-900">{supplier.name}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Contact Person</h3>
              <p className="mt-1 text-sm text-gray-900">{supplier.contact}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-sm text-gray-900">{supplier.email}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p className="mt-1 text-sm text-gray-900">{supplier.phone}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Category</h3>
              <p className="mt-1 text-sm text-gray-900">{supplier.category}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1 text-sm text-gray-900">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${supplier.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {supplier.status}
                </span>
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(supplier.createdAt).toLocaleString()}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Updated At</h3>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(supplier.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">No supplier data found</p>
        )}
        
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 
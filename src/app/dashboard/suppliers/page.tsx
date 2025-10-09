"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddSupplierModal from "@/app/components/suppliers/AddSupplierModal";
import ViewSupplierModal from "@/app/components/suppliers/ViewSupplierModal";
import EditSupplierModal from "@/app/components/suppliers/EditSupplierModal";
import DeleteSupplierModal from "@/app/components/suppliers/DeleteSupplierModal";

// Define the Supplier interface
interface Supplier {
  _id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  category: string;
  status: string;
}

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [selectedSupplierName, setSelectedSupplierName] = useState("");

  // Fetch suppliers on load and when updated
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/suppliers");
      const data = await response.json();
      
      if (response.ok) {
        setSuppliers(data.suppliers || []);
      } else {
        console.error("Failed to fetch suppliers:", data.error);
        showNotification("error", "Failed to load suppliers");
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      showNotification("error", "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: string, message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleAddSuccess = () => {
    fetchSuppliers();
    showNotification("success", "Supplier added successfully");
  };

  const handleEditSuccess = () => {
    fetchSuppliers();
    showNotification("success", "Supplier updated successfully");
  };

  const handleDeleteSuccess = () => {
    fetchSuppliers();
    showNotification("success", "Supplier deleted successfully");
  };

  const handleView = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setIsViewModalOpen(true);
  };

  const handleEdit = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setIsEditModalOpen(true);
  };

  const handleDelete = (supplierId: string, supplierName: string) => {
    setSelectedSupplierId(supplierId);
    setSelectedSupplierName(supplierName);
    setIsDeleteModalOpen(true);
  };

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Supplier Management</h1>
        <p className="text-gray-600">View and manage your supplier relationships</p>
      </div>

      {notification && (
        <div
          className={`mb-4 p-3 rounded-md ${
            notification.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="mb-6 flex-col space-y-4 justify-between items-center">
        <div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-2"
          >
            Add Supplier
          </button>
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
            Export
          </button>
        </div>
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-500">Loading supplier data...</p>
        </div>
      ) : filteredSuppliers.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Desktop Table - hidden on small screens */}
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier Name ↕
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuppliers.map((supplier, index) => (
                  <tr key={supplier._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {supplier._id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {supplier.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {supplier.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {supplier.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleView(supplier._id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEdit(supplier._id)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(supplier._id, supplier.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout - shown only on small screens */}
          <div className="md:hidden">
            {filteredSuppliers.map((supplier, index) => (
              <div key={supplier._id} className={`p-4 border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="text-gray-900 font-medium">{supplier.name}</div>
                  <div className="text-gray-500 text-sm">ID: {supplier._id.substring(0, 8)}</div>
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  <span className="font-medium text-gray-700">Email:</span> {supplier.email}
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  <span className="font-medium text-gray-700">Phone:</span> {supplier.phone}
                </div>
                {supplier.category && (
                  <div className="text-sm text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">Category:</span> {supplier.category}
                  </div>
                )}
                {supplier.status && (
                  <div className="text-sm text-gray-500 mb-3">
                    <span className="font-medium text-gray-700">Status:</span> {supplier.status}
                  </div>
                )}
                <div className="flex justify-end space-x-2 mt-2">
                  <button 
                    onClick={() => handleView(supplier._id)}
                    className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => handleEdit(supplier._id)}
                    className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(supplier._id, supplier.name)}
                    className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between">
              <div className="text-sm text-gray-700 mb-2 sm:mb-0">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredSuppliers.length}</span> of{' '}
                <span className="font-medium">{filteredSuppliers.length}</span> results
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                    1
                  </button>
                  <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500">No suppliers found. {searchTerm && "Try a different search term or"} add a new supplier.</p>
        </div>
      )}
      
      {/* Modals */}
      <AddSupplierModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={handleAddSuccess} 
      />
      
      <ViewSupplierModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        supplierId={selectedSupplierId} 
      />
      
      <EditSupplierModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={handleEditSuccess} 
        supplierId={selectedSupplierId} 
      />
      
      <DeleteSupplierModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onSuccess={handleDeleteSuccess} 
        supplierId={selectedSupplierId}
        supplierName={selectedSupplierName}
      />
    </div>
  );
} 
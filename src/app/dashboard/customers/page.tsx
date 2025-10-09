"use client";

import { useState, useEffect } from "react";
import { generatePDF } from "@/utils/pdf-fix";

interface Customer {
  _id: string;
  name: string;
  contact: string;
  customer_ref_id: string;
  agent: string;
  address: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Agent {
  _id: string;
  name: string;
  contact: string;
  email?: string;
  city: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: "",
    contact: "",
    customer_ref_id: "",
    agent: "",
    address: "",
    email: "",
  });
  const [currentSortField, setCurrentSortField] = useState<string | null>("name");
  const [currentSortDirection, setCurrentSortDirection] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomers();
    loadAgents();
  }, []);

  useEffect(() => {
    filterCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, searchTerm, currentSortField, currentSortDirection]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching customers from API...');
      const response = await fetch('/api/customers');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API response error:', response.status, errorData);
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Customers loaded:', data.customers?.length || 0);
      setCustomers(data.customers || []);
      setError("");
    } catch (error) {
      console.error("Error loading customers:", error);
      setError("Failed to load customers. Please try again.");
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setAgents(data.agents);
    } catch (error) {
      console.error("Error loading agents:", error);
      setAgents([]);
    }
  };

  const filterCustomers = () => {
    const filtered = customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.contact && customer.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.agent && customer.agent.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.customer_ref_id && customer.customer_ref_id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });

    // Sort customers if a sort field is selected
    if (currentSortField) {
      filtered.sort((a, b) => {
        const valueA = (a[currentSortField as keyof Customer] || "").toString().toLowerCase();
        const valueB = (b[currentSortField as keyof Customer] || "").toString().toLowerCase();
        
        if (valueA < valueB) {
          return currentSortDirection === "asc" ? -1 : 1;
        }
        if (valueA > valueB) {
          return currentSortDirection === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredCustomers(filtered);
  };

  const handleAddCustomer = () => {
    setModalMode("add");
    setFormData({
      name: "",
      contact: "",
      customer_ref_id: "",
      agent: "",
      address: "",
      email: "",
    });
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setModalMode("edit");
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      contact: customer.contact,
      customer_ref_id: customer.customer_ref_id,
      agent: customer.agent,
      address: customer.address,
      email: customer.email || "",
    });
    setIsModalOpen(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/customers/${customer._id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        await loadCustomers(); // Reload the customers list
        setError("");
      } catch (error) {
        console.error("Error deleting customer:", error);
        setError("Failed to delete customer. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsViewModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      if (modalMode === "add") {
        // Validate form data
        if (!formData.name || !formData.contact || !formData.customer_ref_id || !formData.agent || !formData.address) {
          throw new Error("Please fill in all required fields");
        }
        
        console.log('Adding new customer:', formData);
        
        // Add new customer
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        let result;
        try {
          result = await response.json();
        } catch (err) {
          console.error('Error parsing JSON response:', err);
          throw new Error('Invalid response from server');
        }
        
        if (!response.ok) {
          console.error('API response error:', response.status, result);
          throw new Error(result.error || `Error: ${response.status}`);
        }
        
        console.log('Customer added successfully:', result);
        
        await loadCustomers(); // Reload the customers list
        closeModal();
        
        // Reset form for next entry
        setFormData({
          name: "",
          contact: "",
          customer_ref_id: "",
          agent: "",
          address: "",
          email: "",
        });
        
        // Show success message
        alert(`Customer ${formData.name} added successfully!`);
        setError("");
      } else {
        // Update existing customer
        if (!selectedCustomer) return;
        
        const response = await fetch(`/api/customers/${selectedCustomer._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        let result;
        try {
          result = await response.json();
        } catch (err) {
          console.error('Error parsing JSON response:', err);
          throw new Error('Invalid response from server');
        }
        
        if (!response.ok) {
          console.error('API response error:', response.status, result);
          throw new Error(result.error || `Error: ${response.status}`);
        }
        
        await loadCustomers(); // Reload the customers list
        closeModal();
        setError("");
      }
    } catch (error: any) {
      console.error("Error saving customer:", error);
      setError(error.message || "Failed to save customer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (currentSortField === field) {
      // If clicking the same field, toggle direction
      setCurrentSortDirection(currentSortDirection === "asc" ? "desc" : "asc");
    } else {
      // If clicking a new field, set it as current and default to asc
      setCurrentSortField(field);
      setCurrentSortDirection("asc");
    }
  };

  const handleGeneratePDF = async () => {
    try {
      // Create table data for PDF
      const tableData = filteredCustomers.map((customer, index) => [
        (index + 1).toString(),
        customer.customer_ref_id || '',
        customer.name,
        customer.contact,
        customer.agent || '',
        customer.address || '',
      ]);
      
      // Generate PDF with table
      await generatePDF({
        title: "Customer List",
        headers: ["S.No", "Customer ID", "Name", "Contact", "Agent", "Address/City"],
        data: tableData,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customer Management</h1>
        <p className="text-gray-600">View and manage your customer relationships</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700">
          {error}
        </div>
      )}
      
      <div className="mb-6 flex-col space-y-4 justify-between items-center">
        <div>
          <button
            onClick={handleAddCustomer}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-2"
          >
            Add Customer
          </button>
          <button 
            onClick={handleGeneratePDF}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Export PDF
          </button>
        </div>
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 w-64"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-500">Loading customer data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Desktop Table - hidden on small screens */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.No
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Name ↕
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address/City
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <p className="text-gray-500">No customers found</p>
                      {searchTerm && <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <tr key={customer._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.customer_ref_id || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.contact}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.agent || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.address || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout - shown only on small screens */}
          <div className="md:hidden">
            {filteredCustomers.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-gray-500">No customers found</p>
                {searchTerm && <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>}
              </div>
            ) : (
              filteredCustomers.map((customer, index) => (
                <div key={customer._id} className={`p-4 border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-gray-900 font-medium">{customer.name}</div>
                    <div className="text-gray-500 text-sm">{`#${index + 1}`}</div>
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">ID:</span> {customer.customer_ref_id || '-'}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">Contact:</span> {customer.contact}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">Agent:</span> {customer.agent || '-'}
                  </div>
                  <div className="text-sm text-gray-500 mb-3">
                    <span className="font-medium text-gray-700">Address:</span> {customer.address || '-'}
                  </div>
                  <div className="flex justify-end space-x-2 mt-2">
                    <button 
                      onClick={() => handleViewCustomer(customer)}
                      className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleEditCustomer(customer)}
                      className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteCustomer(customer)}
                      className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {modalMode === "add" ? "Add New Customer" : "Edit Customer"}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Name*</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Number*</label>
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    placeholder="Enter contact number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer ID*</label>
                  <input
                    type="text"
                    name="customer_ref_id"
                    value={formData.customer_ref_id || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    placeholder="Enter customer ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Agent*</label>
                  <select
                    name="agent"
                    value={formData.agent || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Agent</option>
                    {agents.map(agent => (
                      <option key={agent._id} value={agent.name}>{agent.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address/City*</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    placeholder="Enter address or city"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : modalMode === "add" ? "Add Customer" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* View Customer Modal */}
      {isViewModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Customer Details</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Customer Name</p>
                <p className="mt-1 text-sm text-gray-900">{selectedCustomer.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Customer ID</p>
                <p className="mt-1 text-sm text-gray-900">{selectedCustomer.customer_ref_id || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Contact Number</p>
                <p className="mt-1 text-sm text-gray-900">{selectedCustomer.contact}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1 text-sm text-gray-900">{selectedCustomer.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Agent</p>
                <p className="mt-1 text-sm text-gray-900">{selectedCustomer.agent || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Address/City</p>
                <p className="mt-1 text-sm text-gray-900">{selectedCustomer.address || '-'}</p>
              </div>
              {selectedCustomer.createdAt && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedCustomer.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface Order {
  _id: string;
  order_id: string;
  date: string;
  customer_name: string;
  total_amount: number;
  advance_amount: number;
  balance_amount: number;
  status: string;
  estimate_id?: string;
  items?: OrderItem[];
}

interface Product {
  _id: string;
  code: string;
  name: string;
  size?: string;
  category: string;
  supplier: string;
  price: number;
}

interface Customer {
  _id: string;
  name: string;
  contact: string;
  customer_ref_id: string;
  agent: string;
}

interface OrderItem {
  id: number;
  product_code: string;
  product_name: string;
  category: string;
  size: string;
  quantity: number;
  rate: number;
  total: number;
}

interface Estimate {
  _id: string;
  estimate_id: string;
  order_id: string;
  date: string;
  customer_name: string;
  agent_name: string;
  total_items: number;
  total_amount: number;
  status: string;
  items: OrderItem[];
}

export default function SalesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"orders" | "estimates">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [filteredEstimates, setFilteredEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Check if user is admin
  const isAdmin = user?.role === "admin";
  
  // New Order State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [newOrderId, setNewOrderId] = useState("");
  const [orderDate, setOrderDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [agentName, setAgentName] = useState("Admin User");
  const [customerName, setCustomerName] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { id: 1, product_code: "", product_name: "", category: "", size: "", quantity: 0, rate: 0, total: 0 }
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [nextId, setNextId] = useState(2);
  const [advanceAmount, setAdvanceAmount] = useState<number | string>("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState(0);

  // View/Edit Modal states
  const [showOrderViewModal, setShowOrderViewModal] = useState(false);
  const [showOrderEditModal, setShowOrderEditModal] = useState(false);
  const [showEstimateViewModal, setShowEstimateViewModal] = useState(false);
  const [showEstimateEditModal, setShowEstimateEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  
  // Estimate state
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isGeneratingEstimate, setIsGeneratingEstimate] = useState(false);

  useEffect(() => {
    // If user is not admin and trying to access estimates tab, switch to orders
    if (!isAdmin && activeTab === "estimates") {
      setActiveTab("orders");
      return;
    }
    
    if (activeTab === "orders") {
      loadOrders();
    } else if (activeTab === "estimates") {
      loadEstimates();
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (orders.length > 0 && activeTab === "orders") {
      filterOrders();
    }
  }, [orders, searchTerm]);

  useEffect(() => {
    if (estimates.length > 0 && activeTab === "estimates") {
      filterEstimates();
    }
  }, [estimates, searchTerm]);

  // Helper function to get numeric advance amount
  const getAdvanceAmountNumber = (): number => {
    return typeof advanceAmount === "string" ? 0 : advanceAmount;
  };

  // Calculate total and balance amounts
  useEffect(() => {
    const newTotal = calculateTotal();
    setTotalAmount(newTotal);
    setBalanceAmount(newTotal - getAdvanceAmountNumber());
  }, [orderItems, advanceAmount]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setOrders(data.orders || []);
      setError("");
    } catch (error) {
      console.error("Error loading orders:", error);
      setError("Failed to load orders. Please try again.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEstimates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/estimates');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setEstimates(data.estimates || []);
      setError("");
    } catch (error) {
      console.error("Error loading estimates:", error);
      setError("Failed to load estimates. Please try again.");
      setEstimates([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter(
      (order) =>
        order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredOrders(filtered);
  };

  const filterEstimates = () => {
    if (!searchTerm.trim()) {
      setFilteredEstimates(estimates);
      return;
    }

    const filtered = estimates.filter(
      (estimate) =>
        estimate.estimate_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        estimate.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredEstimates(filtered);
  };

  const handleTabChange = (tab: "orders" | "estimates") => {
    if (tab === "estimates" && !isAdmin) {
      return; // Don't allow employees to switch to estimates tab
    }
    setActiveTab(tab);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MM/dd/yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "No Estimate":
        return "bg-gray-100 text-gray-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Processing":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const viewOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setSelectedOrder(data.order);
      setShowOrderViewModal(true);
    } catch (error) {
      console.error("Error loading order:", error);
      setError("Failed to load order details. Please try again.");
    }
  };

  const editOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setSelectedOrder(data.order);
      setShowOrderEditModal(true);
    } catch (error) {
      console.error("Error loading order:", error);
      setError("Failed to load order details. Please try again.");
    }
  };

  const generateEstimate = async (orderId: string) => {
    if (!isAdmin) {
      alert("Only admin users can generate estimates.");
      return;
    }
    
    try {
      setIsGeneratingEstimate(true);
      
      // Fetch the order details
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      const order = data.order;
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      setCurrentOrder(order);
      
      // Check if order items exists and ensure it's not empty
      if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
        throw new Error('Order has no items. Cannot generate estimate.');
      }
      
      // Prepare estimate data
      const estimateData = {
        order_id: order.order_id,
        date: new Date().toISOString(),
        customer_name: order.customer_name,
        agent_name: agentName,
        total_items: order.items.length,
        total_amount: order.total_amount,
        status: 'Pending',
        items: order.items
      };
      
      // Create the estimate
      const createResponse = await fetch('/api/estimates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(estimateData),
      });
      
      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || `Error: ${createResponse.status}`);
      }
      
      const estimateResult = await createResponse.json();
      const estimateId = estimateResult.estimate?.estimate_id;
      
      // Show success message with estimate number
      if (estimateId) {
        alert(`Estimate ${estimateId} has been generated successfully.`);
      }
      
      // Reload both orders and estimates
      await loadOrders();
      await loadEstimates();
      setActiveTab("estimates");
      
    } catch (error: any) {
      console.error("Error generating estimate:", error);
      setError(error.message || "Failed to generate estimate. Please try again.");
    } finally {
      setIsGeneratingEstimate(false);
      setCurrentOrder(null);
    }
  };

  const viewEstimate = (estimateId: string) => {
    if (!isAdmin) {
      alert("Only admin users can view estimates.");
      return;
    }
    
    setActiveTab("estimates");
    // Scroll to the estimate in the estimates tab and highlight it
    setTimeout(() => {
      const element = document.getElementById(`estimate-${estimateId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        element.classList.add('highlight-row');
        setTimeout(() => {
          element.classList.remove('highlight-row');
        }, 2000);
      }
    }, 100);
  };

  // Estimate actions
  const viewEstimateDetails = async (estimateId: string) => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setSelectedEstimate(data.estimate);
      setShowEstimateViewModal(true);
    } catch (error) {
      console.error("Error loading estimate:", error);
      setError("Failed to load estimate details. Please try again.");
    }
  };

  const editEstimate = async (estimateId: string) => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setSelectedEstimate(data.estimate);
      setShowEstimateEditModal(true);
    } catch (error) {
      console.error("Error loading estimate:", error);
      setError("Failed to load estimate details. Please try again.");
    }
  };

  const deleteEstimate = async (estimateId: string) => {
    if (!window.confirm('Are you sure you want to delete this estimate?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/estimates/${estimateId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Reload both orders and estimates
      await loadEstimates();
      await loadOrders();
      
    } catch (error) {
      console.error("Error deleting estimate:", error);
      setError("Failed to delete estimate. Please try again.");
    }
  };

  const printEstimate = (estimateId: string) => {
    // Implementation for printing an estimate
    console.log("Print estimate:", estimateId);
    window.print();
  };

  const getEstimateStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // New Order Functions
  const openOrderModal = async () => {
    try {
      // Generate a new order ID
      const count = orders.length;
      const newId = `ORD-${String(count + 1).padStart(3, '0')}`;
      setNewOrderId(newId);
      
      // Load products and customers
      await loadProducts();
      await loadCustomers();
      
      setShowOrderModal(true);
    } catch (error) {
      console.error("Error preparing new order form:", error);
      setError("Failed to prepare new order form. Please try again.");
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error loading products:", error);
      setOrderError("Failed to load products. Please try again.");
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error("Error loading customers:", error);
      setOrderError("Failed to load customers. Please try again.");
    }
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setNewOrderId("");
    setOrderDate(format(new Date(), "yyyy-MM-dd"));
    setAgentName("Admin User");
    setCustomerName("");
    setOrderItems([
      { id: 1, product_code: "", product_name: "", category: "", size: "", quantity: 0, rate: 0, total: 0 }
    ]);
    setAdvanceAmount("");
    setTotalAmount(0);
    setBalanceAmount(0);
    setOrderError("");
    setNextId(2);
  };

  const handleProductCodeChange = (id: number, code: string) => {
    const product = products.find(p => p.code === code);
    
    setOrderItems(prevItems => 
      prevItems.map(item => 
        item.id === id 
          ? { 
              ...item, 
              product_code: code,
              product_name: product?.name || "",
              category: product?.category || "",
              size: product?.size || "",
              rate: product?.price || 0,
              total: (product?.price || 0) * item.quantity
            } 
          : item
      )
    );
  };

  const handleQuantityChange = (id: number, quantity: number) => {
    setOrderItems(prevItems => 
      prevItems.map(item => 
        item.id === id 
          ? { 
              ...item, 
              quantity,
              total: item.rate * quantity
            } 
          : item
      )
    );
  };

  const addProductRow = () => {
    setOrderItems(prevItems => [
      ...prevItems,
      { id: nextId, product_code: "", product_name: "", category: "", size: "", quantity: 0, rate: 0, total: 0 }
    ]);
    setNextId(prevId => prevId + 1);
  };

  const removeProductRow = (id: number) => {
    if (orderItems.length > 1) {
      setOrderItems(prevItems => prevItems.filter(item => item.id !== id));
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total, 0);
  };

  const saveOrder = async () => {
    try {
      setIsSaving(true);
      setOrderError("");
      
      if (!customerName.trim()) {
        setOrderError("Please select a customer");
        setIsSaving(false);
        return;
      }
      
      if (orderItems.length === 0 || !orderItems[0].product_code) {
        setOrderError("Please add at least one product");
        setIsSaving(false);
        return;
      }
      
      if (getAdvanceAmountNumber() > totalAmount) {
        setOrderError("Advance amount cannot exceed total amount");
        setIsSaving(false);
        return;
      }
      
      const formattedDate = new Date(orderDate).toISOString();
      const total = totalAmount;
      
      const orderData = {
        order_id: newOrderId,
        date: formattedDate,
        customer_name: customerName,
        total_amount: total,
        advance_amount: getAdvanceAmountNumber(),
        balance_amount: balanceAmount,
        status: "No Estimate",
        items: orderItems.map(item => ({
          product_code: item.product_code,
          product_name: item.product_name,
          category: item.category,
          size: item.size,
          quantity: item.quantity,
          rate: item.rate,
          total: item.total
        }))
      };
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Show success message
      alert(`Order ${newOrderId} has been created successfully.`);
      
      await loadOrders();
      closeOrderModal();
    } catch (error: any) {
      console.error("Error saving order:", error);
      setOrderError(error.message || "Failed to save order. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCustomerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCustomerName = event.target.value;
    setCustomerName(selectedCustomerName);
    
    // Find the customer and update agent name
    const selectedCustomer = customers.find(c => c.name === selectedCustomerName);
    if (selectedCustomer) {
      setAgentName(selectedCustomer.agent);
    }
  };

  // Modal close functions
  const closeOrderViewModal = () => {
    setShowOrderViewModal(false);
    setSelectedOrder(null);
  };

  const closeOrderEditModal = () => {
    setShowOrderEditModal(false);
    setSelectedOrder(null);
  };

  const closeEstimateViewModal = () => {
    setShowEstimateViewModal(false);
    setSelectedEstimate(null);
  };

  const closeEstimateEditModal = () => {
    setShowEstimateEditModal(false);
    setSelectedEstimate(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sales</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-2">
            <button
              className={`py-2 px-4 text-center border-b-2 font-medium ${
                activeTab === "orders"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => handleTabChange("orders")}
            >
              Orders
            </button>
            {isAdmin && (
              <button
                className={`py-2 px-4 text-center border-b-2 font-medium ${
                  activeTab === "estimates"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => handleTabChange("estimates")}
              >
                Estimates
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Orders Tab Content */}
      {activeTab === "orders" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Order Management</h2>
            <button
              className="bg-blue-600 text-black px-4 py-2 rounded-md hover:bg-blue-700"
              onClick={openOrderModal}
            >
              Add Order
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 w-full sm:w-64 text-gray-900"
            />
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-500">Loading orders...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center">
                          <p className="text-gray-500">No orders found</p>
                          {searchTerm && <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>}
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order, index) => (
                        <tr key={order._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.order_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.customer_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(order.total_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => viewOrder(order._id)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              View
                            </button>
                            <button
                              onClick={() => editOrder(order._id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Edit
                            </button>
                            {isAdmin && order.status === "No Estimate" ? (
                              <button
                                onClick={() => generateEstimate(order._id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Generate Estimate
                              </button>
                            ) : isAdmin && order.estimate_id ? (
                              <button
                                onClick={() => order.estimate_id && viewEstimate(order.estimate_id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View Estimate
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredOrders.length > 0 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">1</span> to{" "}
                      <span className="font-medium">{filteredOrders.length}</span> of{" "}
                      <span className="font-medium">{orders.length}</span> results
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
              )}
            </div>
          )}
        </div>
      )}

      {/* Estimates Tab Content */}
      {isAdmin && activeTab === "estimates" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Estimates Management</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search estimates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 w-full sm:w-64 text-gray-900"
            />
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-500">Loading estimates...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estimate ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Items
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEstimates.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center">
                          <p className="text-gray-500">No estimates found</p>
                          {searchTerm && <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>}
                        </td>
                      </tr>
                    ) : (
                      filteredEstimates.map((estimate, index) => (
                        <tr
                          key={estimate._id}
                          id={`estimate-${estimate.estimate_id}`}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {estimate.estimate_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(estimate.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {estimate.customer_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {estimate.agent_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {estimate.total_items}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(estimate.total_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstimateStatusBadgeColor(estimate.status)}`}>
                              {estimate.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => viewEstimateDetails(estimate.estimate_id)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              View
                            </button>
                            <button
                              onClick={() => editEstimate(estimate.estimate_id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteEstimate(estimate.estimate_id)}
                              className="text-red-600 hover:text-red-900 mr-3"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => printEstimate(estimate.estimate_id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Print
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredEstimates.length > 0 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">1</span> to{" "}
                      <span className="font-medium">{filteredEstimates.length}</span> of{" "}
                      <span className="font-medium">{estimates.length}</span> results
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
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-md bg-white">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Order</h2>
              
              {orderError && (
                <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700">
                  {orderError}
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 border-b pb-2">Order Details</h3>
                
                <div className="bg-gray-50 p-4 mb-4 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order Number
                      </label>
                      <input
                        type="text"
                        value={newOrderId}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:outline-none bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Agent Name
                      </label>
                      <input
                        type="text"
                        value={agentName}
                        readOnly
                        className="w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:outline-none bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Name
                      </label>
                      <select
                        value={customerName}
                        onChange={handleCustomerChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="">Select a customer</option>
                        {customers.map(customer => (
                          <option key={customer._id} value={customer.name}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sr Number
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product Code
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Availability
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.id}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={item.product_code}
                              onChange={(e) => handleProductCodeChange(item.id, e.target.value)}
                              className="w-full max-w-[140px] px-2 py-1 border border-gray-300 rounded-md text-gray-900"
                              list="product-list"
                            />
                            <datalist id="product-list">
                              {products.map(product => (
                                <option key={product._id} value={product.code} />
                              ))}
                            </datalist>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.product_name || "-"}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.category || "-"}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.size || "-"}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                              className="w-full max-w-[80px] px-2 py-1 border border-gray-300 rounded-md text-gray-900"
                            />
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.rate}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            ₹{item.total}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            -
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <button
                              onClick={() => removeProductRow(item.id)}
                              className="text-red-600 hover:text-red-800 mr-2"
                              disabled={orderItems.length === 1}
                            >
                              Remove
                            </button>
                            {item.id === orderItems[orderItems.length - 1].id && (
                              <button
                                onClick={addProductRow}
                                className="text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md"
                              >
                                Add
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Payment Summary */}
                <div className="mt-6 bg-gray-50 p-4 rounded-md">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total (₹)
                      </label>
                      <input
                        type="number"
                        value={totalAmount}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none bg-gray-100 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Advance (₹)
                      </label>
                      <input
                        type="number"
                        min=""
                        value={advanceAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            setAdvanceAmount("");
                          } else {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue) && numValue <= totalAmount) {
                              setAdvanceAmount(numValue);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder=""
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Balance (₹)
                      </label>
                      <input
                        type="number"
                        value={balanceAmount}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none bg-gray-100 text-gray-900"
                      />
                      </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={closeOrderModal}
                  className="bg-gray-500 text-black px-4 py-2 rounded-md hover:bg-gray-600"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={saveOrder}
                  className="bg-blue-600 text-black px-4 py-2 rounded-md hover:bg-blue-700"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order View Modal */}
      {showOrderViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">View Order Details</h2>
                <button
                  onClick={closeOrderViewModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                    <p className="text-sm text-gray-900">{selectedOrder.order_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedOrder.date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <p className="text-sm text-gray-900">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`px-2 text-black inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedOrder.total_amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedOrder.advance_amount || 0)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Balance Amount</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedOrder.balance_amount || 0)}</p>
                  </div>
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="overflow-x-auto">
                  <h3 className="text-lg font-semibold mb-2">Order Items</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{item.product_code}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{item.product_name}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.size}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.rate}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={closeOrderViewModal}
                  className="bg-gray-500 text-black px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Edit Modal */}
      {showOrderEditModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Edit Order</h2>
                <button
                  onClick={closeOrderEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                    <p className="text-sm text-gray-900">{selectedOrder.order_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedOrder.date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <p className="text-sm text-gray-900">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => setSelectedOrder({...selectedOrder, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="No Estimate">No Estimate</option>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedOrder.total_amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedOrder.advance_amount || 0)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Balance Amount</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedOrder.balance_amount || 0)}</p>
                  </div>
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="overflow-x-auto">
                  <h3 className="text-lg font-semibold mb-2">Order Items</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{item.product_code}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{item.product_name}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.size}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.rate}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={closeOrderEditModal}
                  className="bg-gray-500 text-black px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement save functionality
                    alert('Save functionality to be implemented');
                  }}
                  className="bg-blue-600 text-black px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estimate View Modal */}
      {showEstimateViewModal && selectedEstimate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">View Estimate Details</h2>
                <button
                  onClick={closeEstimateViewModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimate ID</label>
                    <p className="text-sm text-gray-900">{selectedEstimate.estimate_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedEstimate.date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <p className="text-sm text-gray-900">{selectedEstimate.customer_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                    <p className="text-sm text-gray-900">{selectedEstimate.agent_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Items</label>
                    <p className="text-sm text-gray-900">{selectedEstimate.total_items}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedEstimate.total_amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstimateStatusBadgeColor(selectedEstimate.status)}`}>
                      {selectedEstimate.status}
                    </span>
                  </div>
                </div>
              </div>

              {selectedEstimate.items && selectedEstimate.items.length > 0 && (
                <div className="overflow-x-auto">
                  <h3 className="text-lg font-semibold mb-2">Estimate Items</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedEstimate.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{item.product_code}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{item.product_name}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.size}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.rate}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={closeEstimateViewModal}
                  className="bg-gray-500 text-black px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estimate Edit Modal */}
      {showEstimateEditModal && selectedEstimate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Edit Estimate</h2>
                <button
                  onClick={closeEstimateEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimate ID</label>
                    <p className="text-sm text-gray-900">{selectedEstimate.estimate_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedEstimate.date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <p className="text-sm text-gray-900">{selectedEstimate.customer_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                    <p className="text-sm text-gray-900">{selectedEstimate.agent_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Items</label>
                    <p className="text-sm text-gray-900">{selectedEstimate.total_items}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedEstimate.total_amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={selectedEstimate.status}
                      onChange={(e) => setSelectedEstimate({...selectedEstimate, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {selectedEstimate.items && selectedEstimate.items.length > 0 && (
                <div className="overflow-x-auto">
                  <h3 className="text-lg font-semibold mb-2">Estimate Items</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedEstimate.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{item.product_code}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{item.product_name}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.size}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.rate}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={closeEstimateEditModal}
                  className="bg-gray-500 text-black px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement save functionality
                    alert('Save functionality to be implemented');
                  }}
                  className="bg-blue-600 text-black px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
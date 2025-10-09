"use client";

import { useState, useEffect } from "react";
import { generatePDF } from "@/utils/pdf-fix";

interface Order {
  id: number;
  order_number: string;
  date: string;
  customerName: string;
  items: Array<{ product_name: string; quantity: number; price: number }>;
  total: number;
  totalAmount?: number;
}

interface Estimate {
  id: number;
  estimate_number: string;
  date: string;
  customerName: string;
  status: string;
  items: Array<{ product_name: string; quantity: number; price: number }>;
  total: number;
  totalAmount?: number;
  order_number?: string;
}

interface InventoryItem {
  id: number;
  code: string;
  name: string;
  quantity: number;
  price: number;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'pending-orders' | 'inventory'>('orders');
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [pendingEstimates, setPendingEstimates] = useState<Estimate[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | Estimate | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
    setupUpdateListeners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load today's orders
      const today = new Date().toISOString().split('T')[0];
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const filteredOrders = allOrders.filter((order: Order) => {
        const orderDate = order.date ? 
          (order.date.includes('T') ? order.date.split('T')[0] : order.date) : '';
        return orderDate === today;
      });
      setTodayOrders(filteredOrders);

      // Load pending estimates
      const allEstimates = JSON.parse(localStorage.getItem('estimates') || '[]');
      const filteredEstimates = allEstimates.filter((estimate: Estimate) => 
        estimate.status && estimate.status.toLowerCase() === 'pending'
      );
      setPendingEstimates(filteredEstimates);

      // Load inventory
      let inventoryData = [];
      try {
        inventoryData = JSON.parse(localStorage.getItem('inventory') || '[]');
      } catch (error) {
        console.error('Error loading inventory:', error);
        inventoryData = [];
      }
      setInventory(inventoryData);
    } catch (error) {
      console.error('Error in loadDashboardData:', error);
    }
  };

  const setupUpdateListeners = () => {
    // Listen for storage events
    window.addEventListener('storage', (event) => {
      if (event.key === 'order-update-timestamp' || 
          event.key === 'estimate-update-timestamp' || 
          event.key === 'product-update-timestamp') {
        loadDashboardData();
      }
    });
  };

  const handleViewOrder = (order: Order | Estimate) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleViewInventory = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    setIsInventoryModalOpen(true);
  };

  const closeModal = () => {
    setIsOrderModalOpen(false);
    setIsInventoryModalOpen(false);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity < 20) return { class: 'bg-red-100 text-red-800', text: 'Low' };
    if (quantity < 30) return { class: 'bg-yellow-100 text-yellow-800', text: 'Medium' };
    return { class: 'bg-green-100 text-green-800', text: 'Good' };
  };

  const generateDashboardPDF = async () => {
    const ordersCount = todayOrders.length;
    const ordersValue = todayOrders.reduce((sum, order) => sum + (parseFloat(order.totalAmount?.toString() || order.total.toString()) || 0), 0);
    const pendingCount = pendingEstimates.length;
    const pendingValue = pendingEstimates.reduce((sum, estimate) => sum + (parseFloat(estimate.totalAmount?.toString() || estimate.total.toString()) || 0), 0);
    const lowStockCount = inventory.filter(item => item.quantity < 30).length;
    
    // Create data for PDF
    const headerData = ['Metric', 'Value'];
    const bodyData = [
      ["Today's Orders Count", ordersCount],
      ["Today's Orders Value", `₹${ordersValue.toFixed(2)}`],
      ["Pending Estimates Count", pendingCount],
      ["Pending Estimates Value", `₹${pendingValue.toFixed(2)}`],
      ["Low Stock Items Count", lowStockCount]
    ];
    
    // Generate PDF using our utility
    const success = await generatePDF(
      "Dashboard Report",
      headerData,
      bodyData,
      "dashboard_report.pdf"
    );
    
    if (!success) {
      console.error("Failed to generate dashboard PDF");
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">Dashboard Overview</h1>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div 
          className={`bg-white p-4 sm:p-6 rounded-lg shadow-md cursor-pointer transition transform hover:-translate-y-1 hover:shadow-lg ${activeTab === 'orders' ? 'border-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <h2 className="text-lg font-medium text-gray-800">Today's Orders</h2>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 my-2 sm:my-3">{todayOrders.length}</div>
          <div className="flex justify-between text-xs sm:text-sm text-gray-600">
            <span>Click to view details</span>
            <span>₹{todayOrders.reduce((sum, order) => sum + (parseFloat(order.totalAmount?.toString() || order.total.toString()) || 0), 0).toFixed(2)}</span>
          </div>
        </div>

        <div 
          className={`bg-white p-4 sm:p-6 rounded-lg shadow-md cursor-pointer transition transform hover:-translate-y-1 hover:shadow-lg ${activeTab === 'pending-orders' ? 'border-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('pending-orders')}
        >
          <h2 className="text-lg font-medium text-gray-800">Pending Estimates</h2>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 my-2 sm:my-3">{pendingEstimates.length}</div>
          <div className="flex justify-between text-xs sm:text-sm text-gray-600">
            <span>Awaiting approval</span>
            <span>₹{pendingEstimates.reduce((sum, estimate) => sum + (parseFloat(estimate.totalAmount?.toString() || estimate.total.toString()) || 0), 0).toFixed(2)}</span>
          </div>
        </div>

        <div 
          className={`bg-white p-4 sm:p-6 rounded-lg shadow-md cursor-pointer transition transform hover:-translate-y-1 hover:shadow-lg ${activeTab === 'inventory' ? 'border-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <h2 className="text-lg font-medium text-gray-800">Inventory Status</h2>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 my-2 sm:my-3">
            {inventory.filter(item => item.quantity < 30).length}
          </div>
          <div className="flex justify-between text-xs sm:text-sm text-gray-600">
            <span>Items with low stock</span>
            <span>Click to view details</span>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        {activeTab === 'orders' && (
          <>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Today's Orders</h3>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="hidden sm:table-cell px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {todayOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-2 sm:px-6 sm:py-4 text-center text-gray-500">No orders found for today</td>
                      </tr>
                    ) : (
                      todayOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{order.order_number || order.id}</td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{order.customerName || 'Unknown'}</td>
                          <td className="hidden sm:table-cell px-3 py-2 sm:px-6 sm:py-4 text-xs sm:text-sm text-gray-500">
                            {order.items && order.items.length > 0 
                              ? order.items.map(item => `${item.product_name} (${item.quantity})`).join(', ')
                              : 'No items'}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            ₹{(parseFloat(order.totalAmount?.toString() || order.total.toString()) || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                            <button 
                              onClick={() => handleViewOrder(order)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'pending-orders' && (
          <>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Pending Estimates</h3>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimate ID</th>
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="hidden sm:table-cell px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingEstimates.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-2 sm:px-6 sm:py-4 text-center text-gray-500">No pending estimates found</td>
                      </tr>
                    ) : (
                      pendingEstimates.map((estimate) => (
                        <tr key={estimate.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{estimate.estimate_number || estimate.id}</td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{new Date(estimate.date).toLocaleDateString()}</td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{estimate.customerName || 'Unknown'}</td>
                          <td className="hidden sm:table-cell px-3 py-2 sm:px-6 sm:py-4 text-xs sm:text-sm text-gray-500">
                            {estimate.items && estimate.items.length > 0 
                              ? estimate.items.map(item => `${item.product_name} (${item.quantity})`).join(', ')
                              : 'No items'}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            ₹{(parseFloat(estimate.totalAmount?.toString() || estimate.total.toString()) || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                            <button 
                              onClick={() => handleViewOrder(estimate)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'inventory' && (
          <>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Inventory Status</h3>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="hidden sm:table-cell px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventory.filter(item => item.quantity < 30).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-2 sm:px-6 sm:py-4 text-center text-gray-500">No low stock items found</td>
                      </tr>
                    ) : (
                      inventory
                        .filter(item => item.quantity < 30)
                        .map((item) => {
                          const status = getStockStatus(item.quantity);
                          return (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{item.code || 'Unknown'}</td>
                              <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{item.name || 'Unknown Product'}</td>
                              <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{item.quantity || 0}</td>
                              <td className="hidden sm:table-cell px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">₹{item.price ? item.price.toFixed(2) : '0.00'}</td>
                              <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 sm:py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.class}`}>
                                  {status.text}
                                </span>
                              </td>
                              <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                <button 
                                  onClick={() => handleViewInventory(item)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {isOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedOrder.hasOwnProperty('estimate_number') ? "Estimate Details" : "Order Details"}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium border-b border-gray-200 pb-2 mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 font-medium">
                    {selectedOrder.hasOwnProperty('estimate_number') ? 'Estimate Number:' : 'Order Number:'}
                  </p>
                  <p className="text-gray-800">
                    {(selectedOrder as any).estimate_number || selectedOrder.order_number || selectedOrder.id || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Date:</p>
                  <p className="text-gray-800">{new Date(selectedOrder.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Customer:</p>
                  <p className="text-gray-800">{selectedOrder.customerName || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Status:</p>
                  <p className="text-gray-800">{(selectedOrder as Estimate).status || 'Completed'}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Total:</p>
                  <p className="text-gray-800">₹{(parseFloat(selectedOrder.totalAmount?.toString() || selectedOrder.total.toString()) || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium border-b border-gray-200 pb-2 mb-3">Order Items</h3>
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {selectedOrder.items.map((item, index) => (
                    <li key={index} className="py-3">
                      <div className="font-medium">{item.product_name || 'Unknown Product'}</div>
                      <div className="text-sm text-gray-600">Quantity: {item.quantity || 0}</div>
                      <div className="text-sm text-gray-600">Price: ₹{item.price ? item.price.toFixed(2) : '0.00'}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No items in this {selectedOrder.hasOwnProperty('estimate_number') ? 'estimate' : 'order'}</p>
              )}
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Item Details Modal */}
      {isInventoryModalOpen && selectedInventoryItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Inventory Item Details</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium border-b border-gray-200 pb-2 mb-3">Basic Information</h3>
              <div className="space-y-3">
                <div className="flex border-b border-gray-100 py-2">
                  <span className="font-medium text-gray-600 w-1/3">Product Code:</span>
                  <span className="text-gray-800">{selectedInventoryItem.code || '-'}</span>
                </div>
                <div className="flex border-b border-gray-100 py-2">
                  <span className="font-medium text-gray-600 w-1/3">Product Name:</span>
                  <span className="text-gray-800">{selectedInventoryItem.name || '-'}</span>
                </div>
                <div className="flex border-b border-gray-100 py-2">
                  <span className="font-medium text-gray-600 w-1/3">Current Quantity:</span>
                  <span className="text-gray-800">{selectedInventoryItem.quantity || 0}</span>
                </div>
                <div className="flex border-b border-gray-100 py-2">
                  <span className="font-medium text-gray-600 w-1/3">Price:</span>
                  <span className="text-gray-800">₹{selectedInventoryItem.price ? selectedInventoryItem.price.toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex border-b border-gray-100 py-2">
                  <span className="font-medium text-gray-600 w-1/3">Status:</span>
                  <span className="text-gray-800">
                    {getStockStatus(selectedInventoryItem.quantity).text}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Close
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
"use client";

import { useState, useEffect } from "react";
import { useYear } from "@/contexts/YearContext";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

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
  items: any[];
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

interface InventoryItem {
  _id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  updated_at: string;
}

interface Order {
  _id: string;
  order_id: string;
  date: string;
  customer_name: string;
  total_amount: number;
  items?: any[];
}

export default function Reports() {
  const { selectedYear } = useYear();
  const [activeSection, setActiveSection] = useState<"pending-orders" | "agent-wise-estimates" | "order-comparison">("pending-orders");
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [pendingOrdersYear, setPendingOrdersYear] = useState(selectedYear);
  const [pendingOrdersAgent, setPendingOrdersAgent] = useState("");

  const [agentWiseYear, setAgentWiseYear] = useState(selectedYear);
  const [agentWiseAgent, setAgentWiseAgent] = useState("");
  const [agentWiseStatus, setAgentWiseStatus] = useState("");

  // Enable real-time sync for reports data
  useRealtimeSync({
    collections: ['orders', 'estimates', 'products', 'inventory'],
    onDataChange: () => {
      loadData();
    },
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [ordersRes, estimatesRes, productsRes, inventoryRes, agentsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/estimates'),
        fetch('/api/products'),
        fetch('/api/inventory'),
        fetch('/api/agents'),
      ]);

      const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [] };
      const estimatesData = estimatesRes.ok ? await estimatesRes.json() : { estimates: [] };
      const productsData = productsRes.ok ? await productsRes.json() : { products: [] };
      const inventoryData = inventoryRes.ok ? await inventoryRes.json() : { inventory: [] };
      const agentsData = agentsRes.ok ? await agentsRes.json() : { agents: [] };

      setOrders(ordersData.orders || []);
      setEstimates(estimatesData.estimates || []);
      setProducts(productsData.products || []);
      setInventory(inventoryData.inventory || []);
      setAgents(agentsData.agents || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  // Helper functions for sections
  const getFilteredPendingOrders = () => {
    let filtered = estimates.filter(est => est.status === 'Pending');
    if (pendingOrdersYear) {
      filtered = filtered.filter(est => {
        const d = new Date(est.date);
        return d.getFullYear().toString() === pendingOrdersYear;
      });
    }
    if (pendingOrdersAgent) {
      filtered = filtered.filter(est => est.agent_name?.trim().toLowerCase() === pendingOrdersAgent.trim().toLowerCase());
    }
    return filtered;
  };

  const getAgentWiseEstimates = () => {
    let filtered = estimates;
    if (agentWiseYear) {
      filtered = filtered.filter(est => {
        const d = new Date(est.date);
        return d.getFullYear().toString() === agentWiseYear;
      });
    }
    if (agentWiseAgent) {
      filtered = filtered.filter(est => est.agent_name?.trim().toLowerCase() === agentWiseAgent.trim().toLowerCase());
    }
    if (agentWiseStatus) {
      filtered = filtered.filter(est => est.status === agentWiseStatus);
    }
    return filtered;
  };

  const getAgentWiseTotals = () => {
    const filtered = getAgentWiseEstimates();
    const totalEstimates = filtered.length;
    const totalValue = filtered.reduce((sum, est) => sum + est.total_amount, 0);
    const uniqueAgents = new Set(filtered.map(est => est.agent_name));
    const totalAgents = uniqueAgents.size;
    return { totalEstimates, totalValue, totalAgents };
  };

  const getOrderComparisonData = () => {
    const productData: Record<string, {
      code: string;
      name: string;
      price: number;
      purchasedQty: number;
      soldQty: number;
      inStockQty: number;
    }> = {};

    // Initialize with products
    products.forEach(product => {
      productData[product.code] = {
        code: product.code,
        name: product.name,
        price: product.price,
        purchasedQty: 0,
        soldQty: 0,
        inStockQty: 0,
      };
    });

    // Add purchased quantities (from orders, assuming purchases are incoming)
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach((item: any) => {
          const code = item.product_code;
          if (productData[code]) {
            productData[code].purchasedQty += item.quantity || 0;
          }
        });
      }
    });

    // Add sold quantities (from estimates, assuming estimates represent sales)
    estimates.forEach(estimate => {
      if ((estimate.status === 'Pending' || estimate.status === 'Completed') && estimate.items) {
        estimate.items.forEach((item: any) => {
          const code = item.product_code;
          if (productData[code]) {
            productData[code].soldQty += item.quantity || 0;
          }
        });
      }
    });

    // Add in stock quantities
    inventory.forEach(inv => {
      const code = inv.product_code;
      if (productData[code]) {
        productData[code].inStockQty += inv.quantity || 0;
      }
    });

    return Object.values(productData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
        <p className="text-gray-600">Manage and view various reports</p>
      </div>

      {/* Section Buttons */}
      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => setActiveSection("pending-orders")}
          className={`px-6 py-3 rounded-lg font-medium ${
            activeSection === "pending-orders"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Pending Orders
        </button>
        <button
          onClick={() => setActiveSection("agent-wise-estimates")}
          className={`px-6 py-3 rounded-lg font-medium ${
            activeSection === "agent-wise-estimates"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Agent Wise Estimates
        </button>
        <button
          onClick={() => setActiveSection("order-comparison")}
          className={`px-6 py-3 rounded-lg font-medium ${
            activeSection === "order-comparison"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Order Comparison Chart
        </button>
      </div>

      {/* Pending Orders Section */}
      {activeSection === "pending-orders" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Pending Orders</h3>
            <p className="text-sm text-gray-500">View and manage pending orders for each customer</p>
          </div>

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Year</label>
              <select
                value={pendingOrdersYear}
                onChange={(e) => setPendingOrdersYear(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm text-black"
              >
                <option value="">All Years</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Agent</label>
               <select
                 value={pendingOrdersAgent}
                 onChange={(e) => setPendingOrdersAgent(e.target.value)}
                 className="w-full border border-gray-300 rounded-md p-2 text-sm text-black"
               >
                 <option value="">All Agents</option>
                 {agents.map(agent => (
                   <option key={agent.name} value={agent.name}>{agent.name}</option>
                 ))}
               </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimate ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredPendingOrders().map((estimate) => (
                  <tr key={estimate._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {estimate.estimate_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(estimate.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {estimate.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {estimate.agent_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(estimate.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {estimate.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Agent Wise Estimates Section */}
      {activeSection === "agent-wise-estimates" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Agent Wise Estimates</h3>
            <p className="text-sm text-gray-500">Track estimates created by sales agents</p>
          </div>

          {/* Totals */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{getAgentWiseTotals().totalEstimates}</div>
              <div className="text-sm text-gray-600">Total Estimates</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(getAgentWiseTotals().totalValue)}</div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{getAgentWiseTotals().totalAgents}</div>
              <div className="text-sm text-gray-600">Total Agents</div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Year</label>
              <select
                value={agentWiseYear}
                onChange={(e) => setAgentWiseYear(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm text-black"
              >
                <option value="">All Years</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Agent</label>
               <select
                 value={agentWiseAgent}
                 onChange={(e) => setAgentWiseAgent(e.target.value)}
                 className="w-full border border-gray-300 rounded-md p-2 text-sm text-black"
               >
                 <option value="">All Agents</option>
                 {agents.map(agent => (
                   <option key={agent.name} value={agent.name}>{agent.name}</option>
                 ))}
               </select>
             </div>
             <div>
              <label className="block text-sm font-medium text-black mb-1">Status</label>
              <select
                value={agentWiseStatus}
                onChange={(e) => setAgentWiseStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm text-black"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimate ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getAgentWiseEstimates().map((estimate) => (
                  <tr key={estimate._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {estimate.estimate_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(estimate.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {estimate.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {estimate.agent_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(estimate.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        estimate.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {estimate.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Comparison Chart Section */}
      {activeSection === "order-comparison" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Order Comparison Chart</h3>
            <p className="text-sm text-gray-500">View estimates by customer</p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price (₹)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchased Qty (All Time)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold Qty (from Sales)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">In Stock Qty</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getOrderComparisonData().map((product) => (
                  <tr key={product.code}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.purchasedQty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.soldQty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.inStockQty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

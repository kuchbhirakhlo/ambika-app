"use client";

import { useState, useEffect } from "react";
import { useYear } from "@/contexts/YearContext";

interface ReportData {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  topProducts: { name: string; sales: number }[];
  lowStockItems: { name: string; stock: number }[];
  monthlySales: { month: string; amount: number }[];
}

export default function Reports() {
  const { selectedYear } = useYear();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const loadReportData = async () => {
    try {
      setLoading(true);

      const [ordersRes, estimatesRes, productsRes, inventoryRes, customersRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/estimates'),
        fetch('/api/products'),
        fetch('/api/inventory'),
        fetch('/api/customers'),
      ]);

      const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [] };
      const estimatesData = estimatesRes.ok ? await estimatesRes.json() : { estimates: [] };
      const productsData = productsRes.ok ? await productsRes.json() : { products: [] };
      const inventoryData = inventoryRes.ok ? await inventoryRes.json() : { inventory: [] };
      const customersData = customersRes.ok ? await customersRes.json() : { customers: [] };

      const allOrders: any[] = ordersData.orders || [];
      const allEstimates: any[] = estimatesData.estimates || [];
      const allProducts: any[] = productsData.products || [];
      const allInventory: any[] = inventoryData.inventory || [];
      const allCustomers: any[] = customersData.customers || [];

      // Filter orders by selected year
      const yearOrders = allOrders.filter((order) => {
        const d = order.date ? new Date(order.date) : null;
        return d && !Number.isNaN(d.getTime()) && d.getFullYear().toString() === selectedYear;
      });

      // Filter estimates by selected year
      const yearEstimates = allEstimates.filter((est) => {
        const d = est.date ? new Date(est.date) : null;
        return d && !Number.isNaN(d.getTime()) && d.getFullYear().toString() === selectedYear;
      });

      // Filter inventory by selected year
      const yearInventory = allInventory.filter((item) => {
        const dateStr = item.updated_at || item.createdAt;
        const d = dateStr ? new Date(dateStr) : null;
        return d && !Number.isNaN(d.getTime()) && d.getFullYear().toString() === selectedYear;
      });

      // Calculate total sales from orders
      const totalSales = yearOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

      // Count unique customers from orders
      const uniqueCustomers = new Set(yearOrders.map(o => o.customer_name).filter(Boolean));

      // Build top products from order items
      const productSales: Record<string, number> = {};
      yearOrders.forEach((order) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const name = item.product_name || item.product_code || "Unknown";
            productSales[name] = (productSales[name] || 0) + (item.quantity || 0);
          });
        }
      });
      const topProducts = Object.entries(productSales)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      // Low stock items from year-filtered inventory
      const lowStockItems = yearInventory
        .filter(item => (item.quantity || 0) < 37)
        .map(item => ({ name: item.product_name || "Unknown", stock: item.quantity || 0 }))
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5);

      // Monthly sales breakdown
      const monthlySalesMap: Record<string, number> = {};
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      months.forEach(m => { monthlySalesMap[m] = 0; });
      yearOrders.forEach((order) => {
        const d = order.date ? new Date(order.date) : null;
        if (d && !Number.isNaN(d.getTime())) {
          const monthKey = months[d.getMonth()];
          monthlySalesMap[monthKey] = (monthlySalesMap[monthKey] || 0) + (order.total_amount || 0);
        }
      });
      const monthlySales = months.map(month => ({ month, amount: monthlySalesMap[month] || 0 }));

      setReportData({
        totalSales,
        totalOrders: yearOrders.length,
        totalCustomers: uniqueCustomers.size,
        totalProducts: allProducts.length,
        topProducts,
        lowStockItems,
        monthlySales,
      });
    } catch (error) {
      console.error("Error loading report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`Report "${selectedReport}" generated for year ${selectedYear}.`);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
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
        <p className="text-gray-600">Showing data for year: <span className="font-semibold">{selectedYear}</span></p>
      </div>

      {/* Key Metrics Cards */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(reportData.totalSales)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{reportData.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Customers</p>
                <p className="text-2xl font-semibold text-gray-900">{reportData.totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Products</p>
                <p className="text-2xl font-semibold text-gray-900">{reportData.totalProducts}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Sales Chart */}
      {reportData && reportData.monthlySales.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Monthly Sales - {selectedYear}</h3>
          <div className="overflow-x-auto">
            <div className="flex items-end space-x-2 min-w-[600px] h-48">
              {reportData.monthlySales.map((item) => {
                const maxAmount = Math.max(...reportData.monthlySales.map(s => s.amount), 1);
                const height = item.amount > 0 ? Math.max((item.amount / maxAmount) * 160, 8) : 4;
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center">
                    <span className="text-xs text-gray-600 mb-1">
                      {item.amount > 0 ? formatCurrency(item.amount) : "-"}
                    </span>
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${height}px` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-1">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-800 mb-1">Sales Reports</h3>
            <p className="text-sm text-gray-500">Track your sales performance over time</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setSelectedReport("daily-sales")}
              className="w-full flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-lg transition-colors"
            >
              <span className="flex items-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Daily Sales Report
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedReport("monthly-revenue")}
              className="w-full flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-lg transition-colors"
            >
              <span className="flex items-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Monthly Revenue
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedReport("product-performance")}
              className="w-full flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-lg transition-colors"
            >
              <span className="flex items-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Product Performance
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-800 mb-1">Inventory Reports</h3>
            <p className="text-sm text-gray-500">Manage your stock and inventory metrics</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setSelectedReport("stock-level")}
              className="w-full flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-lg transition-colors"
            >
              <span className="flex items-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Stock Level Report
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedReport("inventory-turnover")}
              className="w-full flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-lg transition-colors"
            >
              <span className="flex items-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Inventory Turnover
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedReport("low-stock-alert")}
              className="w-full flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-lg transition-colors"
            >
              <span className="flex items-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Low Stock Alert
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-800 mb-1">Quick Stats</h3>
            <p className="text-sm text-gray-500">Recent business insights for {selectedYear}</p>
          </div>
          <div className="space-y-4">
            {reportData && (
              <>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Top Selling Products</h4>
                  {reportData.topProducts.length > 0 ? (
                    reportData.topProducts.map((product, index) => (
                      <div key={index} className="flex justify-between text-sm py-1 border-b border-gray-100">
                        <span className="text-gray-600">{product.name}</span>
                        <span className="font-medium">{product.sales} units</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No sales data for {selectedYear}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Low Stock Items</h4>
                  {reportData.lowStockItems.length > 0 ? (
                    reportData.lowStockItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm py-1 border-b border-gray-100">
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-medium text-red-600">{item.stock} left</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No low stock items for {selectedYear}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Custom Report Generator */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Generate Custom Report</h3>
          <p className="text-sm text-gray-500 mt-1">Create a custom report with specific parameters and data points</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="">Select Report Type</option>
              <option value="sales">Sales Report</option>
              <option value="inventory">Inventory Report</option>
              <option value="customer">Customer Report</option>
              <option value="financial">Financial Report</option>
              <option value="vendor">Vendor Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input
              type="text"
              value={selectedYear}
              readOnly
              className="w-full border border-gray-300 rounded-md p-2 text-sm bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select className="w-full border border-gray-300 rounded-md p-2 text-sm">
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
              <option value="html">HTML</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Include Charts</label>
            <select className="w-full border border-gray-300 rounded-md p-2 text-sm">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
              rows={3}
              placeholder="Any specific requirements or filters for the report..."
            ></textarea>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              onClick={generateReport}
              disabled={!selectedReport || isGenerating}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm transition-colors flex items-center"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

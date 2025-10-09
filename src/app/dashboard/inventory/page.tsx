"use client";

import { useState, useEffect } from "react";

interface Product {
  _id: string;
  code: string;
  name: string;
  size?: string;
  category: string;
  supplier: string;
  price: number;
  quantity?: number;
  location?: string;
}

interface InventoryItem {
  _id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  size?: string;
  category?: string;
  quantity: number;
  price: number;
  location?: string;
  updated_at: string;
}

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [isAddPurchaseModalOpen, setIsAddPurchaseModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInventory();
    loadProducts();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, stockFilter]);

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      // Fetch inventory from API
      const response = await fetch('/api/inventory');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setInventory(data.inventory || []);
      setError("");
    } catch (error) {
      console.error("Error loading inventory:", error);
      setError("Failed to load inventory. Please try again.");
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      // Fetch products from API
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]);
    }
  };

  const filterInventory = () => {
    let filtered = inventory.filter((item) => {
      const matchesSearch =
        (item.product_name && item.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.product_code && item.product_code.toLowerCase().includes(searchTerm.toLowerCase()));

      if (stockFilter === "all") {
        return matchesSearch;
      } else if (stockFilter === "low") {
        return matchesSearch && item.quantity < 37;
      } else if (stockFilter === "medium") {
        return matchesSearch && item.quantity >= 37 && item.quantity <= 72;
      } else if (stockFilter === "high") {
        return matchesSearch && item.quantity > 72;
      }

      return matchesSearch;
    });

    // Sort by stock level (low to high)
    filtered.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));

    setFilteredInventory(filtered);
  };

  const getStockLevelText = (quantity: number) => {
    if (quantity < 37) return "Low";
    if (quantity <= 72) return "Medium";
    return "High";
  };

  const handleViewProduct = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  const handleUpdateStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setQuantityToAdd(1);
    setIsUpdateModalOpen(true);
  };

  const handleAddPurchase = () => {
    setIsAddPurchaseModalOpen(true);
  };

  const closeModal = () => {
    setIsViewModalOpen(false);
    setIsUpdateModalOpen(false);
    setIsAddPurchaseModalOpen(false);
    setSelectedItem(null);
    setSelectedProductId(null);
  };

  const confirmUpdateStock = async () => {
    if (!selectedItem || quantityToAdd <= 0) return;

    try {
      setIsLoading(true);
      const currentQuantity = selectedItem.quantity || 0;
      const newQuantity = currentQuantity + quantityToAdd;

      // Update inventory via API
      const response = await fetch(`/api/inventory/${selectedItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: newQuantity
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Reload inventory to get latest data
      await loadInventory();

      closeModal();
      alert(`Stock updated successfully!\n\nPrevious quantity: ${currentQuantity}\nAdded: ${quantityToAdd}\nNew total: ${newQuantity}`);
    } catch (error) {
      console.error("Error updating inventory:", error);
      alert("Failed to update inventory. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAddPurchase = async () => {
    if (!selectedProductId || quantityToAdd <= 0) return;

    try {
      setIsLoading(true);
      const selectedProduct = products.find(p => p._id === selectedProductId);
      if (!selectedProduct) {
        alert("Product not found");
        return;
      }

      // Check if product already exists in inventory
      const existingItem = inventory.find(item => item.product_id === selectedProductId);

      if (existingItem) {
        // Update existing inventory item
        const response = await fetch(`/api/inventory/${existingItem._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quantity: existingItem.quantity + quantityToAdd
          }),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
      } else {
        // Create new inventory item
        const response = await fetch('/api/inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: selectedProduct._id,
            product_code: selectedProduct.code,
            product_name: selectedProduct.name,
          size: selectedProduct.size,
          category: selectedProduct.category,
          quantity: quantityToAdd,
          price: selectedProduct.price,
          location: "Main Warehouse"
          }),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
      }

      // Reload inventory
      await loadInventory();

      closeModal();
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      alert(`Inventory updated successfully!\n\nPrevious quantity: ${currentQuantity}\nAdded: ${quantityToAdd}\nNew total: ${currentQuantity + quantityToAdd}`);
    } catch (error) {
      console.error("Error updating inventory:", error);
      alert("Failed to update inventory. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Count items by stock level
  const lowStockCount = inventory.filter(item => item.quantity < 37).length;
  const mediumStockCount = inventory.filter(item => item.quantity >= 37 && item.quantity <= 72).length;
  const highStockCount = inventory.filter(item => item.quantity > 72).length;

  return (
    <div className="container mx-auto px-4">
      {/* Stock summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-red-600 text-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-medium">Low Stock Items</h3>
          <div className="text-2xl sm:text-4xl font-bold my-2 sm:my-3">{lowStockCount}</div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span>0-36 units</span>
            <span>Critical</span>
          </div>
        </div>

        <div className="bg-blue-600 text-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-medium">Medium Stock Items</h3>
          <div className="text-2xl sm:text-4xl font-bold my-2 sm:my-3">{mediumStockCount}</div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span>37-72 units</span>
            <span>Warning</span>
          </div>
        </div>

        <div className="bg-green-600 text-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-medium">High Stock Items</h3>
          <div className="text-2xl sm:text-4xl font-bold my-2 sm:my-3">{highStockCount}</div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span>73+ units</span>
            <span>Good</span>
          </div>
        </div>
        
        <div className="bg-purple-600 text-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-medium">Total Products</h3>
          <div className="text-2xl sm:text-4xl font-bold my-2 sm:my-3">{inventory.length}</div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span>All items</span>
            <span>In inventory</span>
          </div>
        </div>
      </div>
            
      {/* Inventory table */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0 mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Inventory Status</h2>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <input
              type="text"
              placeholder="Search products..."
              className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full sm:w-auto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full sm:w-auto"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="all">All Stock Levels</option>
              <option value="low">Low Stock</option>
              <option value="medium">Medium Stock</option>
              <option value="high">High Stock</option>
            </select>
            <button 
              onClick={handleAddPurchase}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm w-full sm:w-auto"
            >
              Add Purchase
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-500">Loading inventory data...</p>
          </div>
        ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate (₹)</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-2 sm:px-6 sm:py-4 text-center text-gray-500">No inventory items found</td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr 
                        key={item._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewProduct(item)}
                    >
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{item.product_code || '-'}</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{item.product_name || '-'}</td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">₹{item.price ? item.price.toFixed(2) : '0.00'}</td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{item.quantity || 0}</td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 sm:py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.quantity < 37
                            ? "bg-red-100 text-red-800"
                            : item.quantity <= 72
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {getStockLevelText(item.quantity)}
                        </span>
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStock(item);
                          }}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
      
      {/* View Product Modal */}
      {isViewModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Product Details</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium border-b border-gray-200 pb-2 mb-3">Product Information</h3>
              <div className="space-y-3">
                <div className="flex border-b border-gray-100 py-2">
                  <span className="font-medium text-gray-600 w-1/3">Product Code:</span>
                  <span className="text-gray-800">{selectedItem.product_code || '-'}</span>
                </div>
                <div className="flex border-b border-gray-100 py-2">
                  <span className="font-medium text-gray-600 w-1/3">Product Name:</span>
                  <span className="text-gray-800">{selectedItem.product_name || '-'}</span>
                </div>
                <div className="flex border-b border-gray-100 py-2">
                  <span className="font-medium text-gray-600 w-1/3">Size:</span>
                  <span className="text-gray-800">{selectedItem.size || '-'}</span>
                </div>
                <div className="flex border-b border-gray-100 py-2">
                  <span className="font-medium text-gray-600 w-1/3">Category:</span>
                  <span className="text-gray-800">{selectedItem.category || '-'}</span>
                </div>
                <div className="flex border-b border-gray-100 py-2">
                  <span className="font-medium text-gray-600 w-1/3">Price:</span>
                  <span className="text-gray-800">₹{selectedItem.price ? selectedItem.price.toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex border-b border-gray-100 py-2">
                  <span className="font-medium text-gray-600 w-1/3">Quantity:</span>
                  <span className="text-gray-800">{selectedItem.quantity || 0}</span>
                </div>
                <div className="flex border-b border-gray-100 py-2">
                  <span className="font-medium text-gray-600 w-1/3">Location:</span>
                  <span className="text-gray-800">{selectedItem.location || 'Main Warehouse'}</span>
                </div>
                <div className="flex border-b border-gray-100 py-2">
                  <span className="font-medium text-gray-600 w-1/3">Status:</span>
                  <span className="text-gray-800">{getStockLevelText(selectedItem.quantity)}</span>
                </div>
                {selectedItem.updated_at && (
                  <div className="flex border-b border-gray-100 py-2">
                    <span className="font-medium text-gray-600 w-1/3">Last Updated:</span>
                    <span className="text-gray-800">{new Date(selectedItem.updated_at).toLocaleString()}</span>
                  </div>
                )}
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
                onClick={() => {
                  closeModal();
                  handleUpdateStock(selectedItem);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {isUpdateModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Update Stock for {selectedItem.product_name}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            
            <p className="mb-4">Current quantity: {selectedItem.quantity}</p>
            
            <div className="mb-6">
              <label htmlFor="quantity-select" className="block text-gray-700 mb-2">Quantity to ADD:</label>
              <select 
                id="quantity-select" 
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={quantityToAdd}
                onChange={(e) => setQuantityToAdd(parseInt(e.target.value))}
                autoFocus
              >
                {[...Array(100)].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}</option>
                ))}
              </select>
              <small className="text-gray-500 mt-1 block">This quantity will be ADDED to the existing inventory.</small>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={confirmUpdateStock}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Purchase Modal */}
      {isAddPurchaseModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Update Inventory</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            
            <p className="mb-4">Select a product to update inventory:</p>
            
            <div className="mb-4">
              <label htmlFor="product-select" className="block text-gray-700 mb-2">Product:</label>
              <select 
                id="product-select" 
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={selectedProductId || ""}
                onChange={(e) => setSelectedProductId(e.target.value)}
                autoFocus
              >
                <option value="">Select a product</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.code} - {p.name}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-6">
              <label htmlFor="add-quantity-select" className="block text-gray-700 mb-2">Quantity to ADD:</label>
              <select 
                id="add-quantity-select" 
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={quantityToAdd}
                onChange={(e) => setQuantityToAdd(parseInt(e.target.value))}
              >
                {[...Array(100)].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}</option>
                ))}
              </select>
              <small className="text-gray-500 mt-1 block">This quantity will be ADDED to the existing inventory.</small>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAddPurchase}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={!selectedProductId || isLoading}
              >
                {isLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
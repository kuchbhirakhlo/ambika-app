"use client";

import { useState, useEffect } from "react";
import { generatePDF } from "@/utils/pdf-fix";

interface Product {
  _id: string;
  code: string;
  name: string;
  size?: string;
  category: string;
  supplier: string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Supplier {
  _id: string;
  name: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    code: "",
    name: "",
    size: "",
    category: "",
    supplier: "",
    price: undefined,
  });
  const [currentSortField, setCurrentSortField] = useState<string | null>("name");
  const [currentSortDirection, setCurrentSortDirection] = useState<"asc" | "desc">("asc");
  const [codeError, setCodeError] = useState("");

  useEffect(() => {
    loadProducts();
    loadSuppliers();
  }, []);

  useEffect(() => {
    filterProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, searchTerm, categoryFilter, currentSortField, currentSortDirection]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching products from API...');
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API response error:', response.status, errorData);
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Products loaded:', data.products?.length || 0);
      setProducts(data.products || []);
      setError("");
    } catch (error) {
      console.error("Error loading products:", error);
      setError("Failed to load products. Please try again.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      setSuppliers([]);
    }
  };

  const filterProducts = () => {
    const filtered = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "" || product.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    // Sort products if a sort field is selected
    if (currentSortField) {
      filtered.sort((a, b) => {
        const valueA = (a[currentSortField as keyof Product] || "").toString().toLowerCase();
        const valueB = (b[currentSortField as keyof Product] || "").toString().toLowerCase();
        
        if (valueA < valueB) {
          return currentSortDirection === "asc" ? -1 : 1;
        }
        if (valueA > valueB) {
          return currentSortDirection === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredProducts(filtered);
  };

  const handleAddProduct = () => {
    setModalMode("add");
    setFormData({
      code: "",
      name: "",
      size: "",
      category: "",
      supplier: "",
      price: undefined,
    });
    setCodeError("");
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setModalMode("edit");
    setSelectedProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      size: product.size || "",
      category: product.category,
      supplier: product.supplier,
      price: product.price,
    });
    setCodeError("");
    setIsModalOpen(true);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${product._id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        await loadProducts(); // Reload the products list
        setError("");
      } catch (error) {
        console.error("Error deleting product:", error);
        setError("Failed to delete product. Please try again.");
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
    
    if (name === "code") {
      // Check for duplicate code
      const isDuplicate = products.some(
        p => p.code === value && (!selectedProduct || p._id !== selectedProduct._id)
      );
      
      if (isDuplicate) {
        setCodeError("This product code already exists. Please use a unique code.");
      } else {
        setCodeError("");
      }
    }
    
    setFormData({
      ...formData,
      [name]: name === "price" ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (codeError) {
      alert("Please fix the errors before submitting.");
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (modalMode === "add") {
        // Validate form data
        if (!formData.code || !formData.name || !formData.category || !formData.supplier) {
          throw new Error("Please fill in all required fields");
        }
        
        console.log('Adding new product:', formData);
        
        // Add new product
        const response = await fetch('/api/products', {
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
        
        console.log('Product added successfully:', result);
        
        await loadProducts(); // Reload the products list
        closeModal();
        
        // Reset form for next entry
        setFormData({
          code: "",
          name: "",
          size: "",
          category: "",
          supplier: "",
          price: undefined,
        });
        
        // Show success message
        alert(`Product ${formData.name} added successfully!`);
        setError("");
      } else {
        // Update existing product
        if (!selectedProduct) return;
        
        const response = await fetch(`/api/products/${selectedProduct._id}`, {
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
        
        await loadProducts(); // Reload the products list
        closeModal();
        setError("");
      }
    } catch (error: any) {
      console.error("Error saving product:", error);
      setError(error.message || "Failed to save product. Please try again.");
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
      const tableData = filteredProducts.map((product, index) => [
        (index + 1).toString(),
        product.code,
        product.name,
        product.size || '',
        product.category,
        product.supplier,
        `₹${product.price.toFixed(2)}`,
      ]);
      
      // Generate PDF with table
      await generatePDF({
        title: "Product List",
        headers: ["S.No", "Product Code", "Product Name", "Size", "Category", "Supplier", "Rate"],
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
        <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
        <p className="text-gray-600">View and manage your product catalog</p>
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
            onClick={handleAddProduct}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-2"
          >
            Add Product
          </button>
          <button 
            onClick={handleGeneratePDF}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Export PDF
          </button>
        </div>
        <div className="flex space-x-4 items-center">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 w-64"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2"
          >
            <option value="">All Categories</option>
            <option value="Sack">Sack</option>
            <option value="Kg sack">Kg sack</option>
            <option value="School bag">School bag</option>
            <option value="Teddy sack">Teddy sack</option>
            <option value="Tiffin bag">Tiffin bag</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-500">Loading product data...</p>
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
                    Product Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name ↕
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">
                      <p className="text-gray-500">No products found</p>
                      {searchTerm && <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, index) => (
                    <tr key={product._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.size || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.supplier}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{product.price.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewProduct(product)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
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
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-gray-500">No products found</p>
                {searchTerm && <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>}
              </div>
            ) : (
              filteredProducts.map((product, index) => (
                <div key={product._id} className={`p-4 border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-gray-900 font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">{`#${index + 1}`}</div>
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">Code:</span> {product.code}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">Size:</span> {product.size || '-'}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">Category:</span> {product.category}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">Supplier:</span> {product.supplier}
                  </div>
                  <div className="text-sm text-gray-500 mb-3">
                    <span className="font-medium text-gray-700">Rate:</span> ₹{product.price.toFixed(2)}
                  </div>
                  <div className="flex justify-end space-x-2 mt-2">
                    <button 
                      onClick={() => handleViewProduct(product)}
                      className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleEditProduct(product)}
                      className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product)}
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
      
      {/* View Product Modal */}
      {isViewModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Product Code</p>
                <p className="mt-1 text-sm text-gray-900">{selectedProduct.code}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Product Name</p>
                <p className="mt-1 text-sm text-gray-900">{selectedProduct.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Product Size</p>
                <p className="mt-1 text-sm text-gray-900">{selectedProduct.size || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Category</p>
                <p className="mt-1 text-sm text-gray-900">{selectedProduct.category}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Supplier</p>
                <p className="mt-1 text-sm text-gray-900">{selectedProduct.supplier}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Rate</p>
                <p className="mt-1 text-sm text-gray-900">₹{selectedProduct.price.toFixed(2)}</p>
              </div>
              {selectedProduct.createdAt && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedProduct.createdAt).toLocaleString()}
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
      
      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {modalMode === "add" ? "Add New Product" : "Edit Product"}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Code*</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code || ""}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border ${codeError ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    required
                    placeholder="Enter product code"
                  />
                  {codeError && <p className="text-red-500 text-sm mt-1">{codeError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Name*</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Size</label>
                  <input
                    type="text"
                    name="size"
                    value={formData.size || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter product size"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category*</label>
                  <select
                    name="category"
                    value={formData.category || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Sack">Sack</option>
                    <option value="Kg sack">Kg sack</option>
                    <option value="School bag">School bag</option>
                    <option value="Teddy sack">Teddy sack</option>
                    <option value="Tiffin bag">Tiffin bag</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Supplier*</label>
                  <select
                    name="supplier"
                    value={formData.supplier || ""}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier._id} value={supplier.name}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rate (₹)*</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price === undefined ? "" : formData.price}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    min="0"
                    step="0.01"
                    placeholder="Enter product rate"
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
                  disabled={isLoading || !!codeError}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : modalMode === "add" ? "Add Product" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
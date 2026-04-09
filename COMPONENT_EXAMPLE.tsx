/**
 * EXAMPLE: Complete Component with Real-Time Sync
 * 
 * This is a fully functional example showing how to:
 * 1. Fetch and display data with real-time sync
 * 2. Handle create, update, delete operations
 * 3. Show connection status
 * 4. Manage loading and error states
 */

'use client';

import { useState } from 'react';
import { useCollectionSync, DataChange } from '@/hooks/useRealtimeSync';

interface Product {
  _id: string;
  code: string;
  name: string;
  price: number;
  category: string;
  supplier: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ProductListPage() {
  // Real-time sync hook
  const {
    items: products,
    isLoading,
    isConnected,
    error: syncError,
    refetch,
  } = useCollectionSync<Product>('products');

  // Local state for form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    price: '',
    category: '',
    supplier: '',
  });
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setIsSaving(true);

    try {
      const url = editingId ? '/api/products' : '/api/products';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingId
            ? { id: editingId, ...formData }
            : formData
        ),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save product');
      }

      // Reset form
      setFormData({ code: '', name: '', price: '', category: '', supplier: '' });
      setShowForm(false);
      setEditingId(null);
      
      // Changes will appear automatically via real-time sync
      // No need to manually refetch!
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');
      // Item will disappear automatically via real-time sync
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  // Handle edit
  const handleEdit = (product: Product) => {
    setFormData({
      code: product.code,
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      supplier: product.supplier,
    });
    setEditingId(product._id);
    setShowForm(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header with Status */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="flex items-center gap-4">
          {/* Connection Status Indicator */}
          <div
            className={`px-4 py-2 rounded-lg font-semibold ${
              isConnected
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {isConnected ? '✓ Synced' : '✗ Offline'}
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>

          {/* Add Product Button */}
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ code: '', name: '', price: '', category: '', supplier: '' });
              setShowForm(true);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Error Messages */}
      {syncError && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">
          Sync Error: {syncError}
        </div>
      )}
      {apiError && (
        <div className="mb-4 p-4 bg-orange-100 text-orange-800 rounded-lg">
          {apiError}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Product Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                className="p-2 border rounded"
                disabled={isSaving}
              />
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="p-2 border rounded"
                disabled={isSaving}
              />
              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                step="0.01"
                className="p-2 border rounded"
                disabled={isSaving}
              />
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="p-2 border rounded"
                disabled={isSaving}
              />
              <input
                type="text"
                placeholder="Supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                required
                className="p-2 border rounded col-span-2"
                disabled={isSaving}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-8">
          <p>Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No products found. Create one to get started!</p>
        </div>
      ) : (
        /* Products Table */
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-3 text-left">Code</th>
                <th className="border p-3 text-left">Name</th>
                <th className="border p-3 text-right">Price</th>
                <th className="border p-3 text-left">Category</th>
                <th className="border p-3 text-left">Supplier</th>
                <th className="border p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="border p-3 font-mono">{product.code}</td>
                  <td className="border p-3">{product.name}</td>
                  <td className="border p-3 text-right">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="border p-3">{product.category}</td>
                  <td className="border p-3">{product.supplier}</td>
                  <td className="border p-3 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Status Footer */}
      <div className="mt-6 text-sm text-gray-600 text-center">
        Showing {products.length} product{products.length !== 1 ? 's' : ''} •{' '}
        {isConnected ? 'Real-time sync is active' : 'Offline mode'}
      </div>
    </div>
  );
}

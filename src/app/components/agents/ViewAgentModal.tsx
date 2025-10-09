"use client";

import { useState, useEffect } from "react";

interface Agent {
  _id: string;
  name: string;
  contact: string;
  email: string;
  city: string;
  createdAt: string;
  updatedAt: string;
}

interface ViewAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string | null;
}

export default function ViewAgentModal({ isOpen, onClose, agentId }: ViewAgentModalProps) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && agentId) {
      fetchAgentDetails();
    }
  }, [isOpen, agentId]);

  const fetchAgentDetails = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/agents/${agentId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch agent details");
      }
      
      setAgent(data.agent);
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
          <h2 className="text-xl font-bold">Agent Details</h2>
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
            <p className="mt-2 text-gray-500">Loading agent details...</p>
          </div>
        ) : agent ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Agent ID</h3>
              <p className="mt-1 text-sm text-gray-900">{agent._id}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Agent Name</h3>
              <p className="mt-1 text-sm text-gray-900">{agent.name}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Contact Number</h3>
              <p className="mt-1 text-sm text-gray-900">{agent.contact}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-sm text-gray-900">{agent.email || '-'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">City</h3>
              <p className="mt-1 text-sm text-gray-900">{agent.city}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(agent.createdAt).toLocaleString()}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Updated At</h3>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(agent.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">No agent data found</p>
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
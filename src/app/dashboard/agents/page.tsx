"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddAgentModal from "@/app/components/agents/AddAgentModal";
import ViewAgentModal from "@/app/components/agents/ViewAgentModal";
import EditAgentModal from "@/app/components/agents/EditAgentModal";
import DeleteAgentModal from "@/app/components/agents/DeleteAgentModal";

// Define the Agent interface
interface Agent {
  _id: string;
  name: string;
  contact: string;
  email: string;
  city: string;
}

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedAgentName, setSelectedAgentName] = useState("");

  // Fetch agents on load and when updated
  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/agents");
      const data = await response.json();
      
      if (response.ok) {
        setAgents(data.agents || []);
      } else {
        console.error("Failed to fetch agents:", data.error);
        showNotification("error", "Failed to load agents");
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      showNotification("error", "Failed to load agents");
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
    fetchAgents();
    showNotification("success", "Agent added successfully");
  };

  const handleEditSuccess = () => {
    fetchAgents();
    showNotification("success", "Agent updated successfully");
  };

  const handleDeleteSuccess = () => {
    fetchAgents();
    showNotification("success", "Agent deleted successfully");
  };

  const handleView = (agentId: string) => {
    setSelectedAgentId(agentId);
    setIsViewModalOpen(true);
  };

  const handleEdit = (agentId: string) => {
    setSelectedAgentId(agentId);
    setIsEditModalOpen(true);
  };

  const handleDelete = (agentId: string, agentName: string) => {
    setSelectedAgentId(agentId);
    setSelectedAgentName(agentName);
    setIsDeleteModalOpen(true);
  };

  // Filter agents based on search term
  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Agent Management</h1>
        <p className="text-gray-600">View and manage your agents</p>
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
            Add New Agent
          </button>
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
            Export
          </button>
        </div>
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-500">Loading agent data...</p>
        </div>
      ) : filteredAgents.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Desktop Table - hidden on small screens */}
          <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Serial Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAgents.map((agent, index) => (
                <tr key={agent._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {agent.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agent.contact}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agent.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleView(agent._id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleEdit(agent._id)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(agent._id, agent.name)}
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
            {filteredAgents.map((agent, index) => (
              <div key={agent._id} className={`p-4 border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="text-gray-900 font-medium">{agent.name}</div>
                  <div className="text-gray-500 text-sm">{`#${index + 1}`}</div>
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  <span className="font-medium text-gray-700">Contact:</span> {agent.contact}
                </div>
                {agent.city && (
                  <div className="text-sm text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">City:</span> {agent.city}
                  </div>
                )}
                {agent.email && (
                  <div className="text-sm text-gray-500 mb-3">
                    <span className="font-medium text-gray-700">Email:</span> {agent.email}
                  </div>
                )}
                <div className="flex justify-end space-x-2 mt-2">
                  <button 
                    onClick={() => handleView(agent._id)}
                    className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => handleEdit(agent._id)}
                    className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(agent._id, agent.name)}
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
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredAgents.length}</span> of{' '}
                <span className="font-medium">{filteredAgents.length}</span> results
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
          <p className="text-gray-500">No agents found. {searchTerm && "Try a different search term or"} add a new agent.</p>
        </div>
      )}
      
      {/* Modals */}
      <AddAgentModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={handleAddSuccess} 
      />
      
      <ViewAgentModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        agentId={selectedAgentId} 
      />
      
      <EditAgentModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={handleEditSuccess} 
        agentId={selectedAgentId} 
      />
      
      <DeleteAgentModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onSuccess={handleDeleteSuccess} 
        agentId={selectedAgentId}
        agentName={selectedAgentName}
      />
    </div>
  );
} 
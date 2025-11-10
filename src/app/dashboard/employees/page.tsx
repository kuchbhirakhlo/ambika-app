"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Define the Employee interface
interface Employee {
    _id: string;
    name?: string;
    username: string;
    email?: string;
    role: string;
    phone?: string;
    employeeId: string;
    createdAt: Date;
    updatedAt: Date;
}

export default function EmployeesPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState("");

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        phone: "",
        employeeId: "",
        password: "",
    });

    // Fetch employees on load and when updated
    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/employees");
            const data = await response.json();

            if (response.ok) {
                setEmployees(data.employees || []);
            } else {
                console.error("Failed to fetch employees:", data.error);
                showNotification("error", "Failed to load employees");
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
            showNotification("error", "Failed to load employees");
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
        fetchEmployees();
        showNotification("success", "Employee added successfully");
        setIsAddModalOpen(false);
        resetForm();
    };

    const handleEditSuccess = () => {
        fetchEmployees();
        showNotification("success", "Employee updated successfully");
        setIsEditModalOpen(false);
        resetForm();
    };

    const handleDeleteSuccess = () => {
        fetchEmployees();
        showNotification("success", "Employee deleted successfully");
        setIsDeleteModalOpen(false);
    };

    const handleEdit = (employee: Employee) => {
        setSelectedEmployeeId(employee._id);
        setFormData({
            name: employee.name || "",
            username: employee.username,
            email: employee.email || "",
            phone: employee.phone || "",
            employeeId: employee.employeeId,
            password: "", // Don't populate password for security
        });
        setIsEditModalOpen(true);
    };

    const handleDelete = (employeeId: string, employeeName: string) => {
        setSelectedEmployeeId(employeeId);
        setSelectedEmployeeName(employeeName);
        setIsDeleteModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            username: "",
            email: "",
            phone: "",
            employeeId: "",
            password: "",
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = isEditModalOpen ? `/api/employees/${selectedEmployeeId}` : "/api/employees";
            const method = isEditModalOpen ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                if (isEditModalOpen) {
                    handleEditSuccess();
                } else {
                    handleAddSuccess();
                }
            } else {
                showNotification("error", data.error || "Failed to save employee");
            }
        } catch (error) {
            console.error("Error saving employee:", error);
            showNotification("error", "Failed to save employee");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedEmployeeId) return;

        try {
            const response = await fetch(`/api/employees/${selectedEmployeeId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                handleDeleteSuccess();
            } else {
                const data = await response.json();
                showNotification("error", data.error || "Failed to delete employee");
            }
        } catch (error) {
            console.error("Error deleting employee:", error);
            showNotification("error", "Failed to delete employee");
        }
    };

    // Filter employees based on search term
    const filteredEmployees = employees.filter(
        (employee) =>
            (employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            employee.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
                <p className="text-gray-600">View and manage your employees</p>
            </div>

            {notification && (
                <div
                    className={`mb-4 p-3 rounded-md ${notification.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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
                        Add New Employee
                    </button>
                    <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
                        Export
                    </button>
                </div>
                <div className="flex items-center">
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border border-gray-300 rounded-md px-4 py-2 w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="mt-2 text-gray-500">Loading employee data...</p>
                </div>
            ) : filteredEmployees.length > 0 ? (
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
                                        Employee ID
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Username
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredEmployees.map((employee, index) => (
                                    <tr key={employee._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {employee.employeeId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {employee.name || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {employee.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {employee.email || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {employee.phone || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(employee)}
                                                className="text-green-600 hover:text-green-900 mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(employee._id, employee.name || employee.username)}
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
                        {filteredEmployees.map((employee, index) => (
                            <div key={employee._id} className={`p-4 border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-gray-900 font-medium">{employee.name || employee.username}</div>
                                    <div className="text-gray-500 text-sm">{`#${index + 1}`}</div>
                                </div>
                                <div className="text-sm text-gray-500 mb-1">
                                    <span className="font-medium text-gray-700">Employee ID:</span> {employee.employeeId}
                                </div>
                                <div className="text-sm text-gray-500 mb-1">
                                    <span className="font-medium text-gray-700">Username:</span> {employee.username}
                                </div>
                                {employee.email && (
                                    <div className="text-sm text-gray-500 mb-1">
                                        <span className="font-medium text-gray-700">Email:</span> {employee.email}
                                    </div>
                                )}
                                {employee.phone && (
                                    <div className="text-sm text-gray-500 mb-3">
                                        <span className="font-medium text-gray-700">Phone:</span> {employee.phone}
                                    </div>
                                )}
                                <div className="flex justify-end space-x-2 mt-2">
                                    <button
                                        onClick={() => handleEdit(employee)}
                                        className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(employee._id, employee.name || employee.username)}
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
                                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredEmployees.length}</span> of{' '}
                                <span className="font-medium">{filteredEmployees.length}</span> results
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
                    <p className="text-gray-500">No employees found. {searchTerm && "Try a different search term or"} add a new employee.</p>
                </div>
            )}

            {/* Add Employee Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Employee</h3>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Employee ID *</label>
                                    <input
                                        type="text"
                                        value={formData.employeeId}
                                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Username *</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Password *</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAddModalOpen(false);
                                            resetForm();
                                        }}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Add Employee
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Employee Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Employee</h3>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Employee ID *</label>
                                    <input
                                        type="text"
                                        value={formData.employeeId}
                                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Username *</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">New Password (leave blank to keep current)</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditModalOpen(false);
                                            resetForm();
                                        }}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Update Employee
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Employee Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Employee</h3>
                            <p className="text-gray-600 mb-4">
                                Are you sure you want to delete employee "{selectedEmployeeName}"? This action cannot be undone.
                            </p>
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
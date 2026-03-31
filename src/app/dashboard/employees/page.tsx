"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Employee {
    _id: string;
    name?: string;
    username: string;
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
    const [user, setUser] = useState<any>(null);
    const [userLoading, setUserLoading] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        phone: "",
        password: "",
    });

    useEffect(() => {
        const userStr = sessionStorage.getItem("user");
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                setUser(userData);
                if (userData.role !== 'admin') {
                    router.push("/dashboard");
                    return;
                }
            } catch {
                router.push("/login");
                return;
            }
        } else {
            router.push("/login");
            return;
        }
        setUserLoading(false);
    }, [router]);

    useEffect(() => {
        if (!userLoading && user?.role === 'admin') {
            fetchEmployees();
        }
    }, [userLoading, user]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/employees");
            const data = await response.json();

            if (response.ok) {
                setEmployees(data.employees || []);
            } else {
                showNotification("error", "Failed to load employees");
            }
        } catch (error) {
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
            phone: employee.phone || "",
            password: "",
        });
        setIsEditModalOpen(true);
    };

    const handleDelete = (employeeId: string, employeeName: string) => {
        setSelectedEmployeeId(employeeId);
        setSelectedEmployeeName(employeeName);
        setIsDeleteModalOpen(true);
    };

    const handleLogout = async (employeeId: string, employeeName: string) => {
        if (!window.confirm(`Are you sure you want to logout employee "${employeeName}"?`)) {
            return;
        }
        try {
            const response = await fetch(`/api/employees/${employeeId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "logout" }),
            });
            if (response.ok) {
                showNotification("success", `Employee logged out successfully`);
            } else {
                showNotification("error", "Failed to logout employee");
            }
        } catch (error) {
            showNotification("error", "Failed to logout employee");
        }
    };

    const resetForm = () => {
        setFormData({ name: "", username: "", phone: "", password: "" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isEditModalOpen ? `/api/employees/${selectedEmployeeId}` : "/api/employees";
            const method = isEditModalOpen ? "PUT" : "POST";
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok) {
                isEditModalOpen ? handleEditSuccess() : handleAddSuccess();
            } else {
                showNotification("error", data.error || "Failed to save employee");
            }
        } catch (error) {
            showNotification("error", "Failed to save employee");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedEmployeeId) return;
        try {
            const response = await fetch(`/api/employees/${selectedEmployeeId}`, { method: "DELETE" });
            if (response.ok) {
                handleDeleteSuccess();
            } else {
                showNotification("error", "Failed to delete employee");
            }
        } catch (error) {
            showNotification("error", "Failed to delete employee");
        }
    };

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
                <div className={`mb-4 p-3 rounded-md ${notification.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {notification.message}
                </div>
            )}

            <div className="mb-6 flex-col space-y-4 justify-between items-center">
                <div>
                    <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-2">
                        Add New Employee
                    </button>
                </div>
                <div className="flex items-center">
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border border-gray-300 rounded-md px-4 py-2 w-64 text-black"
                    />
                </div>
            </div>

            {userLoading ? (
                <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="mt-2 text-gray-500">Loading...</p>
                </div>
            ) : !user || user.role !== 'admin' ? (
                <div className="text-center py-10"><p className="text-gray-500">Access denied. Admin privileges required.</p></div>
            ) : loading ? (
                <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="mt-2 text-gray-500">Loading employee data...</p>
                </div>
            ) : filteredEmployees.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="hidden md:block">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredEmployees.map((employee, index) => (
                                    <tr key={employee._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{employee.employeeId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.name || "N/A"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.phone || "N/A"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEdit(employee)} className="text-green-600 hover:text-green-900 mr-3">Edit</button>
                                            <button onClick={() => handleLogout(employee._id, employee.name || employee.username)} className="text-orange-600 hover:text-orange-900 mr-3">Logout</button>
                                            <button onClick={() => handleDelete(employee._id, employee.name || employee.username)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                        <div className="text-sm text-gray-700">Showing 1 to {filteredEmployees.length} of {filteredEmployees.length} results</div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-lg shadow">
                    <p className="text-gray-500">No employees found.</p>
                </div>
            )}

            {/* Add Employee Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Add New Employee</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="shadow border rounded w-full py-2 px-3 text-black" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Username *</label>
                                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="shadow border rounded w-full py-2 px-3 text-black" required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Phone</label>
                                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="shadow border rounded w-full py-2 px-3 text-black" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Password *</label>
                                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="shadow border rounded w-full py-2 px-3 text-black" required />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Add Employee</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Employee Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Edit Employee</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="shadow border rounded w-full py-2 px-3 text-black" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Username *</label>
                                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="shadow border rounded w-full py-2 px-3 text-black" required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Phone</label>
                                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="shadow border rounded w-full py-2 px-3 text-black" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">New Password (leave blank)</label>
                                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="shadow border rounded w-full py-2 px-3 text-black" />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => { setIsEditModalOpen(false); resetForm(); }} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Employee Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Delete Employee</h2>
                        <p className="mb-4">Are you sure you want to delete "{selectedEmployeeName}"?</p>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                            <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

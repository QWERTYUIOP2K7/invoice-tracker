import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, clientAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { FiSearch, FiTrash2, FiCheck, FiX } from 'react-icons/fi';

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClientsMap, setSelectedClientsMap] = useState({}); // Map userId to selectedClients

  useEffect(() => {
    fetchUsers();
    fetchClients();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await userAPI.getUsers(params);
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await clientAPI.getClients();
      setClients(res.data.clients || []);
    } catch (err) {
      console.error('Failed to load clients');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleDeactivate = async (userId, userName) => {
    if (!window.confirm(`Deactivate ${userName}?`)) return;

    try {
      await userAPI.deleteUser(userId);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const handleApproveUser = async (userId) => {
    const selected = selectedClientsMap[userId] || [];

    if (selected.length === 0) {
      alert('Please select at least one client');
      return;
    }

    try {
      await userAPI.approveUser(userId, { clientIds: selected });
      fetchUsers();
      setSelectedClientsMap(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve user');
    }
  };

  const handleRejectUser = async (userId) => {
    if (!window.confirm('Reject this user registration?')) return;
    try {
      await userAPI.rejectUser(userId);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject user');
    }
  };
  const handleViewUser = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      finance: 'bg-blue-100 text-blue-800',
      client: 'bg-green-100 text-green-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">Manage all system users and approve pending registrations</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 mb-6">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white border border-gray-200 p-6 mb-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Name or email..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Role Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="finance">Finance</option>
                    <option value="client">Client</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending_approval">Pending Approval</option>
                  </select>
                </div>

                {/* Search Button */}
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Search
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">All Users ({users.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Assigned Clients</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 text-gray-700 text-sm">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-medium rounded ${getRoleBadge(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {user.assignedClients && user.assignedClients.length > 0 ? (
                            <div className="space-y-1">
                              {user.assignedClients.map((client, idx) => (
                                <div key={idx} className="text-gray-700">
                                  {client.clientCode} - {client.companyName}
                                </div>
                              ))}
                            </div>
                          ) : user.clientId ? (
                            <div>
                              <p className="font-medium">{user.clientId.companyName}</p>
                              <p className="text-xs text-gray-500">{user.clientId.clientCode}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(user.status)}`}>
                            {user.status === 'pending_approval' ? 'Pending Approval' : user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.status === 'pending_approval' ? (
                            <div className="space-y-2">
                              <select
                                multiple
                                value={selectedClientsMap[user._id] || []}
                                onChange={(e) => setSelectedClientsMap(prev => ({
                                  ...prev,
                                  [user._id]: Array.from(e.target.selectedOptions, option => option.value)
                                }))}
                                className="w-full px-2 py-1 border border-gray-300 text-xs rounded"
                              >
                                {clients.map(client => (
                                  <option key={client._id} value={client._id}>
                                    {client.clientCode} - {client.companyName}
                                  </option>
                                ))}
                              </select>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveUser(user._id)}
                                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded"
                                >
                                  <FiCheck size={14} /> Approve
                                </button>
                                <button
                                  onClick={() => handleRejectUser(user._id)}
                                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded"
                                >
                                  <FiX size={14} /> Reject
                                </button>
                              </div>
                            </div>
                          ) : user.status === 'active' ? (
                            <button
                              onClick={() => handleDeactivate(user._id, user.name)}
                              className="p-2 hover:bg-red-100 text-red-600 rounded"
                              title="Deactivate"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                          {user.role === 'finance' && (
                            <button
                              onClick={() => handleViewUser(user._id)}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
                            >
                              View Profile
                            </button>
                          )}
                          {user.status === 'inactive' && (
                            <button
                              onClick={async () => {
                                try {
                                  await userAPI.reactivateUser(user._id);
                                  fetchUsers();
                                } catch (err) {
                                  alert(err.response?.data?.message || 'Failed to reactivate');
                                }
                              }}
                              className="px-3 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded"
                            >
                              Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
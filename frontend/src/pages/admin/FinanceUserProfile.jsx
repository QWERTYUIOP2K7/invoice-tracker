import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userAPI, clientAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { FiArrowLeft, FiPlus, FiTrash2, FiSave } from 'react-icons/fi';

export default function FinanceUserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [allClients, setAllClients] = useState([]);
  const [assignedClients, setAssignedClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedClientToAdd, setSelectedClientToAdd] = useState('');

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, clientsRes] = await Promise.all([
        userAPI.getUser(userId),
        clientAPI.getClients(),
      ]);

      setUser(userRes.data.user);
      setAllClients(clientsRes.data.clients || []);
      setAssignedClients(userRes.data.user.assignedClients || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!selectedClientToAdd) {
      alert('Please select a client');
      return;
    }

    if (assignedClients.some(c => c._id === selectedClientToAdd)) {
      alert('Client already assigned');
      return;
    }

    const clientToAdd = allClients.find(c => c._id === selectedClientToAdd);
    setAssignedClients([...assignedClients, clientToAdd]);
    setSelectedClientToAdd('');
  };

  const handleRemoveClient = (clientId) => {
    setAssignedClients(assignedClients.filter(c => c._id !== clientId));
  };

  const handleSave = async () => {
    if (assignedClients.length === 0) {
      alert('At least one client must be assigned');
      return;
    }

    setSaving(true);
    try {
      await userAPI.updateUser(userId, {
        assignedClients: assignedClients.map(c => c._id),
        clientId: assignedClients[0]._id, // Primary client
      });
      alert('Clients updated successfully');
      navigate('/admin/users');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update clients');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  if (error || !user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 p-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
          >
            <FiArrowLeft size={18} /> Back
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4">
            {error || 'User not found'}
          </div>
        </div>
      </>
    );
  }

  const availableClients = allClients.filter(
    client => !assignedClients.some(c => c._id === client._id)
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
          >
            <FiArrowLeft size={18} /> Back to Users
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 mb-8">
              {error}
            </div>
          )}

          {/* User Info */}
          <div className="bg-white border border-gray-200 p-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
            <p className="text-gray-600 mb-6">{user.email}</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Role</p>
                <p className="font-medium text-gray-900">{user.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className={`px-3 py-1 text-sm font-medium rounded ${
                  user.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Registered</p>
                <p className="font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
              {user.inviteCode && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Invite Code</p>
                  <p className="font-medium text-gray-900">{user.inviteCode}</p>
                </div>
              )}
            </div>
          </div>

          {/* Client Assignment */}
          <div className="bg-white border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Assigned Clients</h2>

            {/* Add Client Section */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold text-gray-900 mb-4">Add New Client</h3>
              <div className="flex gap-2">
                <select
                  value={selectedClientToAdd}
                  onChange={(e) => setSelectedClientToAdd(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded bg-white"
                >
                  <option value="">Select a client...</option>
                  {availableClients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.clientCode} - {client.companyName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddClient}
                  disabled={!selectedClientToAdd}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center gap-2"
                >
                  <FiPlus size={18} /> Add
                </button>
              </div>
            </div>

            {/* Assigned Clients List */}
            {assignedClients.length === 0 ? (
              <p className="text-gray-500 italic">No clients assigned</p>
            ) : (
              <div className="space-y-3">
                {assignedClients.map((client, index) => (
                  <div
                    key={client._id}
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {client.clientCode} - {client.companyName}
                        </p>
                        {index === 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{client.location}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveClient(client._id)}
                      disabled={assignedClients.length === 1}
                      className="p-2 hover:bg-red-100 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                      title={assignedClients.length === 1 ? 'At least one client required' : 'Remove client'}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded"
              >
                <FiSave size={18} /> Save Changes
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
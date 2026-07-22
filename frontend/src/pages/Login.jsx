import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setUser, setError, clearError } from '../store/authSlice';
import { authAPI } from '../services/api';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import AdminRegistrationModal from '../components/AdminRegistrationModal';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(setLoading(true));

    try {
      const response = await authAPI.login(email, password);
      dispatch(setUser({ user: response.data.user, token: response.data.token }));

      // Redirect based on role
      const role = response.data.user.role;
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'finance') navigate('/finance/dashboard');
      else navigate('/client/dashboard');
    } catch (err) {
      dispatch(setError(err.response?.data?.message || 'Login failed'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Invoice Portal
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Sign in to your account
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <FiAlertCircle size={20} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 space-y-3 border-t border-gray-200 pt-6">
            <p className="text-center text-sm text-gray-600">
              New user?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Client Registration
              </Link>
            </p>
            <p className="text-center text-sm text-gray-600">
              Finance team?{' '}
              <Link to="/register-finance" className="text-blue-600 hover:text-blue-700 font-medium">
                Finance Registration
              </Link>
            </p>
            <p className="text-center text-sm text-gray-600">
              Admin setup?{' '}
              <button
                type="button"
                onClick={() => setShowAdminModal(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create Admin Account
              </button>
            </p>
          </div>
        </div>
      </div>

      {showAdminModal && <AdminRegistrationModal onClose={() => setShowAdminModal(false)} />}
    </>
  );
}
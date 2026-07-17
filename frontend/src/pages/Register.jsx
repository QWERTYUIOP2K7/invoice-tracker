import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import Navbar from '../components/Navbar';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clientCode, setClientCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const code = searchParams.get('clientCode');
    if (!code) {
      setError('Invalid registration link. Please use the link provided by your finance team.');
    } else {
      setClientCode(code);
      setError(null);
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Full name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!clientCode) {
      setError('Invalid client code');
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.registerClient(
        formData.name.trim(),
        formData.email.trim(),
        formData.password,
        clientCode
      );

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Redirect based on role
      if (res.data.user.role === 'client') {
        navigate('/client/dashboard');
      } else {
        navigate('/finance/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 p-8 max-w-md w-full shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600 mb-6">Complete your registration to get started</p>

          {clientCode && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 mb-6 text-sm">
              Registering for: <strong>{clientCode}</strong>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm">
              {error}
            </div>
          )}

          {clientCode ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 text-sm"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded transition"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading registration form...</p>
            </div>
          )}

          <p className="text-sm text-gray-600 mt-6 text-center">
            Already have an account? <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</a>
          </p>
        </div>
      </div>
    </>
  );
}
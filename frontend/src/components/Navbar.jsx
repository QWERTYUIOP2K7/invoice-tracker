import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';
import { FiLogOut, FiUser } from 'react-icons/fi';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Invoice Portal</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <FiUser size={18} className="text-gray-600" />
          <span className="text-sm text-gray-700">
            {user?.name} <span className="text-xs text-gray-500">({user?.role})</span>
          </span>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 border border-red-700"
        >
          <FiLogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}
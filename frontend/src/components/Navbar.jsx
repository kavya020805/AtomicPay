import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Wallet, Zap } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const formatMoney = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-neutral-800/50 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Atomic<span className="text-emerald-400">Pay</span>
          </span>
          <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded">v2.0</span>
        </div>

        {/* Right Side */}
        {user && (
          <div className="flex items-center gap-4">
            {/* Balance Chip */}
            <div className="flex items-center gap-2 bg-neutral-900/80 border border-neutral-800 rounded-full px-3 py-1.5">
              <Wallet size={14} className="text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">
                {formatMoney(user.balance_in_cents || 0)}
              </span>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-xs font-bold text-white border border-neutral-700">
                {user.username?.charAt(0)?.toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-neutral-200 leading-none">{user.username}</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">{user.email}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all duration-200"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

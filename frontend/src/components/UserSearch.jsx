import { useState, useEffect, useRef } from 'react';
import { Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserSearch({ onSelect, selectedUser }) {
  const { authFetch } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await authFetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, authFetch]);

  const handleSelect = (user) => {
    onSelect(user);
    setQuery(user.username);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    onSelect(null);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="text-sm font-medium text-neutral-400 mb-1.5 block">Recipient</label>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selectedUser) onSelect(null);
          }}
          placeholder="Search by username..."
          className="w-full bg-black border border-neutral-800 text-white rounded-lg pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-neutral-600"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
          >
            ✕
          </button>
        )}
        {isLoading && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg shadow-xl overflow-hidden">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-900 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-200">{user.username}</p>
                <p className="text-[10px] text-neutral-500">{user.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 1 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg shadow-xl p-4">
          <p className="text-sm text-neutral-500 text-center">No users found</p>
        </div>
      )}

      {/* Selected user indicator */}
      {selectedUser && (
        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
          <User size={12} />
          <span>Sending to <strong>{selectedUser.username}</strong></span>
        </div>
      )}
    </div>
  );
}

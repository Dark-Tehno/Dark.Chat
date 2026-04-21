import { useState, useRef, useEffect } from 'react';
import { apiService, User } from '../../services/api';
import { X, Search, MessageCircle, CircleUser as UserCircle, MoreVertical } from 'lucide-react';
import { getMediaUrl } from '../../utils/media';

interface UserSearchProps {
  onClose: () => void;
  onStartChat: (username: string) => void;
}

export function UserSearch({ onClose, onStartChat }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeDropdownUserId, setActiveDropdownUserId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownUserId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (userId: number) => {
    setActiveDropdownUserId(prevId => (prevId === userId ? null : userId));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const data = await apiService.searchUsers(query);
      setResults(data.users || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChat = (username: string) => {
    onStartChat(username);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-green-500/30 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col neon-border">
        <div className="p-4 border-b border-green-500/30 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-green-400">Search Users</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username..."
              className="flex-1 px-4 py-3 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
              autoFocus
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="bg-green-500 hover:bg-green-600 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent"></div>
              ) : (
                <>
                  <Search size={20} />
                  Search
                </>
              )}
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Search size={48} className="mb-2 opacity-50" />
              <p>Search for users to start chatting</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-800 border border-green-500/20 rounded-lg p-4 flex items-center justify-between hover:border-green-500/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {user.avatar ? (
                        <img
                          src={getMediaUrl(user.avatar)}
                          alt={user.username}
                          className="w-12 h-12 rounded-full border border-green-500/30"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-700 border border-green-500/30 flex items-center justify-center">
                          <UserCircle className="text-green-400" size={28} />
                        </div>
                      )}
                      {user.is_online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-200">
                        {user.username}
                      </h3>
                      {(user.first_name || user.last_name) && (
                        <p className="text-sm text-gray-400">
                          {[user.first_name, user.last_name]
                            .filter(Boolean)
                            .join(' ')}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            user.is_online ? 'bg-green-400' : 'bg-gray-500'
                          }`}
                        ></div>
                        <span className="text-xs text-gray-500">
                          {user.is_online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown(user.id)}
                        className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                        title="Options"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {activeDropdownUserId === user.id && (
                        <div
                          ref={dropdownRef}
                          className="absolute right-0 mt-2 w-40 bg-gray-700 rounded-md shadow-lg z-10 border border-green-500/30"
                        >
                          <button
                            onClick={() => {
                              handleStartChat(user.username);
                              setActiveDropdownUserId(null);
                            }}
                            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors rounded-t-md"
                          >
                            <MessageCircle size={16} />
                            Написать
                          </button>
                          <a
                            href={`https://vsp210.ru/account/profile/${user.username}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setActiveDropdownUserId(null)}
                            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors rounded-b-md"
                          >
                            <UserCircle size={16} />
                            Профиль
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
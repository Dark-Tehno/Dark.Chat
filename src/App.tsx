import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/Auth/AuthForm';
import { ChatList } from './components/Chat/ChatList';
import { UserSearch } from './components/Search/UserSearch';
import NotificationButton from './components/NotificationButton';
import { GroupChatList } from './components/Chat/GroupChatList'; 
import { LogOut, Search, CircleUser as UserCircle, Edit, Plus } from 'lucide-react';
import { getMediaUrl } from './utils/media';
import { ChatRouter } from './components/Chat/ChatRouter';
import { apiService } from './services/api';
import { GroupChatWrapper } from './components/Chat/GroupChatWrapper';
import { CreateGroupModal } from './components/Chat/CreateGroupModal';
import { ProfileSetupPage } from './components/Auth/ProfileSetupPage';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-green-400 text-lg">Loading Dark.Chat...</p>
        </div>
      </div>
    );
  }

  const isNewUser = sessionStorage.getItem('isNewUser') === 'true';

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<AuthForm />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }
  
  return (
    <Routes>
      {isNewUser ? (
        <>
          <Route path="/setup-profile" element={<ProfileSetupPage />} />
          <Route path="*" element={<Navigate to="/setup-profile" />} />
        </>
      ) : (
        <>
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/setup-profile" element={<Navigate to="/" />} />
          <Route path="/*" element={<MainLayout />} />
        </>
      )}
    </Routes>
  );
}

function MainLayout() {
  const auth = useAuth();
  
  
  const [user, setUser] = useState(auth.user);

  
  useEffect(() => { setUser(auth.user); }, [auth.user]);

  const [showSearch, setShowSearch] = useState(false);
  const [activeView, setActiveView] = useState<'chats' | 'groups'>('chats');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const navigate = useNavigate(); 
  const location = useLocation();

  const isChatOpen = location.pathname.startsWith('/chat/') || location.pathname.startsWith('/group/');

  useEffect(() => {
    if (location.pathname.startsWith('/group/')) {
      setActiveView('groups');
    } else {
      setActiveView('chats');
    }
  }, [location.pathname]);

  const handleSelectChat = (username: string) => {
    navigate(`/chat/${username}`);
  };

  const handleSelectGroup = (groupUrl: string) => {
    navigate(`/group/${groupUrl}`);
  };

  const handleStartChat = (username: string) => {
    navigate(`/chat/${username}`);
    setShowSearch(false);
  };

  const handleGroupCreated = (groupUrl: string) => {
    setShowCreateGroup(false);
    navigate(`/group/${groupUrl}`);
  };

  return (
    <div className="flex h-screen">
      <div className={`${isChatOpen ? 'hidden md:block' : 'block'} w-full md:w-80 flex flex-col bg-gray-950 border-r border-green-500/30`}>
        <div className="bg-gray-900 border-b border-green-500/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setShowProfileEdit(true)} className="flex items-center gap-3 text-left w-full hover:bg-gray-800/50 p-2 -m-2 rounded-lg transition-colors group">
              <div className="relative">
                {user?.avatar ? (
                  <img
                    src={getMediaUrl(user.avatar)}
                    alt={user.username}
                    className="w-10 h-10 rounded-full border-2 border-green-500"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                    <UserCircle className="text-green-400" size={24} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-green-400 font-semibold group-hover:text-green-300 transition-colors">{user?.username}</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-gray-400">Online</span>
                </div>
              </div>
            </button>
            <div className="flex items-center">
              <NotificationButton />
              <button
                onClick={auth.logout}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(true)}
              className="flex-1 bg-gray-800 border border-green-500/30 rounded-lg p-3 text-left text-gray-400 hover:border-green-500 transition-colors flex items-center gap-2"
            >
              <Search size={18} />
              <span>Search users...</span>
            </button>
            {activeView === 'groups' && (
                <button onClick={() => setShowCreateGroup(true)} title="Create new group" className="p-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors">
                    <Plus size={18} />
                </button>
            )}
          </div>
        </div>

        <div className="flex border-b border-green-500/30">
          <button onClick={() => { setActiveView('chats'); navigate('/'); }} className={`flex-1 p-3 text-center font-semibold transition-colors ${activeView === 'chats' ? 'bg-gray-800 text-green-400' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>
            Chats
          </button>
          <button onClick={() => { setActiveView('groups'); navigate('/'); }} className={`flex-1 p-3 text-center font-semibold transition-colors ${activeView === 'groups' ? 'bg-gray-800 text-green-400' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>
            Groups
          </button>
        </div>

        {activeView === 'chats' ? <ChatList onSelectChat={handleSelectChat} /> : <GroupChatList onSelectGroup={handleSelectGroup} />}
      </div>

      <div className="flex-1 bg-gray-950">
        <Routes>
          <Route path="/" element={
            <div className="hidden md:flex flex-1 flex-col items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <h2 className="text-4xl font-bold text-green-400 mb-4 neon-text">
                  Dark.Chat
                </h2>
                <p className="text-lg">Select a chat or group to start messaging</p>
              </div>
            </div>
          } />
          <Route path="/chat/:identifier" element={<ChatRouter />} />
          <Route path="/group/:groupUrl" element={<GroupChatWrapper />} />
        </Routes>
      </div>

      {showSearch && (
        <UserSearch
          onClose={() => setShowSearch(false)}
          onStartChat={handleStartChat}
        />
      )}
      {showCreateGroup && (
        <CreateGroupModal 
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
      {showProfileEdit && user && (
        <ProfileEditModal
          user={user}
          onClose={() => setShowProfileEdit(false)}
          onProfileUpdate={(updatedUser) => {
            
            setUser(updatedUser);
            
            if(auth.updateUser) {
              auth.updateUser(updatedUser);
            }
          }}
        />
      )}
    </div>
  );
}




interface ProfileUser {
  id: number;
  username: string;
  email?: string;
  avatar: string | null;
  gender: 'male' | 'female' | 'unspecified' | null;
  info: string | null;
  city: string | null;
  is_online?: boolean;
  first_name?: string | null;
  last_name?: string | null;
}

const defaultAvatars = [
  'http://127.0.0.1:8000/media/avatars/default_user_photo.png',
  'http://127.0.0.1:8000/media/avatars/default_user_photo_2.png',
  'http://127.0.0.1:8000/media/avatars/default_user_photo_3.jpg',
  'http://127.0.0.1:8000/media/avatars/default_user_photo_4.jpg',
];

interface ProfileEditModalProps {
  user: ProfileUser;
  onClose: () => void;
  onProfileUpdate: (updatedUser: ProfileUser) => void;
}

function ProfileEditModal({ user, onClose, onProfileUpdate }: ProfileEditModalProps) {
  const [formData, setFormData] = useState({
    username: user.username,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    info: user.info || '',
    city: user.city || '',
    gender: user.gender || 'unspecified',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar ? getMediaUrl(user.avatar) : null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDefaultAvatarSelect = async (url: string) => {
    setAvatarPreview(url);
    setAvatarFile(null); 
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const filename = url.split('/').pop() || 'default-avatar.jpg';
        const file = new File([blob], filename, { type: blob.type });
        setAvatarFile(file);
    } catch (err) {
        console.error("Failed to fetch default avatar:", err);
        setError("Не удалось загрузить выбранный аватар. Пожалуйста, попробуйте снова или загрузите свой файл.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const data = new FormData();
    let hasChanges = false;

    
    if (formData.username !== user.username) { data.append('username', formData.username); hasChanges = true; }
    if (formData.first_name !== (user.first_name || '')) { data.append('first_name', formData.first_name); hasChanges = true; }
    if (formData.last_name !== (user.last_name || '')) { data.append('last_name', formData.last_name); hasChanges = true; }
    if (formData.info !== (user.info || '')) { data.append('info', formData.info); hasChanges = true; }
    if (formData.city !== (user.city || '')) { data.append('city', formData.city); hasChanges = true; }
    if (formData.gender !== (user.gender || 'unspecified')) { data.append('gender', formData.gender); hasChanges = true; }
    if (avatarFile) { data.append('avatar', avatarFile); hasChanges = true; }

    if (!hasChanges) {
        onClose();
        return;
    }

    try {
      
      
      
      const updatedUser = await apiService.updateProfile(data); 
      onProfileUpdate(updatedUser);
      onClose();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'Произошла ошибка при обновлении профиля.';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-green-500/30 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-green-400">Редактировать профиль</h2>
          <button type="button" onClick={onClose} className="p-2 -m-2 text-gray-400 hover:text-red-400">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-green-500" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-green-500 flex items-center justify-center">
                  <UserCircle className="text-green-400" size={40} />
                </div>
              )}
              <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute bottom-0 right-0 bg-gray-700 p-1.5 rounded-full text-white hover:bg-green-500 transition-colors">
                <Edit size={14} />
              </button>
              <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
            </div>
            <div className="flex-1">
              <label htmlFor="username" className="block text-sm font-medium text-gray-300">Имя пользователя</label>
              <input type="text" name="username" id="username" value={formData.username} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Или выберите готовый аватар</label>
            <div className="flex gap-2 flex-wrap">
                {defaultAvatars.map(url => (
                    <img 
                        key={url}
                        src={url}
                        alt="Default avatar"
                        onClick={() => handleDefaultAvatarSelect(url)}
                        className={`w-16 h-16 rounded-full object-cover cursor-pointer border-2 transition-all ${avatarPreview === url ? 'border-green-500 scale-110' : 'border-transparent hover:border-green-500/50'}`}
                    />
                ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-300">Имя</label>
              <input type="text" name="first_name" id="first_name" value={formData.first_name} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500" />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-300">Фамилия</label>
              <input type="text" name="last_name" id="last_name" value={formData.last_name} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500" />
            </div>
          </div>

          <div>
            <label htmlFor="info" className="block text-sm font-medium text-gray-300">О себе</label>
            <textarea name="info" id="info" value={formData.info} onChange={handleInputChange} rows={3} className="mt-1 w-full px-3 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-300">Город</label>
              <input type="text" name="city" id="city" value={formData.city} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500" />
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-300">Пол</label>
              <select name="gender" id="gender" value={formData.gender} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500">
                <option value="unspecified">Не указан</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>
          </div>
          
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        </div>
        <div className="p-4 bg-gray-950 border-t border-green-500/30 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">Отмена</button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg font-semibold text-gray-900 bg-green-500 hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;

import { useEffect, useState } from 'react';
import { X, CircleUser as UserCircle, Info, MapPin } from 'lucide-react';
import { apiService, User } from '../../services/api';
import { getMediaUrl } from '../../utils/media';
import { ChatMediaTabContent } from './ChatMediaTabContent';

interface UserInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onImageClick: (url: string) => void;
}

export function UserInfoPanel({ isOpen, onClose, username, onImageClick }: UserInfoPanelProps) {
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'media'>('info');

  useEffect(() => {
    if (isOpen && username) {
      setActiveTab('info');
      const fetchUserDetails = async () => {
        setIsLoading(true);
        try {
          // Используем существующий метод getUserData для получения полного профиля пользователя
          const user = await apiService.getUserData(username);
          setUserDetails(user);
        } catch (error) {
          console.error(`Failed to fetch user details for ${username}:`, error);
          setUserDetails(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchUserDetails();
    }
  }, [isOpen, username]);

  if (!isOpen) return null;

  const isAppCreator = userDetails?.id === 1;

  return (
    <div className="absolute inset-0 bg-gray-950/90 z-50 flex flex-col">
      <div className="bg-gray-900 border-b border-green-500/30 p-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-green-400">Информация о пользователе</h2>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-400">
          <X size={24} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-green-500 border-t-transparent"></div>
        </div>
      ) : !userDetails ? (
        <div className="flex items-center justify-center flex-1 text-gray-500">
            <p>Не удалось загрузить информацию о пользователе.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center p-6 border-b border-gray-800">
            {userDetails.avatar ? (
              <img src={getMediaUrl(userDetails.avatar)} alt={userDetails.username} className={`w-24 h-24 rounded-full border-2 ${isAppCreator ? 'border-yellow-400' : 'border-green-500'} mb-4`} />
            ) : (
              <div className={`w-24 h-24 rounded-full bg-green-500/20 border-2 ${isAppCreator ? 'border-yellow-400' : 'border-green-500'} flex items-center justify-center mb-4`}>
                <UserCircle className={`${isAppCreator ? 'text-yellow-400' : 'text-green-400'}`} size={48} />
              </div>
            )}
            <h3 className={`text-2xl font-bold ${isAppCreator ? 'text-yellow-300' : 'text-green-300'}`}>{userDetails.username}</h3>
            <div className="flex items-center gap-2 mt-1">
                <div className={`w-2.5 h-2.5 rounded-full ${userDetails.is_online ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                <p className="text-gray-400 text-sm">{userDetails.is_online ? 'Online' : 'Offline'}</p>
            </div>
          </div>

          <div className="border-b border-gray-800">
            <nav className="flex justify-center space-x-4 px-4">
              <button onClick={() => setActiveTab('info')} className={`py-4 px-2 text-sm font-medium ${activeTab === 'info' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-gray-200'}`}>Информация</button>
              <button onClick={() => setActiveTab('media')} className={`py-4 px-2 text-sm font-medium ${activeTab === 'media' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-gray-200'}`}>Медиа</button>
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'info' && (
              <div className="space-y-4 text-gray-300">
                {(userDetails.first_name || userDetails.last_name) && (<div className="flex items-start gap-3"><UserCircle size={20} className="mt-1 text-gray-500 flex-shrink-0" /><div><p className="font-semibold text-gray-200">{userDetails.first_name} {userDetails.last_name}</p><p className="text-xs text-gray-500">Имя</p></div></div>)}
                {userDetails.info && (<div className="flex items-start gap-3"><Info size={20} className="mt-1 text-gray-500 flex-shrink-0" /><div><p className="text-gray-200 break-words">{userDetails.info}</p><p className="text-xs text-gray-500">О себе</p></div></div>)}
                {userDetails.city && (<div className="flex items-start gap-3"><MapPin size={20} className="mt-1 text-gray-500 flex-shrink-0" /><div><p className="text-gray-200">{userDetails.city}</p><p className="text-xs text-gray-500">Город</p></div></div>)}
                {!userDetails.first_name && !userDetails.last_name && !userDetails.info && !userDetails.city && (<p className="text-center text-gray-500 py-8">Пользователь не предоставил дополнительную информацию.</p>)}
              </div>
            )}
            {activeTab === 'media' && <ChatMediaTabContent username={username} onImageClick={onImageClick} />}
          </div>
        </>
      )}
    </div>
  );
}
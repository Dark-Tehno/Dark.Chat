import { useEffect, useState } from 'react';
import { X, Users as GroupIcon, CircleUser as UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, User, GroupChat } from '../../services/api'; 
import { getMediaUrl } from '../../utils/media';
import { GroupEditForm } from './GroupEditForm';
import { GroupMediaTabContent } from './GroupMediaTabContent';

interface GroupInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupChat | null; 
  onParticipantClick: (username: string) => void;
  groupUrl: string;
  navigate: (path: string) => void; 
  onGroupUpdate: () => void;
  onImageClick: (url: string) => void;
}

export function GroupInfoPanel({ isOpen, onClose, group, onParticipantClick, groupUrl, navigate, onGroupUpdate, onImageClick }: GroupInfoPanelProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'participants' | 'media' | 'edit'>('participants');
  const isCurrentUserCreator = user?.id === group?.creator?.id;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addParticipantError, setAddParticipantError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      
      setActiveTab('participants');
    }
  }, [isOpen]);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setAddParticipantError(null);

    if (query.trim().length > 1) {
      setIsSearching(true);
      try {
        const results = await apiService.searchUsers(query);
        
        const existingParticipantIds = group?.participants.map(p => p.id) || [];
        const filteredResults = results.filter((user: User) => !existingParticipantIds.includes(user.id));
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleAddParticipant = async (participantId: number) => {
    if (!groupUrl) return;
    try {
      await apiService.addParticipant(groupUrl, participantId);
      
      setSearchQuery('');
      setSearchResults([]);
      onGroupUpdate(); 
      setAddParticipantError(null);
    } catch (error: any) {
      console.error('Failed to add participant:', error);
      setAddParticipantError(error.message || 'Не удалось добавить пользователя.');
    }
  };

  if (!isOpen || !group) return null;

  return (
    <div className="absolute inset-0 bg-gray-950/90 z-50 flex flex-col">
      <div className="bg-gray-900 border-b border-green-500/30 p-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-green-400">Информация о группе</h2>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-400">
          <X size={24} />
        </button>
      </div>

      <div className="flex flex-col items-center p-6 border-b border-gray-800">
        {group.image ? (
          <img src={getMediaUrl(group.image)} alt={group.name} className="w-24 h-24 rounded-full border-2 border-green-500 mb-4" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-4">
            <GroupIcon className="text-green-400" size={48} />
          </div>
        )}
        <h3 className="text-2xl font-bold text-green-300">{group.name}</h3>
        <p className="text-gray-400">{group.participants.length} участников</p>
      </div>

      <div className="border-b border-gray-800">
        <nav className="flex justify-center space-x-4 px-4">
          <button onClick={() => setActiveTab('participants')} className={`py-4 px-2 text-sm font-medium ${activeTab === 'participants' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-gray-200'}`}>Участники</button>
          <button onClick={() => setActiveTab('media')} className={`py-4 px-2 text-sm font-medium ${activeTab === 'media' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-gray-200'}`}>Медиа</button>
          {isCurrentUserCreator && (
            <button onClick={() => setActiveTab('edit')} className={`py-4 px-2 text-sm font-medium ${activeTab === 'edit' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-gray-200'}`}>Редактировать</button>
          )}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'participants' && (
          <div> {}
            <h4 className="text-lg font-semibold text-gray-300">Участники ({group.participants.length})</h4>
              <div className="space-y-2 mt-2">
                {group.participants.map((participant) => (
                  <button key={participant.id} onClick={() => onParticipantClick(participant.username)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors text-left">
                    {participant.avatar ? (<img src={getMediaUrl(participant.avatar)} alt={participant.username} className="w-10 h-10 rounded-full" />) : (<div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"><UserCircle className="text-gray-400" size={24} /></div>)}
                    <span className="font-medium text-gray-200">{participant.username}</span>
                  </button>
                ))}
              </div>
            </div>
        )}
        {activeTab === 'media' && <GroupMediaTabContent groupUrl={groupUrl} onImageClick={onImageClick} />}
        {activeTab === 'edit' && isCurrentUserCreator && (
          <div className="space-y-6">
            {}
            <div className="pb-4 border-b border-gray-800">
              <label htmlFor="add-participant-search" className="block text-sm font-medium text-gray-300 mb-1">Добавить участника</label>
              <input
                type="text"
                id="add-participant-search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Поиск по имени пользователя..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
              />
              {isSearching && <p className="text-sm text-gray-400 mt-2">Поиск...</p>}
              {addParticipantError && <p className="text-sm text-red-400 mt-2">{addParticipantError}</p>}
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border border-gray-700 rounded-lg p-2">
                  {searchResults.map(userResult => (
                    <div key={userResult.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-800">
                      <div className="flex items-center gap-3">
                        {userResult.avatar ? (
                          <img src={getMediaUrl(userResult.avatar)} alt={userResult.username} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <UserCircle className="text-gray-400" size={20} />
                          </div>
                        )}
                        <span className="font-medium text-gray-200">{userResult.username}</span>
                      </div>
                      <button
                        onClick={() => handleAddParticipant(userResult.id)}
                        className="px-3 py-1 text-sm rounded-lg bg-green-600 hover:bg-green-500 text-white"
                      >
                        Добавить
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {}
            <GroupEditForm group={group} groupUrl={groupUrl} navigate={navigate} onGroupUpdate={onGroupUpdate} onClose={onClose} />
          </div>
        )}
      </div>
    </div>
  );
}
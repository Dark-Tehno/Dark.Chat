import { useEffect, useState } from 'react';
import { X, Users as GroupIcon, CircleUser as UserCircle, UserX, LogOut, Trash2, Tag, Check, X as XIcon } from 'lucide-react';
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
  const [editingTagFor, setEditingTagFor] = useState<number | null>(null);
  const [currentTag, setCurrentTag] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab('participants');
      setEditingTagFor(null); // Reset editing state when panel opens/re-opens
      setCurrentTag('');
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

  const handleStartEditTag = (participant: User) => {
    setEditingTagFor(participant.id);
    setCurrentTag(group?.tags?.[participant.id] || '');
  };

  const handleCancelEditTag = () => {
    setEditingTagFor(null);
    setCurrentTag('');
  };

  const handleSaveTag = async (participantId: number) => {
    if (!groupUrl || !isCurrentUserCreator) return;
    try {
      await apiService.setParticipantTag(groupUrl, participantId, currentTag);
      onGroupUpdate();
      handleCancelEditTag();
    } catch (error: any) {
      console.error('Failed to save tag:', error);
      alert(error.message || 'Не удалось сохранить тег.');
    }
  };

  const handleRemoveParticipant = async (participantId: number) => {
    if (!isCurrentUserCreator || !groupUrl) return;
    if (window.confirm('Вы уверены, что хотите удалить этого участника из группы?')) {
      try {
        await apiService.removeParticipant(groupUrl, participantId);
        onGroupUpdate(); 
      } catch (error: any) {
        console.error('Failed to remove participant:', error);
        alert(error.message || 'Не удалось удалить участника.');
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupUrl) return;
    if (window.confirm('Вы уверены, что хотите покинуть эту группу?')) {
      try {
        await apiService.leaveGroupChat(groupUrl);
        alert('Вы покинули группу.');
        onGroupUpdate(); 
        onClose();
        navigate('/'); 
      } catch (error: any) {
        console.error('Failed to leave group:', error);
        alert(error.message || 'Не удалось покинуть группу.');
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (!isCurrentUserCreator || !groupUrl) return;
    if (window.confirm('Вы уверены, что хотите удалить эту группу? Это действие необратимо.')) {
      try {
        await apiService.deleteGroupChat(groupUrl);
        alert('Группа была удалена.');
        onGroupUpdate(); 
        onClose();
        navigate('/'); 
      } catch (error: any) {
        console.error('Failed to delete group:', error);
        alert(error.message || 'Не удалось удалить группу.');
      }
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
            <h4 className="text-lg font-semibold text-gray-300 mb-4">Участники ({group.participants.length})</h4>
            <div className="space-y-2">
              {group.participants.map((participant) => {
                const isCreator = participant.id === group.creator.id;
                const customTag = group.tags?.[participant.id];
                const displayTag = isCreator ? (customTag || 'Создатель') : customTag;
                const isDefaultCreatorTag = isCreator && !customTag;
                const isAppCreator = participant.id === 1;

                return (
                  <div key={participant.id} className="w-full p-2 rounded-lg hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <button onClick={() => onParticipantClick(participant.username)} className="flex items-center gap-3 text-left flex-1">
                        {participant.avatar ? (<img src={getMediaUrl(participant.avatar)} alt={participant.username} className={`w-10 h-10 rounded-full ${isAppCreator ? 'ring-2 ring-yellow-400' : ''}`} />) : (<div className={`w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center ${isAppCreator ? 'ring-2 ring-yellow-400' : ''}`}><UserCircle className={`${isAppCreator ? 'text-yellow-400' : 'text-gray-400'}`} size={24} /></div>)}
                        <div>
                          <span className={`font-medium ${isAppCreator ? 'text-yellow-400 font-bold' : 'text-gray-200'}`}>{participant.username}</span>
                          {displayTag && editingTagFor !== participant.id && (
                            <span className={`text-xs block ${isCreator ? 'text-green-400' : 'text-cyan-400'}`}>
                              {isDefaultCreatorTag ? displayTag : `Тег: ${displayTag}`}
                            </span>
                          )}
                        </div>
                      </button>
                      {isCurrentUserCreator && (
                        <div className="flex items-center gap-2">
                          {editingTagFor !== participant.id && (
                            <button onClick={() => handleStartEditTag(participant)} className="p-2 text-gray-400 hover:text-green-400 rounded-full transition-colors" title="Изменить тег"><Tag size={18} /></button>
                          )}
                          {user?.id !== participant.id && (
                            <button onClick={() => handleRemoveParticipant(participant.id)} className="p-2 text-red-400 hover:text-red-300 rounded-full transition-colors" title="Удалить участника"><UserX size={18} /></button>
                          )}
                        </div>
                      )}
                    </div>
                    {isCurrentUserCreator && editingTagFor === participant.id && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={currentTag}
                          onChange={(e) => setCurrentTag(e.target.value)}
                          placeholder="Тег участника"
                          className="flex-1 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                          autoFocus
                        />
                        <button onClick={() => handleSaveTag(participant.id)} className="p-2 text-green-400 hover:text-green-300 rounded-full" title="Сохранить"><Check size={18} /></button>
                        <button onClick={handleCancelEditTag} className="p-2 text-red-400 hover:text-red-300 rounded-full" title="Отмена"><XIcon size={18} /></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {activeTab === 'media' && <GroupMediaTabContent groupUrl={groupUrl} onImageClick={onImageClick} />}
        {activeTab === 'edit' && isCurrentUserCreator && (
          <div className="space-y-6">
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
                  {searchResults.map(userResult => {
                    const isAppCreator = userResult.id === 1;
                    return (
                      <div key={userResult.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-800">
                        <div className="flex items-center gap-3">
                          {userResult.avatar ? (<img src={getMediaUrl(userResult.avatar)} alt={userResult.username} className={`w-8 h-8 rounded-full ${isAppCreator ? 'ring-2 ring-yellow-400' : ''}`} />) : (<div className={`w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center ${isAppCreator ? 'ring-2 ring-yellow-400' : ''}`}><UserCircle className={`${isAppCreator ? 'text-yellow-400' : 'text-gray-400'}`} size={20} /></div>)}
                          <span className={`font-medium ${isAppCreator ? 'text-yellow-400 font-bold' : 'text-gray-200'}`}>{userResult.username}</span>
                        </div>
                        <button onClick={() => handleAddParticipant(userResult.id)} className="px-3 py-1 text-sm rounded-lg bg-green-600 hover:bg-green-500 text-white">
                          Добавить
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <GroupEditForm group={group} groupUrl={groupUrl} navigate={navigate} onGroupUpdate={onGroupUpdate} onClose={onClose} />
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-800 space-y-3">
        <button
          onClick={handleLeaveGroup}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
        >
          <LogOut size={16} />
          Покинуть группу
        </button>
        {isCurrentUserCreator && (
          <button
            onClick={handleDeleteGroup}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={16} />
            Удалить группу
          </button>
        )}
      </div>
    </div>
  );
}
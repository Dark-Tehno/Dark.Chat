import { useState, useRef } from 'react';
import { X, Users, Image as ImageIcon, UserPlus, UserX, CircleUser as UserCircle } from 'lucide-react';
import { apiService, User } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getMediaUrl } from '../../utils/media';

interface CreateGroupModalProps {
  onClose: () => void;
  onGroupCreated: (groupUrl: string) => void;
}

export function CreateGroupModal({ onClose, onGroupCreated }: CreateGroupModalProps) {
  const { user: currentUser } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 1) {
      setIsSearching(true);
      try {
        const results = await apiService.searchUsers(query);
        const selectedIds = new Set([...selectedParticipants.map(p => p.id), currentUser?.id]);
        const filteredResults = results.filter(u => !selectedIds.has(u.id));
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Failed to search users:', error);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleAddParticipant = (participant: User) => {
    setSelectedParticipants(prev => [...prev, participant]);
    setSearchResults(prev => prev.filter(u => u.id !== participant.id));
  };

  const handleRemoveParticipant = (participantId: number) => {
    setSelectedParticipants(prev => prev.filter(p => p.id !== participantId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Название группы не может быть пустым.');
      return;
    }
    if (selectedParticipants.length === 0) {
      setError('Добавьте хотя бы одного участника.');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const participantIds = selectedParticipants.map(p => p.id);
      const newGroup = await apiService.createGroupChat(groupName, participantIds, imageFile);
      onGroupCreated(newGroup.url);
    } catch (err: any) {
      setError(err.message || 'Не удалось создать группу.');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-green-500/30 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-green-400">Создать новую группу</h2>
          <button type="button" onClick={onClose} className="p-2 -m-2 text-gray-400 hover:text-red-400"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
              <button type="button" onClick={() => imageInputRef.current?.click()} className="w-20 h-20 rounded-full bg-gray-800 border-2 border-dashed border-green-500/50 flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:border-green-500 transition-colors">
                {imagePreview ? <img src={imagePreview} alt="Group Avatar" className="w-full h-full rounded-full object-cover" /> : <ImageIcon size={32} />}
              </button>
            </div>
            <div className="flex-1"><label htmlFor="groupName" className="block text-sm font-medium text-gray-300">Название группы</label><input type="text" id="groupName" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Введите название..." className="mt-1 w-full px-3 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500" required /></div>
          </div>
          <div>
            <label htmlFor="participantSearch" className="block text-sm font-medium text-gray-300">Добавить участников</label>
            <input type="text" id="participantSearch" value={searchQuery} onChange={handleSearchChange} placeholder="Поиск пользователей..." className="mt-1 w-full px-3 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500" />
            {isSearching && <p className="text-sm text-gray-400 mt-2">Поиск...</p>}
            {searchResults.length > 0 && <div className="mt-2 space-y-1 max-h-40 overflow-y-auto border border-gray-700 rounded-lg p-1">{searchResults.map(user => <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800"><div className="flex items-center gap-2">{user.avatar ? <img src={getMediaUrl(user.avatar)} alt={user.username} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"><UserCircle size={20} className="text-gray-400" /></div>}<span className="text-gray-200">{user.username}</span></div><button type="button" onClick={() => handleAddParticipant(user)} className="p-1.5 text-green-400 hover:text-green-300"><UserPlus size={18} /></button></div>)}</div>}
          </div>
          {selectedParticipants.length > 0 && <div><h3 className="text-sm font-medium text-gray-300">Выбранные участники ({selectedParticipants.length})</h3><div className="mt-2 space-y-1 max-h-40 overflow-y-auto border border-gray-700 rounded-lg p-1">{selectedParticipants.map(p => <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-800"><div className="flex items-center gap-2">{p.avatar ? <img src={getMediaUrl(p.avatar)} alt={p.username} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"><UserCircle size={20} className="text-gray-400" /></div>}<span className="text-gray-200">{p.username}</span></div><button type="button" onClick={() => handleRemoveParticipant(p.id)} className="p-1.5 text-red-400 hover:text-red-300"><UserX size={18} /></button></div>)}</div></div>}
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        </div>

        <div className="p-4 bg-gray-950 border-t border-green-500/30 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">Отмена</button>
          <button type="submit" disabled={isCreating} className="px-6 py-2 rounded-lg font-semibold text-gray-900 bg-green-500 hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Users size={18} />{isCreating ? 'Создание...' : 'Создать группу'}</button>
        </div>
      </form>
    </div>
  );
}
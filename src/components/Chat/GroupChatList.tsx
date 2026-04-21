import { useEffect, useState } from 'react';
import { apiService, GroupChat } from '../../services/api';
import { Users } from 'lucide-react';
import { getMediaUrl } from '../../utils/media';

interface GroupChatListProps {
  
  onSelectGroup: (groupUrl: string) => void;
}

export function GroupChatList({ onSelectGroup }: GroupChatListProps) {
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getGroupChats();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load group chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
    const interval = setInterval(loadGroups, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-gray-500">
          <Users size={48} className="mb-2 opacity-50" />
          <p>No group chats yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {groups.map((group) => (
            <button
              key={group.id}
              
              
              onClick={() => onSelectGroup(group.url)}
              className="w-full p-4 hover:bg-gray-900/50 transition-colors text-left flex items-start gap-3"
            >
              <div className="relative">
                {group.image ? (
                  <img
                    src={getMediaUrl(group.image)}
                    alt={group.name}
                    className="w-12 h-12 rounded-full border border-green-500/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-800 border border-green-500/30 flex items-center justify-center">
                    <Users className="text-green-400" size={28} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-200">
                    {group.name}
                  </h3>
                </div>
                {group.last_message && (
                  <p className="text-sm text-gray-400 truncate">
                    {group.last_message.text || 'Media message'}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
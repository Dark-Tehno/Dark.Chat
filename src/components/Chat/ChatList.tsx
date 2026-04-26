import { useEffect, useState } from 'react';
import { apiService, Chat, User } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, CircleUser as UserCircle } from 'lucide-react';
import { getMediaUrl } from '../../utils/media';

interface ChatListProps {
  onSelectChat: (username: string) => void;
}

export function ChatList({ onSelectChat }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout } = useAuth();

  const loadChats = async () => {
    try {
      const data = await apiService.getChats();
      setChats(data);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 5000);
    return () => clearInterval(interval);
  }, []);

  const getOtherUser = (chat: Chat): User => {
    return chat.user1.id === user?.id ? chat.user2 : chat.user1;
  };

  const hasNewMessages = (chat: Chat): boolean => {
    if (chat.user1.id === user?.id) {
      return chat.new_message_user1;
    }
    return chat.new_message_user2;
  };

  return (
    <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <MessageCircle size={48} className="mb-2 opacity-50" />
            <p>No chats yet</p>
            <p className="text-sm">Search for users to start chatting</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {chats.map((chat) => {
              const otherUser = getOtherUser(chat);
              const isNew = hasNewMessages(chat);
              const isCreator = otherUser.id === 1;

              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(otherUser.username)}
                  className="w-full p-4 hover:bg-gray-900/50 transition-colors text-left flex items-start gap-3"
                >
                  <div className="relative">
                    {otherUser.avatar ? (
                      <img
                        src={getMediaUrl(otherUser.avatar)}
                        alt={otherUser.username}
                        className={`w-12 h-12 rounded-full border border-green-500/30 ${isCreator ? 'ring-2 ring-yellow-400' : ''}`}
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full bg-gray-800 border border-green-500/30 flex items-center justify-center ${isCreator ? 'ring-2 ring-yellow-400' : ''}`}>
                        <UserCircle className={`${isCreator ? 'text-yellow-400' : 'text-green-400'}`} size={28} />
                      </div>
                    )}
                    {otherUser.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-950"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={`font-semibold ${isCreator ? 'text-yellow-400 font-bold' :
                          isNew ? 'text-green-400' : 'text-gray-200'}`}
                      >
                        {otherUser.username}
                      </h3>
                      {isNew && (
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      )}
                    </div>
                    {chat.last_message && (
                      <p className="text-sm text-gray-400 truncate">
                        {chat.last_message.text || 'Media message'}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
    </div>
  );
}

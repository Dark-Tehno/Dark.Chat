import { useEffect, useMemo, useState } from 'react';
import { apiService, Chat, User } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, CircleUser as UserCircle, Star } from 'lucide-react';
import { getMediaUrl } from '../../utils/media';

interface ChatListProps {
  onSelectChat: (username: string) => void;
}

const USER_HIGHLIGHT_CONFIG: Record<number, { color: string; label: string }> = {
  1: { color: '#FACC15', label: 'Creator' },
  // Добавьте сюда других пользователей с их id и цветами в формате hex.
  // Пример:
  // 42: { color: '#38BDF8', label: 'Moderator' },
  34: { color: '#F97316', label: 'Paklonik' },
};

function getContrastingTextColor(hex: string) {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#111827' : '#fff';
}

export function ChatList({ onSelectChat }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

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

  const isSelfChat = (chat: Chat) => {
    return user ? chat.user1.id === user.id && chat.user2.id === user.id : false;
  };

  const sortedChats = useMemo(() => {
    if (!user) return chats;
    return [...chats].sort((a, b) => {
      const aSelf = isSelfChat(a);
      const bSelf = isSelfChat(b);
      if (aSelf !== bSelf) {
        return aSelf ? -1 : 1;
      }
      return 0;
    });
  }, [chats, user]);

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
            {sortedChats.map((chat) => {
              const otherUser = getOtherUser(chat);
              const isNew = hasNewMessages(chat);
              const userStyle = USER_HIGHLIGHT_CONFIG[otherUser.id];
              const isCreator = otherUser.id === 1;
              const badgeTextColor = userStyle ? getContrastingTextColor(userStyle.color) : '#fff';
              const avatarUrl = otherUser.avatar ? getMediaUrl(otherUser.avatar) ?? undefined : undefined;

              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(otherUser.username)}
                  className="w-full p-4 hover:bg-gray-900/50 transition-colors text-left flex items-start gap-3"
                >
                  <div className="relative">
                    {otherUser.avatar ? (
                      <img
                        src={avatarUrl}
                        alt={otherUser.username}
                        className="w-12 h-12 rounded-full border border-green-500/30"
                        style={userStyle ? { boxShadow: `0 0 0 2px ${userStyle.color}` } : undefined}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full border border-green-500/30 flex items-center justify-center"
                        style={{ backgroundColor: userStyle?.color ?? '#111827', boxShadow: userStyle ? `0 0 0 2px ${userStyle.color}` : undefined }}
                      >
                        {isCreator ? (
                          <Star className="text-white" size={24} />
                        ) : (
                          <UserCircle className={userStyle ? 'text-white' : 'text-green-400'} size={28} />
                        )}
                      </div>
                    )}
                    {otherUser.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-950"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3
                          className={`truncate font-semibold ${isCreator ? 'text-yellow-400 font-bold' : isNew ? 'text-green-400' : 'text-gray-200'}`}
                        >
                          {otherUser.username}
                        </h3>
                        {userStyle && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{ backgroundColor: userStyle.color, color: badgeTextColor }}
                          >
                            {userStyle.label}
                          </span>
                        )}
                      </div>
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

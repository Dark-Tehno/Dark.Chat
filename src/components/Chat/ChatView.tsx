import { useEffect, useState, useRef } from 'react';
import { apiService, Message } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Send, CircleUser as UserCircle, Mic, Square, Image as ImageIcon, X, MoreVertical, Paperclip, File as FileIcon, Trash2, Edit, Reply, Smile } from 'lucide-react';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { getMediaUrl, formatTimeShort } from '../../utils/media';


const getFileNameFromUrl = (url: string) => {
  try {
    const decodedUrl = decodeURIComponent(url);
    return decodedUrl.substring(decodedUrl.lastIndexOf('/') + 1);
  } catch (e) {
    return url.substring(url.lastIndexOf('/') + 1);
  }
};

interface MediaGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  media: { photo: string[]; file: string[] } | null;
  isMediaLoading: boolean;
  onImageClick: (url: string) => void;
}

function MediaGallery({ isOpen, onClose, media, isMediaLoading, onImageClick }: MediaGalleryProps) {
  const [activeTab, setActiveTab] = useState<'photos' | 'files'>('photos');

  useEffect(() => {
    if (isOpen) {
      setActiveTab('photos');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-gray-950/90 z-50 flex flex-col">
      <div className="bg-gray-900 border-b border-green-500/30 p-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-green-400">Медиа</h2>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-400">
          <X size={24} />
        </button>
      </div>

      <div className="border-b border-gray-800">
        <nav className="flex space-x-4 px-4">
          <button onClick={() => setActiveTab('photos')} className={`py-4 px-1 text-sm font-medium ${activeTab === 'photos' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-gray-200'}`}>Фото</button>
          <button onClick={() => setActiveTab('files')} className={`py-4 px-1 text-sm font-medium ${activeTab === 'files' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-gray-200'}`}>Файлы</button>
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isMediaLoading ? (
          <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-2 border-green-500 border-t-transparent"></div></div>
        ) : !media || (media.photo.length === 0 && media.file.length === 0) ? (
          <div className="flex items-center justify-center h-full text-gray-500"><p>Медиафайлы не найдены</p></div>
        ) : (
          <div>
            {activeTab === 'photos' && (media.photo.length > 0 ? (<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{media.photo.map((photoUrl, index) => (<a key={index} href={getMediaUrl(photoUrl)} onClick={(e) => { e.preventDefault(); onImageClick(getMediaUrl(photoUrl)); }} className="aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer"><img src={getMediaUrl(photoUrl)} alt={`media ${index}`} className="w-full h-full object-cover" /></a>))}</div>) : (<div className="flex items-center justify-center h-48 text-gray-500"><p>Фотографии не найдены</p></div>))}
            {activeTab === 'files' && (media.file.length > 0 ? (<div className="space-y-3">{media.file.map((fileUrl, index) => { const fileName = getFileNameFromUrl(fileUrl); return (<a key={index} href={getMediaUrl(fileUrl)} target="_blank" rel="noopener noreferrer" download={fileName} className="flex items-center gap-3 rounded-lg p-3 transition-colors bg-gray-800 hover:bg-gray-700 border border-gray-700"><div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-600"><FileIcon size={24} className="text-gray-300" /></div><div className="flex-1 min-w-0"><p className="font-semibold truncate text-sm text-gray-200">{fileName}</p></div></a>); })}</div>) : (<div className="flex items-center justify-center h-48 text-gray-500"><p>Файлы не найдены</p></div>))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ChatViewProps {
  username: string;
  onBack: () => void;
}

export function ChatView({ username, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isWsConnecting, setIsWsConnecting] = useState(true);
  const [chatId, setChatId] = useState<number | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [otherUser, setOtherUser] = useState<{ id: number; username: string; avatar_url: string | null; is_online: boolean; user_notification: boolean; } | null>(null);
  const [activeMessageMenu, setActiveMessageMenu] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [activeReactionMenu, setActiveReactionMenu] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [media, setMedia] = useState<{ photo: string[]; file: string[] } | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [fileToSend, setFileToSend] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({}); 
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { isRecording, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  
  const scrollToMessage = (messageId: number) => {
    const targetMessage = messageRefs.current[messageId];
    if (targetMessage) {
      targetMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      
      
      
      
    } else {
      console.warn(`Message with ID ${messageId} not found in current view.`);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);
      try {
        
        const chatData = await apiService.createChat(username);
        const currentChatId = chatData.chat_id;
        setChatId(currentChatId);

        
        const [messagesData, detailsData] = await Promise.all([
          apiService.getChatMessages(username),
          apiService.getChatDetails(username),
        ]);
        setMessages(messagesData);
        setOtherUser(detailsData.other_participant);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [username]);

  useEffect(() => {
    if (!chatId) return; 

    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      const ws = apiService.createWebSocket(chatId);
      wsRef.current = ws;
      setIsWsConnecting(true);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsWsConnecting(false);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message') {
          console.log(data);
          const newMessage = {
            text: data.message,
            id: data.message_id,
            photo: data.photo,
            voice_message: data.voice_message,
            file: data.file,
            created_at: data.created_at,
            sender: {
              type: data.sender_type,
              id: data.sender_id,
              username: data.username,
            },
            chat_room_id: chatId, 
            button_json: null,
            reply_to: data.reply_to, 
            reactions: data.reactions,
          };
          setMessages((prevMessages) => {
            if (prevMessages.some((msg) => msg.id === newMessage.id)) {
              return prevMessages;
            }
            return [...prevMessages, newMessage];
          });
        } else if (data.type === 'user_online_status') {
          
          if (data.user_id !== user?.id) {
            setOtherUser((prev) => (prev ? { ...prev, is_online: data.is_online } : null));
          }
        } else if (data.type === 'message_edited') {
          setMessages(prev => prev.map(msg =>
            msg.id === data.message_id
              ? { ...msg, text: data.new_text, is_edited: true }
              : msg
          ));
        } else if (data.type === 'message_deleted') {
          setMessages(prev => prev.map(msg => {
            if (msg.id === data.message_id) {
              return {
                ...msg,
                text: 'Сообщение удалено',
                photo: null,
                voice_message: null,
                file: null,
                is_edited: true,
              };
            }
            return msg;
          }
          ));

        } else if (data.type === 'message_reaction_updated') {
          setMessages(prev => prev.map(msg =>
            msg.id === data.message_id
              ? { ...msg, reactions: data.reactions }
              : msg
          ));
        } else if (data.type === 'error') {
          console.error('WebSocket error:', data.error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect in 5s...');
        setIsWsConnecting(true);
        reconnectTimeout = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.onclose = null; 
        wsRef.current.close();
      }
    };
  }, [chatId, user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !fileToSend && !replyToMessage) || isSending || !username) return;

    setIsSending(true);
    const replyToId = replyToMessage?.id;
    try {
      if (fileToSend) {
        
        const isPhoto = fileToSend.type.startsWith('image/');
        if (isPhoto) {
          await apiService.sendPhoto(username, fileToSend, newMessage.trim() || undefined, replyToId);
        } else {
          await apiService.sendFile(username, fileToSend, newMessage.trim() || undefined, replyToId);
        }
      } else {
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ message: newMessage.trim(), reply_to_id: replyToId }));
        } else {
          await apiService.sendMessage(username, newMessage.trim(), replyToId);
        }
      }

      
      setNewMessage('');
      setReplyToMessage(null);
      setFileToSend(null);
      setFilePreview(null);

    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartRecording = async () => {
    setRecordingTime(0);
    await startRecording();
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  };

  const handleStopRecording = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    const voiceBlob = await stopRecording();
    if (voiceBlob) {
      await handleSendVoice(voiceBlob);
    }
  };

  const handleCancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    cancelRecording();
    setRecordingTime(0);
  };

  const handleSendVoice = async (voiceBlob: Blob) => {
    setIsSending(true);
    if (!username || (!voiceBlob && !replyToMessage)) return;
    const replyToId = replyToMessage?.id;
    try {
      await apiService.sendVoice(username, voiceBlob, replyToId);
    } catch (error) {
      console.error('Failed to send voice message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileToSend(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setFilePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileToSend(file);
    setFilePreview(null); 

    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingText(message.text || '');
    setActiveMessageMenu(null);
  };

  const handleReplyMessage = (message: Message) => {
    setReplyToMessage(message);
    setActiveMessageMenu(null); 
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = async () => {
    if (editingMessageId === null) return;
    setIsSending(true);
    try {
      await apiService.editMessage(editingMessageId, editingText);
      
    } catch (error) {
      console.error('Failed to edit message:', error);
    } finally {
      setIsSending(false);
      handleCancelEdit();
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить это сообщение?')) {
      try {
        await apiService.deleteMessage(messageId);
        
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
    setActiveMessageMenu(null);
  };

  const handleReaction = async (messageId: number, reaction: string) => {
    try {
      // Бэкенд отправит событие websocket для обновления UI.
      // Мы можем оптимистично обновить здесь, но для простоты будем полагаться на websocket.
      await apiService.reactToMessage(messageId, reaction);
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
    setActiveReactionMenu(null); // Закрываем меню после реакции
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNotificationToggle = async (action: 'enable' | 'disable') => {
    if (!username) return;

    setShowOptionsMenu(false); 

    try {
      const token = apiService.getToken();
      if (!token) {
        console.error('User not authenticated. Cannot toggle notifications.');
        alert('Вы не авторизованы. Пожалуйста, войдите в систему.');
        return;
      }

      
      
      const apiBaseUrl = import.meta.env.PROD ? 'http://127.0.0.1:8000' : '';
      const response = await fetch(`${apiBaseUrl}/api/v3/chat/notification/${username}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        alert(`Уведомления ${action === 'enable' ? 'включены' : 'отключены'} для ${username}.`);
        setOtherUser(prev => {
          if (!prev) return null;
          
          
          
          return { ...prev, user_notification: action === 'disable' };
        });
      } else {
        const errorData = await response.json();
        alert(`Ошибка при ${action === 'enable' ? 'включении' : 'отключении'} уведомлений: ${errorData.detail || response.statusText}`);
      }
    } catch (error) {
      console.error('Network error during notification toggle:', error);
      alert('Произошла сетевая ошибка. Попробуйте снова.');
    }
  };

  const handleOpenMediaGallery = async () => {
    if (!username) return;
    setShowOptionsMenu(false);
    setShowMediaGallery(true);
    setIsMediaLoading(true);
    try {
      
      const mediaData = await apiService.getChatMedia(username);
      setMedia(mediaData);
    } catch (error) {
      console.error('Failed to load chat media:', error);
      
    } finally {
      setIsMediaLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-x-hidden bg-gray-950 flex flex-col md:h-full md:w-full">
      <MediaGallery
        isOpen={showMediaGallery}
        onClose={() => setShowMediaGallery(false)}
        media={media}
        isMediaLoading={isMediaLoading}
        onImageClick={setLightboxImage}
      />
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Просмотр изображения"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white p-2 bg-black/50 rounded-full hover:bg-black/80 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      )}
      <div className="bg-gray-900 border-b border-green-500/30 p-4 flex items-center gap-3 justify-between">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-green-400 transition-colors md:hidden"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="flex items-center gap-3 flex-1">
          {otherUser && (
            <>
              {otherUser.avatar_url ? (
                <img
                   src={getMediaUrl(otherUser.avatar_url)}
                   alt={otherUser.username}
                   className={`w-10 h-10 rounded-full border-2 border-green-500 ${otherUser.id === 1 ? 'ring-2 ring-yellow-400' : ''}`}
                 />
               ) : (
                 <div className={`w-10 h-10 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center ${otherUser.id === 1 ? 'ring-2 ring-yellow-400' : ''}`}>
                   <UserCircle className={`${otherUser.id === 1 ? 'text-yellow-400' : 'text-green-400'}`} size={24} />
                 </div>
               )}
              <div>
                <h2 className={`font-semibold ${otherUser.id === 1 ? 'text-yellow-400 font-bold' : 'text-green-400'}`}>{otherUser.username}</h2>
                <div className="flex items-center gap-2">
                  {isWsConnecting ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                      <span className="text-xs text-gray-400">Соединение...</span>
                    </>
                  ) : (
                    <>
                      <div
                        className={`w-2 h-2 rounded-full ${otherUser.is_online ? 'bg-green-400' : 'bg-gray-500'}`}
                      ></div>
                      <span className="text-xs text-gray-400">
                        {otherUser.is_online ? 'Online' : 'Offline'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className="p-2 text-gray-400 hover:text-green-400 transition-colors"
            title="Опции чата"
          >
            <MoreVertical size={24} />
          </button>

          {showOptionsMenu && otherUser && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-10 border border-green-500/30">
              {otherUser.user_notification ? ( 
                <button
                  onClick={() => handleNotificationToggle('enable')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                >
                  Включить уведомления
                </button>
              ) : ( 
                <button
                  onClick={() => handleNotificationToggle('disable')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                >
                  Отключить уведомления
                </button>
              )}
              <button
                onClick={handleOpenMediaGallery}
                className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
              >
                Медиа
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.sender?.id === user?.id;

          return (
            <div
              key={message.id}
              className={`flex group ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div 
                ref={(el) => (messageRefs.current[message.id] = el)} 
                className={`relative max-w-[70%] rounded-lg p-3 pb-8 ${ 
                  isOwn ? 'bg-green-500 text-gray-900' : 'bg-gray-800 text-gray-100 border border-green-500/30'
                }`}
              >
                {message.reactions && Object.keys(message.reactions).length > 0 && (
                  <div className="absolute -bottom-3 left-2 flex gap-1 z-10">
                    {Object.entries(message.reactions).map(([emoji, userIds]) => (
                      userIds.length > 0 && (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(message.id, emoji)}
                          className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors ${
                            userIds.includes(user?.id ?? -1)
                              ? 'bg-blue-500 text-white border border-blue-400'
                              : 'bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{userIds.length}</span>
                        </button>
                      )
                    ))}
                  </div>
                )}
                {activeReactionMenu === message.id && (
                  <div className={`absolute top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg p-1 flex gap-1 z-20 ${isOwn ? 'right-0' : 'left-0'}`}>
                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(message.id, emoji)}
                        className="p-1.5 text-lg rounded-md hover:bg-gray-700 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                {isOwn && message.text !== 'Сообщение удалено' && (
                  <div className="absolute top-0 right-full mr-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setActiveReactionMenu(activeReactionMenu === message.id ? null : message.id)} className="p-1 bg-gray-700 rounded-full text-white hover:bg-yellow-500"><Smile size={14} /></button>
                    {message.text && !message.photo && !message.file && !message.voice_message && (
                      <button onClick={() => handleEditMessage(message)} className="p-1 bg-gray-700 rounded-full text-white hover:bg-blue-600"><Edit size={14} /></button>
                    )}
                    <button onClick={() => handleReplyMessage(message)} className="p-1 bg-gray-700 rounded-full text-white hover:bg-blue-600"><Reply size={14} /></button>
                    <button onClick={() => handleDeleteMessage(message.id)} className="p-1 bg-gray-700 rounded-full text-white hover:bg-red-600"><Trash2 size={14} /></button>
                  </div>
                )}
                {!isOwn && message.text !== 'Сообщение удалено' && (
                  <div className="absolute top-0 left-full ml-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setActiveReactionMenu(activeReactionMenu === message.id ? null : message.id)} className="p-1 bg-gray-700 rounded-full text-white hover:bg-yellow-500"><Smile size={14} /></button>
                    <button onClick={() => handleReplyMessage(message)} className="p-1 bg-gray-700 rounded-full text-white hover:bg-blue-600"><Reply size={14} /></button>
                  </div>
                )}
                {message.photo && (
                  
                  message.reply_to && (
                    <div
                      className={`p-2 mb-2 rounded-lg ${isOwn ? 'bg-green-600' : 'bg-gray-700'} border border-green-500/30 cursor-pointer`}
                      onClick={() => message.reply_to?.id && scrollToMessage(message.reply_to.id)}
                    >
                      <p className="text-xs font-semibold text-green-300">{message.reply_to.sender?.username || 'Unknown'}</p>
                      <p className="text-sm text-gray-200 truncate">
                        {message.reply_to.text || (message.reply_to.photo ? 'Photo' : message.reply_to.voice_message ? 'Voice message' : message.reply_to.file ? 'File' : 'Empty message')}
                      </p>
                    </div>
                  )
                )}
                {message.photo && (
                  <img
                    src={getMediaUrl(message.photo)}
                    alt="Shared"
                    className="rounded mb-2 max-w-full cursor-pointer"
                    onClick={() => setLightboxImage(getMediaUrl(message.photo))}
                  />
                )}
                {message.voice_message && (
                  
                  message.reply_to && (
                    <div
                      className={`p-2 mb-2 rounded-lg ${isOwn ? 'bg-green-600' : 'bg-gray-700'} border border-green-500/30 cursor-pointer`}
                      onClick={() => message.reply_to?.id && scrollToMessage(message.reply_to.id)}
                    >
                      <p className="text-xs font-semibold text-green-300">{message.reply_to.sender?.username || 'Unknown'}</p>
                      <p className="text-sm text-gray-200 truncate">
                        {message.reply_to.text || (message.reply_to.photo ? 'Photo' : message.reply_to.voice_message ? 'Voice message' : message.reply_to.file ? 'File' : 'Empty message')}
                      </p>
                    </div>
                  )
                )}
                {message.voice_message && (
                  <div className={`flex items-center gap-2 ${isOwn ? 'bg-green-600' : 'bg-gray-700'} rounded-lg px-3 py-2 mb-2`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOwn ? 'bg-green-700' : 'bg-gray-600'}`}>
                      <Mic size={16} />
                    </div>
                    <audio controls className="flex-1 h-6">
                      <source src={getMediaUrl(message.voice_message)} type="audio/webm" />
                    </audio>
                  </div>
                )}
                {message.file && (
                  
                  message.reply_to && (
                    <div
                      className={`p-2 mb-2 rounded-lg ${isOwn ? 'bg-green-600' : 'bg-gray-700'} border border-green-500/30 cursor-pointer`}
                      onClick={() => message.reply_to?.id && scrollToMessage(message.reply_to.id)}
                    >
                      <p className="text-xs font-semibold text-green-300">{message.reply_to.sender?.username || 'Unknown'}</p>
                      <p className="text-sm text-gray-200 truncate">
                        {message.reply_to.text || (message.reply_to.photo ? 'Photo' : message.reply_to.voice_message ? 'Voice message' : message.reply_to.file ? 'File' : 'Empty message')}
                      </p>
                    </div>
                  )
                )}
                {message.file && (
                  <a
                    href={getMediaUrl(message.file.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={message.file.name}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 mb-2 transition-colors ${isOwn ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOwn ? 'bg-green-700' : 'bg-gray-600'}`}>
                      <FileIcon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-sm">{message.file.name}</p>
                      <p className="text-xs">{Math.round(message.file.size / 1024)} KB</p>
                    </div>
                  </a>
                )}
                {editingMessageId === message.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full p-2 rounded bg-green-600 text-white focus:outline-none"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={handleCancelEdit} className="text-xs text-gray-300 hover:text-white">Отмена</button>
                      <button onClick={handleSaveEdit} className="text-xs font-bold text-green-200 hover:text-white">Сохранить</button>
                    </div>
                  </div>
                ) : (
                    <>
                      {}
                      {message.reply_to && (
                        <div
                          className={`p-2 mb-2 rounded-lg ${isOwn ? 'bg-green-600' : 'bg-gray-700'} border border-green-500/30 cursor-pointer`}
                          onClick={() => message.reply_to?.id && scrollToMessage(message.reply_to.id)}
                        >
                          <p className="text-xs font-semibold text-green-300">{message.reply_to.sender?.username || 'Unknown'}</p>
                          <p className="text-sm text-gray-200 truncate">
                            {message.reply_to.text || (message.reply_to.photo ? 'Photo' : message.reply_to.voice_message ? 'Voice message' : message.reply_to.file ? 'File' : 'Empty message')}
                          </p>
                        </div>
                      )}
                      {}
                      {message.text && <p className="break-words">{message.text}</p>}
                    </>
                )}
                <p
                  className={`absolute bottom-1 right-3 text-xs ${
                    isOwn ? 'text-gray-700' : 'text-gray-500'
                  }`}
                >
                  {message.is_edited && 'изменено '}{formatTimeShort(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-gray-900 border-t border-green-500/30 p-4">
        {isRecording && (
          <div className="mb-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 font-semibold">Recording: {formatRecordingTime(recordingTime)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancelRecording}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              >
                <X size={20} />
              </button>
              <button
                onClick={handleStopRecording}
                className="p-2 bg-green-500 hover:bg-green-600 text-gray-900 rounded-lg transition-colors"
              >
                <Square size={20} />
              </button>
            </div>
          </div>
        )}

        {fileToSend && (
          <div className="mb-2 p-2 bg-gray-700 rounded-lg flex items-center justify-between text-sm text-gray-300 border border-green-500/30">
            <div className="flex items-center gap-3 flex-1 truncate">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-12 h-12 rounded-md object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-md bg-gray-600 flex items-center justify-center">
                  <FileIcon size={24} />
                </div>
              )}
              <div className="flex-1 truncate">
                <p className="font-semibold text-green-400">Файл для отправки:</p>
                <p className="truncate">{fileToSend.name}</p>
              </div>
            </div>
            <button onClick={() => {
              setFileToSend(null);
              setFilePreview(null);
            }} className="ml-2 text-gray-400 hover:text-red-400">
              <X size={16} />
            </button>
          </div>
        )}

        {replyToMessage && (
          <div className="mb-2 p-2 bg-gray-700 rounded-lg flex items-center justify-between text-sm text-gray-300 border border-green-500/30">
            <div className="flex-1 truncate">
              <p className="font-semibold text-green-400">Ответ на {replyToMessage.sender?.username || 'Unknown'}:</p>
              <p className="truncate">{replyToMessage.text || (replyToMessage.photo ? 'Фото' : replyToMessage.voice_message ? 'Голосовое сообщение' : replyToMessage.file ? 'Файл' : 'Пустое сообщение')}</p>
            </div>
            <button onClick={() => setReplyToMessage(null)} className="ml-2 text-gray-400 hover:text-red-400">
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
            disabled={isSending || isRecording}
          />

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!isRecording && !newMessage.trim() && !fileToSend && (
            <>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isSending}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ImageIcon size={20} />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
                className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Paperclip size={20} />
              </button>

              <button
                type="button"
                onClick={handleStartRecording}
                disabled={isSending}
                className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mic size={20} />
              </button>
            </>
          )}

          {(!isRecording && (newMessage.trim() || fileToSend)) && (
            <button
              type="submit"
              disabled={isSending}
              className="bg-green-500 hover:bg-green-600 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 neon-button"
            >
              <Send size={20} />
            </button>
          )}

        </form>
      </div>
    </div>
  );
}

import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, GroupMessage as Message, GroupChat } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Send, Users as GroupIcon, Mic, Square, Image as ImageIcon, X, Paperclip, File as FileIcon, Edit, Trash2, Reply, MoreVertical, Smile } from 'lucide-react';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { getMediaUrl, formatTimeShort } from '../../utils/media';
import { MediaGallery } from './MediaGallery';
import { GroupInfoPanel } from './GroupInfoPanel';


interface SystemMessage {
  id: number;
  isSystem: true;
  text: string;
  created_at: string;
}

type ChatItem = Message | SystemMessage;

interface GroupChatViewProps {
  
  groupUrl: string;
  onBack: () => void;
}

export function GroupChatView({ groupUrl, onBack }: GroupChatViewProps) {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isWsConnecting, setIsWsConnecting] = useState(true); 
  const [groupDetails, setGroupDetails] = useState<GroupChat | null>(null);
  const [groupId, setGroupId] = useState<number | null>(null); 
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [activeReactionMenu, setActiveReactionMenu] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [media, setMedia] = useState<{ photo: string[]; file: string[] } | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [fileToSend, setFileToSend] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); 
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { isRecording, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();
  const navigate = useNavigate();

  const isCreator = user?.id === groupDetails?.creator?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  
  
  const initializeGroupChat = useCallback(async () => {
    setIsLoading(true);
    try {
      
      const detailsData = await apiService.getGroupChatDetails(groupUrl);
      setGroupDetails(detailsData);
      setGroupId(detailsData.id); 

      
      const messagesData = await apiService.getGroupChatMessages(groupUrl);
      setMessages(messagesData);
      
      
      const processedMessages: ChatItem[] = messagesData.map((msg: any) => {
        if (msg.message_type === 'system_message') {
          return {
            id: msg.id,
            isSystem: true,
            text: msg.message, 
            created_at: msg.created_at,
          };
        }
        return msg as Message; 
      });
      setMessages(processedMessages);
    } catch (error) {
      console.error('Failed to initialize group chat:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupUrl]); 

  useEffect(() => {
    initializeGroupChat();
  }, [initializeGroupChat]); 

  useEffect(() => {
    
    if (!groupId) return;

    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      const ws = apiService.createGroupWebSocket(groupId);
      wsRef.current = ws;
      setIsWsConnecting(true);

      ws.onopen = () => {
        console.log('Group WebSocket connected');
        setIsWsConnecting(false);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'group_chat_message') {
          const newMessage: Message = {
            text: data.message,
            id: data.message_id,
            photo: data.photo,
            voice_message: data.voice_message,
            file: data.file,
            created_at: data.created_at,
            sender: {
              id: data.sender_id,
              username: data.username,
              avatar: data.avatar,
            },
            chat_group_id: groupId,
            reply_to: data.reply_to, 
            reactions: data.reactions,
          };
          setMessages((prevMessages) => {
            if (prevMessages.some((msg) => msg.id === newMessage.id)) {
              return prevMessages;
            }
            return [...prevMessages, newMessage];
          });
        } else if (data.type === 'group_message_edited') {
          setMessages(prev => prev.map(msg => {
            if (!('isSystem' in msg) && msg.id === data.message_id) {
              return { ...msg, text: data.new_text, is_edited: true };
            }
            return msg;
          }));
        } else if (data.type === 'group_message_deleted') {
          setMessages(prev => prev.map(msg => {
            if (!('isSystem' in msg) && msg.id === data.message_id) {
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
          }));
        } else if (data.type === 'group_system_message') {
          const newSystemMessage: SystemMessage = {
            id: data.message_id,
            isSystem: true,
            text: data.message,
            created_at: data.created_at,
          };
          setMessages((prevMessages) => {
            
            if (prevMessages.some((msg) => 'isSystem' in msg && msg.id === newSystemMessage.id)) {
              return prevMessages;
            }
            return [...prevMessages, newSystemMessage];
          });
          
          apiService.getGroupChatDetails(groupUrl)
            .then(setGroupDetails)
            .catch(err => console.error("Failed to refresh group details after system message:", err));

        } else if (data.type === 'group_message_reaction_updated') {
          setMessages(prev => prev.map(msg => {
            if (!('isSystem' in msg) && msg.id === data.message_id) {
              return { ...msg, reactions: data.reactions };
            }
            return msg;
          }));

        } else if (data.type === 'group_deleted') {
          alert(data.message || 'Эта группа была удалена.');
          navigate('/');

        } else if (data.type === 'error') {
          console.error('WebSocket error:', data.error);
        }
      };

      ws.onerror = (error) => {
        console.error('Group WebSocket error:', error);
        
      };

      ws.onclose = () => {
        console.log('Group WebSocket disconnected, attempting to reconnect in 5s...');
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
  }, [groupId]); 

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !fileToSend && !replyToMessage) || isSending || !groupUrl) return;

    setIsSending(true);
    const replyToId = replyToMessage?.id;
    try {
      if (fileToSend) {
        
        const isPhoto = fileToSend.type.startsWith('image/');
        if (isPhoto) {
          
          await apiService.sendGroupMessage(groupUrl, { photo: fileToSend, message: newMessage.trim() || undefined }, replyToId);
        } else {
          
          await apiService.sendGroupFile(groupUrl, fileToSend, newMessage.trim() || undefined, replyToId);
        }
      } else {
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ message: newMessage.trim(), reply_to_id: replyToId }));
        } else {
          await apiService.sendGroupMessage(groupUrl, { message: newMessage.trim() }, replyToId);
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
    if (!groupUrl || (!voiceBlob && !replyToMessage)) return;
    const replyToId = replyToMessage?.id;
    try {
      await apiService.sendGroupMessage(groupUrl, { voice: voiceBlob }, replyToId);
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
  };

  const handleReplyMessage = (message: Message) => {
    setReplyToMessage(message);
    
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = async () => {
    if (editingMessageId === null) return;
    setIsSending(true);
    try {
      await apiService.editGroupMessage(editingMessageId, editingText);
      
    } catch (error) {
      console.error('Failed to edit group message:', error);
    } finally {
      setIsSending(false);
      handleCancelEdit();
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить это сообщение?')) {
      try {
        await apiService.deleteGroupMessage(messageId);
        
      } catch (error) {
        console.error('Failed to delete group message:', error);
      }
    }
  };

  const handleReaction = async (messageId: number, reaction: string) => {
    try {
      await apiService.reactToGroupMessage(messageId, reaction);
    } catch (error) {
      console.error("Failed to add reaction to group message:", error);
    }
    setActiveReactionMenu(null);
  };

  const handleGroupUpdate = useCallback(() => {
    
    initializeGroupChat();
  }, [initializeGroupChat]); 

  const handleParticipantClick = (username: string) => {
    navigate(`/chat/${username}`);
    setShowGroupInfo(false); 
  };

  const handleOpenMediaGallery = async () => {
    if (!groupUrl) return;
    setShowOptionsMenu(false);
    setShowMediaGallery(true);
    setIsMediaLoading(true);
    try {
      
      const mediaData = await apiService.getGroupChatMedia(groupUrl);
      setMedia(mediaData);
    } catch (error) {
      console.error('Failed to load group media:', error);
    } finally {
      setIsMediaLoading(false);
    }
  };






  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      <GroupInfoPanel
        isOpen={showGroupInfo}
        onClose={() => setShowGroupInfo(false)}
        group={groupDetails}
        onParticipantClick={handleParticipantClick}
        groupUrl={groupUrl}
        onGroupUpdate={handleGroupUpdate}
        onImageClick={setLightboxImage}
        navigate={navigate} 
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
      <div className="bg-gray-900 border-b border-green-500/30 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-green-400 transition-colors md:hidden"
          >
            <ArrowLeft size={24} />
          </button>

          {groupDetails && (
            <button onClick={() => setShowGroupInfo(true)} className="flex items-center gap-3 text-left hover:bg-gray-800/50 p-2 -m-2 rounded-lg transition-colors min-w-0">
              <>
                {groupDetails.image ? (
                  <img
                    src={getMediaUrl(groupDetails.image)}
                    alt={groupDetails.name}
                    className="w-10 h-10 rounded-full border-2 border-green-500 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                    <GroupIcon className="text-green-400" size={24} />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-green-400 font-semibold truncate">{groupDetails.name}</h2>
                  <span className="text-xs text-gray-400">{groupDetails.participants.length} members</span>
                </div>
              </>
            </button>
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
          {showOptionsMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-10 border border-green-500/30">
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
          
          if ('isSystem' in message) {
            return (
              <div key={`sys-${message.id}`} className="text-center text-xs text-gray-400 py-1">
                <span className="bg-gray-800 px-3 py-1 rounded-full">
                  {message.text}
                </span>
              </div>
            );
          }

          const isOwn = message.sender?.id === user?.id;
          const senderId = message.sender?.id;
          const isSenderCreator = !isOwn && senderId === groupDetails?.creator.id;
          const customTag = senderId ? groupDetails?.tags?.[senderId] : null;
          const displayTag = isSenderCreator ? (customTag || 'Создатель') : customTag;
          const isAppCreator = senderId === 1;

          return (
            <div
              key={message.id}
              className={`flex flex-col group ${isOwn ? 'items-end' : 'items-start'} mb-4`}
            >
              <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`relative max-w-[70%] rounded-lg p-3 pb-8 ${
                    isOwn
                      ? 'bg-green-500 text-gray-900'
                      : 'bg-gray-800 text-gray-100 border border-green-500/30'
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
                    <div className={`absolute top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg p-1 flex gap-1 z-20 ${
                      isOwn ? 'right-0' : 'left-0'
                    }`}>
                      {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                        <button key={emoji} onClick={() => handleReaction(message.id, emoji)} className="p-1.5 text-lg rounded-md hover:bg-gray-700 transition-colors">
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
                      {isCreator && (
                        <button onClick={() => handleDeleteMessage(message.id)} className="p-1 bg-gray-700 rounded-full text-white hover:bg-red-600"><Trash2 size={14} /></button>
                      )}
                    </div>
                  )}
                  {!isOwn && message.text !== 'Сообщение удалено' && (
                    <div className="flex items-baseline gap-2 mb-1">
                      <p className={`text-xs font-bold ${isAppCreator ? 'text-yellow-400' : 'text-green-400'}`}>{message.sender.username}</p>
                      {displayTag && (
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                          isSenderCreator
                            ? 'text-green-300 bg-green-900/60 border-green-700'
                            : 'text-cyan-300 bg-cyan-900/60 border-cyan-700'
                        }`}>
                          {displayTag}
                        </span>
                      )}
                    </div>
                  )}
                  {message.photo && (
                    
                    message.reply_to && (
                      <div className={`p-2 mb-2 rounded-lg ${isOwn ? 'bg-green-600' : 'bg-gray-700'} border border-green-500/30`}>
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
                      <div className={`p-2 mb-2 rounded-lg ${isOwn ? 'bg-green-600' : 'bg-gray-700'} border border-green-500/30`}>
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
                      <div className={`p-2 mb-2 rounded-lg ${isOwn ? 'bg-green-600' : 'bg-gray-700'} border border-green-500/30`}>
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
                      <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full p-2 rounded bg-green-600 text-white focus:outline-none" rows={3} />
                      <div className="flex justify-end gap-2">
                        <button onClick={handleCancelEdit} className="text-xs text-gray-300 hover:text-white">Отмена</button>
                        <button onClick={handleSaveEdit} className="text-xs font-bold text-green-200 hover:text-white">Сохранить</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {}
                      {message.reply_to && (
                        <div className={`p-2 mb-2 rounded-lg ${isOwn ? 'bg-green-600' : 'bg-gray-700'} border border-green-500/30`}>
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
                  <p className={`absolute bottom-1 right-3 text-xs ${
                      isOwn ? 'text-gray-700' : 'text-gray-500'
                    }`}>{message.is_edited && 'изменено '}{formatTimeShort(message.created_at)}
                  </p>
                </div>
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
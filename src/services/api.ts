const API_BASE_URL = 'https://vsp210.ru/api/v3';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  gender?: string;
  info?: string | null;
  city?: string | null;
  is_online: boolean;
  first_name?: string | null;
  last_name?: string | null;
}

export interface RepliedMessage {
  id: number;
  text: string | null;
  photo: string | null;
  sender: User;
}

export interface Message {
  id: number;
  text: string | null;
  photo: string | null;
  voice_message: string | null;
  file: {
    url: string;
    name: string;
    size: number;
  } | null;
  created_at: string;
  is_edited?: boolean;
  sender: User | { type: string; id: number; username: string; avatar?: string | null };
  chat_room_id: number;
  button_json: unknown | null;
  reply_to?: RepliedMessage | null;
}

export interface Chat {
  id: number;
  user1: User;
  new_message_user1: boolean;
  user2: User;
  new_message_user2: boolean;
  last_message: Message | null;
  user_notification: boolean;
}

export interface GroupMessage {
  id: number;
  text: string | null;
  photo: string | null;
  voice_message: string | null;
  file: {
    url: string;
    name: string;
    size: number;
  } | null;
  created_at: string;
  is_edited?: boolean;
  sender: User;
  chat_group_id: number;
  reply_to?: RepliedMessage | null;
}

export interface GroupChat {
  id: number;
  name: string;
  url: string;
  image: string | null;
  participants: User[];
  last_message: GroupMessage | null;
}

export interface MediaArchive {
  photo: string[];
  file: string[];
}

export interface GroupEditData {
  name?: string;
  url?: string;
  image?: File | null;
  del_image?: boolean;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  getToken() {
    return this.token;
  }

  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Token ${this.token}`;
    }

    return headers;
  }

  async login(credentials: LoginCredentials) {
    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  async register(credentials: RegisterCredentials) {
    const response = await fetch(`${API_BASE_URL}/register/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  async logout() {
    const response = await fetch(`${API_BASE_URL}/logout/`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Logout failed');
    }

    this.clearToken();
    return await response.json();
  }

  async getMyData(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/my-data/`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user data');
    }

    return await response.json();
  }

  async updateProfile(formData: FormData): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/account/update/`, {
      method: 'PATCH',
      headers: {
        
        'Authorization': `Token ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    return await response.json();
  }

  async getUserData(username: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/user-data/${username}/`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'User not found');
    }

    return await response.json();
  }

  async searchUsers(query: string): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/search/`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ q: query }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Search failed');
    }

    const data = await response.json();
    return data.users;
  }

  async getChats(): Promise<Chat[]> {
    const response = await fetch(`${API_BASE_URL}/chats/`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch chats');
    }

    return await response.json();
  }

  async getChatMessages(username: string): Promise<Message[]> {
    const response = await fetch(`${API_BASE_URL}/chat/${username}/`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch messages');
    }

    return await response.json();
  }

  async sendMessage(username: string, message: string, replyToId?: number) {
    const formData = new FormData();
    formData.append('message', message);
    if (replyToId) {
      formData.append('reply_to_id', replyToId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/chat/${username}/send/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    return await response.json();
  }

  async sendPhoto(username: string, photo: Blob, message?: string, replyToId?: number) {
    const formData = new FormData();
    formData.append('photo', photo);
    if (message) {
      formData.append('message', message);
    }
    if (replyToId) {
      formData.append('reply_to_id', replyToId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/chat/${username}/send/photo/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send photo');
    }

    return await response.json();
  }

  async sendVoice(username: string, voice: Blob, replyToId?: number) {
    const formData = new FormData();
    formData.append('voice', voice);
    if (replyToId) {
      formData.append('reply_to_id', replyToId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/chat/${username}/send/voice/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send voice message');
    }

    return await response.json();
  }

  async sendFile(username: string, file: File, message?: string, replyToId?: number) {
    const formData = new FormData();
    formData.append('file', file);
    if (message) {
      formData.append('message', message);
    }
    if (replyToId) {
      formData.append('reply_to_id', replyToId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/chat/${username}/send/file/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send file');
    }

    return await response.json();
  }

  async editMessage(messageId: number, newText: string) {
    const response = await fetch(`${API_BASE_URL}/chat/message/${messageId}/`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      body: JSON.stringify({ text: newText }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to edit message');
    }
    return response.json();
  }

  async deleteMessage(messageId: number) {
    const response = await fetch(`${API_BASE_URL}/chat/message/${messageId}/`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete message');
    }
  }

  async createChat(username: string) {
    const response = await fetch(`${API_BASE_URL}/chat/create/${username}/`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create chat');
    }

    return await response.json();
  }

  async getChatDetails(username: string) {
    const response = await fetch(`${API_BASE_URL}/chat/chat_details/${username}/`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch chat details');
    }

    return await response.json();
  }

  async getChatMedia(username: string): Promise<MediaArchive> {
    const response = await fetch(`${API_BASE_URL}/chat/${username}/media/`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch chat media');
    }

    return await response.json();
  }

  createWebSocket(chatId: number): WebSocket {
    const wsUrl = `wss://vsp210.ru/ws/chat/${chatId}/?token=${this.token}`;
    return new WebSocket(wsUrl);
  }

  

  async getGroupChats(): Promise<GroupChat[]> {
    const response = await fetch(`${API_BASE_URL}/group-chats/`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch group chats');
    }

    return await response.json();
  }

  async getGroupChatMessages(groupUrl: string): Promise<GroupMessage[]> {
    const response = await fetch(`${API_BASE_URL}/group-chats/${groupUrl}/`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch group messages by URL');
    }

    return await response.json();
  }

  async getGroupChatDetails(groupUrl: string): Promise<GroupChat> {
    const response = await fetch(`${API_BASE_URL}/group-chats/${groupUrl}/details/`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch group chat details by URL');
    }

    return await response.json();
  }

  async sendGroupMessage(groupUrl: string, data: { message?: string; photo?: Blob; voice?: Blob }, replyToId?: number) {
    const formData = new FormData();
    if (data.message) {
      formData.append('message', data.message);
    }
    if (data.photo) {
      formData.append('photo', data.photo);
    }
    if (data.voice) {
      formData.append('voice', data.voice);
    }
    if (replyToId) {
      formData.append('reply_to_id', replyToId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/group-chats/${groupUrl}/send/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send group message');
    }

    return await response.json();
  }

  async sendGroupFile(groupUrl: string, file: File, message?: string, replyToId?: number) {
    const formData = new FormData();
    formData.append('file', file);
    if (message) {
      formData.append('message', message);
    }
    if (replyToId) {
      formData.append('reply_to_id', replyToId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/group-chats/${groupUrl}/send/file/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send file to group');
    }

    return await response.json();
  }

  async editGroupChat(groupUrl: string, data: GroupEditData) {
    const formData = new FormData();

    if (data.name !== undefined) {
      formData.append('name', data.name);
    }
    if (data.url !== undefined) {
      formData.append('url', data.url);
    }
    if (data.image) {
      formData.append('image', data.image);
    }
    if (data.del_image) {
      formData.append('del_image', 'true');
    }

    const response = await fetch(`${API_BASE_URL}/group-chats/${groupUrl}/edit/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to edit group chat');
    }

    return await response.json();
  }

  async editGroupMessage(messageId: number, newText: string) {
    const response = await fetch(`${API_BASE_URL}/group-chats/message/${messageId}/`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      body: JSON.stringify({ text: newText }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to edit group message');
    }
    return response.json();
  }

  async deleteGroupMessage(messageId: number) {
    const response = await fetch(`${API_BASE_URL}/group-chats/message/${messageId}/`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete group message');
    }
  }

  async getGroupChatMedia(groupUrl: string): Promise<MediaArchive> {
    const response = await fetch(`${API_BASE_URL}/group-chats/${groupUrl}/media/`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch group chat media');
    }

    return await response.json();
  }

  createGroupWebSocket(groupId: number): WebSocket {
    const wsUrl = `wss://vsp210.ru/ws/group/${groupId}/?token=${this.token}`;
    return new WebSocket(wsUrl);
  }

  async addParticipant(groupUrl: string, participantId: number): Promise<GroupChat> {
    const response = await fetch(`${API_BASE_URL}/group-chats/${groupUrl}/add-participant/`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ participant_id: participantId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add participant to group');
    }

    return await response.json();
  }

  async createGroupChat(name: string, participantIds: number[], image?: File | null): Promise<GroupChat> {
    const formData = new FormData();
    formData.append('name', name);
    participantIds.forEach(id => formData.append('participant_ids', id.toString()));

    if (image) {
      formData.append('image', image);
    }

    const response = await fetch(`${API_BASE_URL}/group-chats/create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create group chat');
    }

    return await response.json();
  }
}


export const apiService = new ApiService();

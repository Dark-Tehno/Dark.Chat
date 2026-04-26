import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { getMediaUrl } from '../../utils/media';
import { UserCircle, Edit } from 'lucide-react';

const defaultAvatars = [
  'https://vsp210.ru/media/avatars/default_user_photo.png',
  'https://vsp210.ru/media/avatars/default_user_photo_2.png',
  'https://vsp210.ru/media/avatars/default_user_photo_3.jpg',
  'https://vsp210.ru/media/avatars/default_user_photo_4.jpg',
];

export function ProfileSetupPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || sessionStorage.getItem('isNewUser') !== 'true') {
      navigate('/');
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    info: user?.info || '',
    city: user?.city || '',
    gender: user?.gender || 'unspecified',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar ? getMediaUrl(user.avatar) : null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDefaultAvatarSelect = async (url: string) => {
    setAvatarPreview(url);
    setAvatarFile(null);
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const filename = url.split('/').pop() || 'default-avatar.jpg';
        const file = new File([blob], filename, { type: blob.type });
        setAvatarFile(file);
    } catch (err) {
        console.error("Failed to fetch default avatar:", err);
        setError("Не удалось загрузить выбранный аватар. Пожалуйста, попробуйте снова или загрузите свой файл.");
    }
  };

  const finishSetup = () => {
    sessionStorage.removeItem('isNewUser');
    // Использование navigate() вызывает проблему с обновлением состояния, из-за которой виден пустой фон.
    // Полная перезагрузка страницы гарантирует, что приложение будет инициализировано с правильным состоянием.
    window.location.href = '/';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const data = new FormData();
    let hasChanges = false;

    if (formData.username !== (user?.username || '')) { data.append('username', formData.username); hasChanges = true; }
    if (formData.first_name !== (user?.first_name || '')) { data.append('first_name', formData.first_name); hasChanges = true; }
    if (formData.last_name !== (user?.last_name || '')) { data.append('last_name', formData.last_name); hasChanges = true; }
    if (formData.info !== (user?.info || '')) { data.append('info', formData.info); hasChanges = true; }
    if (formData.city !== (user?.city || '')) { data.append('city', formData.city); hasChanges = true; }
    if (formData.gender !== (user?.gender || 'unspecified')) { data.append('gender', formData.gender); hasChanges = true; }
    if (avatarFile) { hasChanges = true; data.append('avatar', avatarFile); }

    if (!hasChanges) {
        finishSetup();
        return;
    }

    try {
      const updatedUserData = await apiService.updateProfile(data);
      if (updateUser) {
        updateUser(updatedUserData);
      }
      finishSetup();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || 'Произошла ошибка при обновлении профиля.';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[95vh]">
        <div className="p-6 border-b border-green-500/30">
          <h2 className="text-2xl font-bold text-green-400">Настройка профиля</h2>
          <p className="text-gray-400 mt-1">Добро пожаловать в Dark.Chat! Давайте настроим ваш профиль.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex-shrink-0">
              {avatarPreview ? (<img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-green-500" />) : (<div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-green-500 flex items-center justify-center"><UserCircle className="text-green-400" size={48} /></div>)}
              <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute bottom-0 right-0 bg-gray-700 p-2 rounded-full text-white hover:bg-green-500 transition-colors" title="Загрузить свое фото"><Edit size={16} /></button>
              <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
            </div>
            <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-300 mb-2">Или выберите готовый аватар</label>
                <div className="flex gap-3 flex-wrap">
                    {defaultAvatars.map(url => (<img key={url} src={url} alt="Default avatar" onClick={() => handleDefaultAvatarSelect(url)} className={`w-16 h-16 rounded-full object-cover cursor-pointer border-2 transition-all ${avatarPreview === url ? 'border-green-500 scale-110' : 'border-transparent hover:border-green-500/50'}`}/>))}
                </div>
            </div>
          </div>
          <div className="space-y-4">
            <div><label htmlFor="username" className="block text-sm font-medium text-gray-300">Имя пользователя</label><input type="text" name="username" id="username" value={formData.username} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label htmlFor="first_name" className="block text-sm font-medium text-gray-300">Имя</label><input type="text" name="first_name" id="first_name" value={formData.first_name} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500" /></div>
              <div><label htmlFor="last_name" className="block text-sm font-medium text-gray-300">Фамилия</label><input type="text" name="last_name" id="last_name" value={formData.last_name} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500" /></div>
            </div>
            <div><label htmlFor="info" className="block text-sm font-medium text-gray-300">О себе</label><textarea name="info" id="info" value={formData.info} onChange={handleInputChange} rows={3} className="mt-1 w-full px-3 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500"></textarea></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label htmlFor="city" className="block text-sm font-medium text-gray-300">Город</label><input type="text" name="city" id="city" value={formData.city} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500" /></div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-300">Пол</label>
                <select name="gender" id="gender" value={formData.gender} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 bg-gray-800 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500">
                  <option value="unspecified">Не указан</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        </div>
        <div className="p-4 bg-gray-950 border-t border-green-500/30 flex justify-end gap-3">
          <button type="button" onClick={finishSetup} className="px-4 py-2 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">Пропустить</button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg font-semibold text-gray-900 bg-green-500 hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isSaving ? 'Сохранение...' : 'Сохранить и продолжить'}
          </button>
        </div>
      </form>
    </div>
  );
}
import { useState, useRef } from 'react';
import { Users as GroupIcon } from 'lucide-react';
import { apiService, GroupEditData } from '../../services/api';
import { getMediaUrl } from '../../utils/media';

interface GroupEditFormProps {
  group: { name: string; image: string | null; };
  groupUrl: string;
  navigate: (path: string) => void; 
  onGroupUpdate: () => void;
  onClose: () => void;
}

export function GroupEditForm({ group, groupUrl, navigate, onGroupUpdate, onClose }: GroupEditFormProps) {
  const [name, setName] = useState(group.name);
  const [url, setUrl] = useState(groupUrl); 
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(group.image ? getMediaUrl(group.image) : null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setShouldRemoveImage(false); 
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    setShouldRemoveImage(true); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const editData: GroupEditData = {};
      let hasDataToSend = false;

      if (name !== group.name) {
        editData.name = name;
        hasDataToSend = true;
      }
      if (url !== groupUrl) {
        editData.url = url;
        hasDataToSend = true;
      }
      if (imageFile) {
        editData.image = imageFile;
        hasDataToSend = true;
      } else if (shouldRemoveImage && group.image) {
        editData.del_image = true;
        hasDataToSend = true;
      }

      if (hasDataToSend) {
        await apiService.editGroupChat(groupUrl, editData);
        alert('Группа успешно обновлена!');
        onGroupUpdate();
        
        if (url !== groupUrl) {
          navigate(`/group/${url}`);
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to edit group', error);
      alert('Ошибка при обновлении группы.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="group-name" className="block text-sm font-medium text-gray-300 mb-1">Название группы</label>
        <input
          type="text"
          id="group-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
        />
      </div>
      <div>
        <label htmlFor="group-url" className="block text-sm font-medium text-gray-300 mb-1">URL группы (уникальный идентификатор)</label>
        <input
          type="text"
          id="group-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Изображение группы</label>
        <div className="flex items-center gap-4">
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
              <GroupIcon size={32} className="text-gray-400" />
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImageChange} ref={imageInputRef} className="hidden" />
          <button type="button" onClick={() => imageInputRef.current?.click()} className="text-sm text-green-400 hover:text-green-300">Изменить</button>
          {imagePreview && <button type="button" onClick={handleRemoveImage} className="text-sm text-red-400 hover:text-red-300">Удалить</button>}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-gray-600 hover:bg-gray-500 text-white">Отмена</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-500 text-white disabled:opacity-50">
          {isSubmitting ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
}
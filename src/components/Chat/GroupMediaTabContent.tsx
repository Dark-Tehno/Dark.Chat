import { useState, useEffect } from 'react';
import { File as FileIcon } from 'lucide-react';
import { apiService } from '../../services/api';
import { getMediaUrl, getFileNameFromUrl } from '../../utils/media';

interface GroupMediaTabContentProps {
  groupUrl: string;
  onImageClick: (url: string) => void;
}

export function GroupMediaTabContent({ groupUrl, onImageClick }: GroupMediaTabContentProps) {
  const [media, setMedia] = useState<{ photo: string[]; file: string[] } | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'files'>('photos');

  useEffect(() => {
    const loadMedia = async () => {
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
    loadMedia();
  }, [groupUrl]);

  if (isMediaLoading) {
    return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-12 w-12 border-2 border-green-500 border-t-transparent"></div></div>;
  }
  if (!media || (media.photo.length === 0 && media.file.length === 0)) {
    return <div className="flex items-center justify-center h-48 text-gray-500"><p>Медиафайлы не найдены</p></div>;
  }

  return (
    <div>
      <div className="border-b border-gray-700 mb-4">
        <nav className="flex space-x-4">
          <button onClick={() => setActiveMediaTab('photos')} className={`py-2 px-1 text-sm font-medium ${activeMediaTab === 'photos' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-gray-200'}`}>Фото</button>
          <button onClick={() => setActiveMediaTab('files')} className={`py-2 px-1 text-sm font-medium ${activeMediaTab === 'files' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-gray-200'}`}>Файлы</button>
        </nav>
      </div>
      {activeMediaTab === 'photos' && (media.photo.length > 0 ? (<div className="grid grid-cols-3 gap-2">{media.photo.map((photoUrl, index) => (<a key={index} href={getMediaUrl(photoUrl)} onClick={(e) => { e.preventDefault(); onImageClick(getMediaUrl(photoUrl)); }} className="aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer"><img src={getMediaUrl(photoUrl)} alt={`media ${index}`} className="w-full h-full object-cover" /></a>))}</div>) : (<div className="flex items-center justify-center h-32 text-gray-500"><p>Фотографии не найдены</p></div>))}
      {activeMediaTab === 'files' && (media.file.length > 0 ? (<div className="space-y-2">{media.file.map((fileUrl, index) => { const fileName = getFileNameFromUrl(fileUrl); return (<a key={index} href={getMediaUrl(fileUrl)} target="_blank" rel="noopener noreferrer" download={fileName} className="flex items-center gap-3 rounded-lg p-2 transition-colors bg-gray-800 hover:bg-gray-700 border border-gray-700"><div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-600"><FileIcon size={20} className="text-gray-300" /></div><div className="flex-1 min-w-0"><p className="font-semibold truncate text-xs text-gray-200">{fileName}</p></div></a>); })}</div>) : (<div className="flex items-center justify-center h-32 text-gray-500"><p>Файлы не найдены</p></div>))}
    </div>
  );
}
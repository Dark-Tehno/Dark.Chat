import { useEffect, useState } from 'react';
import { X, FileIcon } from 'lucide-react';
import { getMediaUrl, getFileNameFromUrl } from '../../utils/media';

interface MediaGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  media: { photo: string[]; file: string[] } | null;
  isMediaLoading: boolean;
  onImageClick: (url: string) => void;
}

export function MediaGallery({ isOpen, onClose, media, isMediaLoading, onImageClick }: MediaGalleryProps) {
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
import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import { ProxiedImage } from './ProxiedImage';
import { Search, X } from 'lucide-react';

interface Gif {
  id: string;
  images: {
    fixed_width: {
      url: string;
      width: string;
      height: string;
    };
  };
  title: string;
}

interface GifPickerProps {
  onClose: () => void;
  onGifSelect: (url: string) => void;
}

export const GifPicker: React.FC<GifPickerProps> = ({ onClose, onGifSelect }) => {
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchGifs = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.searchGifs(query);
      setGifs(response.data);
    } catch (error) {
      console.error('Failed to fetch GIFs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGifs(''); // Загружаем тренды при первом открытии
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      fetchGifs(searchTerm);
    }, 500); // Задержка в 500 мс для уменьшения числа запросов

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [searchTerm]);

  return (
    <div className="absolute bottom-full mb-2 w-full max-w-md bg-gray-900 border border-green-500/30 rounded-lg shadow-lg z-20 flex flex-col h-[400px]">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input ref={searchInputRef} type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search for GIFs" className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500" />
        </div>
        <button onClick={onClose} className="p-2 ml-2 text-gray-400 hover:text-red-400"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div></div>
        ) : (
          <div className="grid grid-cols-3 gap-2">{gifs.map((gif) => (<button key={gif.id} onClick={() => onGifSelect(gif.images.fixed_width.url)} className="aspect-square bg-gray-800 rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-green-500"><ProxiedImage src={gif.images.fixed_width.url} alt={gif.title} className="w-full h-full object-cover" /></button>))}</div>
        )}
      </div>
    </div>
  );
};
import { useState, useEffect } from 'react';

interface ProxiedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

const API_BASE_URL = 'https://vsp210.ru/api/v3/gifs/proxy?url=';

export function ProxiedImage({ src, ...props }: ProxiedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasErrored, setHasErrored] = useState(false);

  useEffect(() => {
    // Сбрасываем состояние при изменении `src`
    setImageSrc(src);
    setHasErrored(false);
  }, [src]);

  const handleError = () => {
    if (!hasErrored) {
      setHasErrored(true);
      const proxiedUrl = `${API_BASE_URL}${encodeURIComponent(src)}`;
      setImageSrc(proxiedUrl);
    }
  };

  return (
    <img
      crossOrigin="anonymous"
      src={imageSrc}
      onError={handleError}
      {...props}
    />
  );
}
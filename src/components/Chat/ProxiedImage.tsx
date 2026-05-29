import { useState, useEffect } from 'react';

interface ProxiedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

import { API_BASE_URL } from '../../config';

const API_PROXY_PREFIX = `${API_BASE_URL}/gifs/proxy?url=`;

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
      const proxiedUrl = `${API_PROXY_PREFIX}${encodeURIComponent(src)}`;
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
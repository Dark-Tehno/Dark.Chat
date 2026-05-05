import { useState } from 'react';

interface ProxiedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

const PROXY_URL = 'http://tests.vsp210.ru:8888/';

export function ProxiedImage({ src, ...props }: ProxiedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasErrored, setHasErrored] = useState(false);

  const handleError = () => {
    if (!hasErrored) {
      setHasErrored(true);
      const proxiedUrl = `${PROXY_URL}${src}`;
      setImageSrc(proxiedUrl);
    }
  };

  return (
    <img
      src={imageSrc}
      onError={handleError}
      {...props}
    />
  );
}
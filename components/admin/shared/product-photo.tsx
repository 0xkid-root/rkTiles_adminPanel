import React from 'react';

interface ProductPhotoProps {
  src: string;
  name: string;
  className?: string;
}

export function ProductPhoto({ src, name, className = '' }: ProductPhotoProps) {
  return <img className={`product-photo ${className}`} src={src} alt={name} loading="lazy" />;
}

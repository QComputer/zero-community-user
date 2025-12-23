import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '../lib/utils';

interface AvatarLinkProps {
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
  userId?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

const AvatarLink: React.FC<AvatarLinkProps> = ({
  src,
  alt,
  fallback,
  userId,
  className,
  children,
  onClick,
}) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    if (userId) {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/public/profile/${userId}`);
    }
    if (onClick) {
      onClick();
    }
  };

  if (children) {
    return (
      <div
        onClick={handleClick}
        className={cn('cursor-pointer hover:opacity-80 transition-opacity', className)}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn('cursor-pointer hover:opacity-80 transition-opacity', className)}
    >
      <Avatar>
        {src && (
          <AvatarImage src={src} alt={alt} />
        )}
        {fallback && <AvatarFallback>{fallback}</AvatarFallback>}
      </Avatar>
    </div>
  );
};

export default AvatarLink;

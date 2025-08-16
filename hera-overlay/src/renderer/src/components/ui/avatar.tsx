import React, { useState, useMemo } from 'react';
import Gravatar from 'react-gravatar';
import {
  generateShapesAvatar,
  generateIdenticonAvatar,
  generateBotttsAvatar
} from '../../utils/avatar';
import { cn } from '../../utils/cn';

interface AvatarProps {
  userId: string;
  size?: number;
  className?: string;
  style?: 'shapes' | 'identicon' | 'bottts';
}

export const Avatar: React.FC<AvatarProps> = ({
  userId,
  size = 150,
  className = '',
  style = 'identicon'
}) => {
  const [gravatarError, setGravatarError] = useState(false);

  // Generate DiceBear avatar using userId as seed for consistency
  const dicebearAvatar = useMemo(() => {
    switch (style) {
      case 'identicon':
        return generateIdenticonAvatar(userId, size);
      case 'bottts':
        return generateBotttsAvatar(userId, size);
      case 'shapes':
      default:
        return generateShapesAvatar(userId, size);
    }
  }, [userId, size, style]);

  const handleGravatarError = () => {
    setGravatarError(true);
  };

  if (gravatarError) {
    // Render DiceBear fallback avatar
    return (
      <img
        src={dicebearAvatar}
        alt="User Avatar"
        className={cn('', className)}
        style={{
          width: size,
          height: size
        }}
      />
    );
  }

  // Try Gravatar first
  return <Gravatar md5={userId} size={size} className={className} onError={handleGravatarError} />;
};

export default Avatar;

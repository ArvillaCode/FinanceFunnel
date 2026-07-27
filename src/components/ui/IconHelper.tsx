import React from 'react';
import * as Icons from 'lucide-react';

interface IconHelperProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export const IconHelper: React.FC<IconHelperProps> = ({ name, className = 'w-5 h-5', size, color }) => {
  // @ts-ignore
  const IconComponent = Icons[name] || Icons.MoreHorizontal;
  return <IconComponent className={className} size={size} style={{ color }} />;
};

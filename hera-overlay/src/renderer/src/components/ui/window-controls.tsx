import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import { Button } from './button';

interface WindowControlsProps {
  className?: string;
}

const WindowControls: React.FC<WindowControlsProps> = ({ className = '' }) => {
  const handleMinimize = () => {
    window.api.window.minimize();
  };

  const handleMaximize = () => {
    window.api.window.maximize();
  };

  const handleClose = () => {
    window.api.window.close();
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <Button
        onClick={handleMinimize}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Minimize"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Button
        onClick={handleMaximize}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Maximize"
      >
        <Square className="h-4 w-4" />
      </Button>
      <Button
        onClick={handleClose}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 hover:bg-red-500 hover:text-white"
        title="Close"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default WindowControls;

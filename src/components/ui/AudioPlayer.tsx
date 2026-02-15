import React from 'react';
export const AudioPlayer: React.FC<any> = ({ children, className }) => (
  <div className={`ui-audioplayer ${className || ''}`}>
    {children || 'AudioPlayer Component'}
  </div>
);
import React from 'react';
export const VideoPlayer: React.FC<any> = ({ children, className }) => (
  <div className={`ui-videoplayer ${className || ''}`}>
    {children || 'VideoPlayer Component'}
  </div>
);
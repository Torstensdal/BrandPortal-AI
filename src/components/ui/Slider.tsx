import React from 'react';
export const Slider: React.FC<any> = ({ children, className }) => (
  <div className={`ui-slider ${className || ''}`}>
    {children || 'Slider Component'}
  </div>
);
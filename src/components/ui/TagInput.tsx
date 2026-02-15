import React from 'react';
export const TagInput: React.FC<any> = ({ children, className }) => (
  <div className={`ui-taginput ${className || ''}`}>
    {children || 'TagInput Component'}
  </div>
);
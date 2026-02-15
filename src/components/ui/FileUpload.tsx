import React from 'react';
export const FileUpload: React.FC<any> = ({ children, className }) => (
  <div className={`ui-fileupload ${className || ''}`}>
    {children || 'FileUpload Component'}
  </div>
);
import React from 'react';
export const DatePicker: React.FC<any> = ({ children, className }) => (
  <div className={`ui-datepicker ${className || ''}`}>
    {children || 'DatePicker Component'}
  </div>
);
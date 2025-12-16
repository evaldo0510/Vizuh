
import React from 'react';

export const Logo = ({ className, classNamePath, classNameEye }: { className?: string, classNamePath?: string, classNameEye?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" className={classNamePath} />
    <circle cx="12" cy="12" r="3" className={classNameEye} />
  </svg>
);

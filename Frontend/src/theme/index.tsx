import React from 'react';

interface ThemeConfigProps {
  children: React.ReactNode;
}

const ThemeConfig: React.FC<ThemeConfigProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
};

export default ThemeConfig;

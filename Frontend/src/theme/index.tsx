import React from 'react';

interface ThemeConfigProps {
  children: React.ReactNode;
}

const ThemeConfig: React.FC<ThemeConfigProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      {children}
    </div>
  );
};

export default ThemeConfig;

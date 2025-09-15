import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '../ui/button';
import PDFShareModal from './PDFShareModal';

interface PDFShareButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'lg' | 'default';
}

const PDFShareButton: React.FC<PDFShareButtonProps> = ({ 
  className, 
  variant = 'outline', 
  size = 'sm' 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleShareSuccess = (shareData: any) => {
    console.log('Document shared successfully:', shareData);
    // You can add additional success handling here
    // For example, show a toast notification
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        variant={variant}
        size={size}
        className={className}
      >
        <Share2 size={16} className="mr-2" />
        Share PDF
      </Button>

      <PDFShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleShareSuccess}
      />
    </>
  );
};

export default PDFShareButton;

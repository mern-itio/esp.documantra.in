import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../DocumentService/ui/button';
import { Input } from '../DocumentService/ui/input';

interface PageNavigatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PageNavigator: React.FC<PageNavigatorProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={goToPreviousPage}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      
      <div className="flex items-center space-x-1">
        <Input
          type="number"
          value={currentPage}
          onChange={handlePageInputChange}
          min={1}
          max={totalPages}
          className="w-16 text-center"
        />
        <span className="text-sm text-gray-500">of {totalPages}</span>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={goToNextPage}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

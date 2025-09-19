import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '../DocumentService/ui/button';

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomChange
}) => {
  const zoomIn = () => {
    onZoomChange(Math.min(3, zoom + 0.25));
  };

  const zoomOut = () => {
    onZoomChange(Math.max(0.5, zoom - 0.25));
  };

  const resetZoom = () => {
    onZoomChange(1);
  };

  // const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
  // const currentZoomLevel = zoomLevels.find(level => Math.abs(level - zoom) < 0.1) || zoom;

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={zoomOut}
        disabled={zoom <= 0.5}
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      
      <span className="text-sm text-gray-600 min-w-[60px] text-center">
        {Math.round(zoom * 100)}%
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={zoomIn}
        disabled={zoom >= 3}
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={resetZoom}
        title="Reset zoom"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
    </div>
  );
};

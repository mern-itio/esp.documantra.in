import React, { useState } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '../DocumentService/ui/button';

interface ImageUploaderProps {
  currentPage: number;
  onAddEdit: (edit: any) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentPage,
  onAddEdit
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImage = () => {
    if (selectedImage) {
      onAddEdit({
        type: 'addImage',
        pageNumber: currentPage,
        position: {
          x: 50,
          y: 50,
          width: 200,
          height: 150
        },
        imageData: selectedImage,
        style: {
          rotation: 0
        }
      });
      setSelectedImage(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <ImageIcon className="w-4 h-4 text-gray-500" />
        <h4 className="font-medium text-gray-700">Image Uploader</h4>
      </div>

      <div className="text-sm text-gray-600">
        <p>Upload an image to insert into the PDF.</p>
      </div>

      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
        >
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">Click to upload image</p>
        </label>
      </div>

      {selectedImage && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <p>Preview:</p>
          </div>
          <img
            src={selectedImage}
            alt="Preview"
            className="w-full h-32 object-contain border border-gray-300 rounded"
          />
          <Button
            onClick={handleAddImage}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Add Image to PDF
          </Button>
        </div>
      )}
    </div>
  );
};

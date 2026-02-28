'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface LogoUploadProps {
  currentLogo?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isLoading?: boolean;
}

export default function LogoUpload({ currentLogo, onUpload, onRemove, isLoading }: LogoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    onUpload(file);
  };

  const handleRemoveLogo = () => {
    setPreview(null);
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const logoSrc = preview || currentLogo;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Site Logo
        </CardTitle>
        <CardDescription>
          Upload your site logo. Recommended size: 200x60px or similar aspect ratio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {logoSrc ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <div className="relative">
                <Image
                  src={logoSrc}
                  alt="Site Logo"
                  width={200}
                  height={60}
                  className="max-h-16 w-auto object-contain"
                  unoptimized
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Replace Logo
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemoveLogo}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Remove Logo
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 text-gray-400">
                <Upload className="w-full h-full" />
              </div>
              <div>
                <p className="text-lg font-medium">Upload Logo</p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop your logo here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  PNG, JPG, or SVG up to 5MB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                Choose File
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
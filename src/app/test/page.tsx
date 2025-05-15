'use client'

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader } from 'lucide-react';

// Each particle represents a single character flying from the volcano
type Particle = { id: string; char: string; x: number };

export default function ImageTestPage() {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    setFetching(true);
    const res = await fetch('/api/images');
    const data = await res.json();
    // data.images is an array of { id, url, filename, createdAt }
    setImages(data.images?.map((img: any) => img.url) || []);
    setFetching(false);
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/images', {
      method: 'POST',
      body: formData,
    });
    setUploading(false);
    if (res.ok) {
      // Optionally, add the new image to the list optimistically
      const data = await res.json();
      if (data.image?.url) setImages(prev => [data.image.url, ...prev]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-xl font-semibold mb-4">Image Upload & Fetch Test</h1>
      <form onSubmit={handleUpload} className="flex gap-2 items-center mb-6">
        <input type="file" accept="image/*" ref={fileInputRef} className="border rounded px-2 py-1" />
        <Button type="submit" disabled={uploading}>
          {uploading ? <Loader className="animate-spin h-4 w-4" /> : 'Upload'}
        </Button>
      </form>
      <Button variant="outline" onClick={fetchImages} disabled={fetching} className="mb-4">
        {fetching ? <Loader className="animate-spin h-4 w-4" /> : 'Fetch Images'}
      </Button>
      <div className="grid grid-cols-2 gap-4">
        {images.map((url, i) => (
          <Card key={url + i} className="overflow-hidden">
            <CardContent className="p-2 flex items-center justify-center">
              <img src={url} alt="uploaded" className="object-cover max-h-40 w-full rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

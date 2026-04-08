'use client';
import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@entities/category/model/queries';
import { useCreateListing } from '../model/useCreateListing';

const CONDITIONS = ['new', 'used', 'refurbished'] as const;

export function CreateListingForm() {
  const t = useTranslations();
  const { mutate, isPending } = useCreateListing();
  const { data: categories } = useCategories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [condition, setCondition] = useState<string>('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const added = Array.from(files).slice(0, 10 - images.length);
    setImages((prev) => [...prev, ...added]);
    setPreviews((prev) => [...prev, ...added.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !price) return;
    mutate({
      title,
      description,
      price: parseFloat(price),
      category_id: categoryId ? Number(categoryId) : undefined,
      condition: condition || undefined,
      location: location || undefined,
      images,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">Название *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Описание *</Label>
        <Textarea
          id="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Цена (TON) *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.001"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Состояние</Label>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите..." />
            </SelectTrigger>
            <SelectContent>
              {CONDITIONS.map((c) => (
                <SelectItem key={c} value={c}>{t(`listing.condition.${c}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Категория</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите..." />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.icon ? `${c.icon} ` : ''}{c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Местоположение</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>

      {/* Image upload */}
      <div className="space-y-2">
        <Label>Фотографии (до 10)</Label>
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative size-20 rounded-md overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {images.length < 10 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="size-20 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground hover:border-primary transition-colors"
            >
              <ImagePlus className="size-6" />
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addImages(e.target.files)}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? 'Сохранение...' : t('listing.create')}
      </Button>
    </form>
  );
}

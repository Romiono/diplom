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
import { toAbsoluteUrl } from '@shared/lib/utils';
import type { Listing } from '@shared/types/api';
import { useEditListing } from '../model/useEditListing';

interface Props {
  listing: Listing;
  onSuccess?: () => void;
}

const CONDITIONS = ['new', 'used', 'refurbished'] as const;

export function EditListingForm({ listing, onSuccess }: Props) {
  const t = useTranslations();
  const { mutate, isPending } = useEditListing(listing.id);
  const { data: categories } = useCategories();

  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [price, setPrice] = useState(String(listing.price));
  const [categoryId, setCategoryId] = useState(listing.category_id ? String(listing.category_id) : 'none');
  const [condition, setCondition] = useState(listing.condition ?? 'none');
  const [location, setLocation] = useState(listing.location ?? '');

  const [existingUrls, setExistingUrls] = useState<string[]>(
    listing.images.map((i) => i.image_url),
  );
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const totalAllowed = 10 - existingUrls.length - newImages.length;
    const added = Array.from(files).slice(0, totalAllowed);
    setNewImages((prev) => [...prev, ...added]);
    setNewPreviews((prev) => [...prev, ...added.map((f) => URL.createObjectURL(f))]);
  };

  const removeExisting = (idx: number) => {
    setExistingUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeNew = (idx: number) => {
    URL.revokeObjectURL(newPreviews[idx]);
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      {
        title,
        description,
        price: parseFloat(price),
        category_id: categoryId !== 'none' ? Number(categoryId) : null,
        condition: condition !== 'none' ? condition : undefined,
        location: location || undefined,
        newImages,
        existingImageUrls: existingUrls,
      },
      { onSuccess },
    );
  };

  const totalImages = existingUrls.length + newImages.length;
  const placeholder = t('listing.form.selectPlaceholder');

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="edit-title">{t('listing.form.titleLabel')}</Label>
        <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">{t('listing.form.descriptionLabel')}</Label>
        <Textarea id="edit-description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-price">{t('listing.form.priceLabel')}</Label>
          <Input id="edit-price" type="number" min="0" step="0.001" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>{t('listing.form.conditionLabel')}</Label>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('listing.form.noCategory')}</SelectItem>
              {CONDITIONS.map((c) => (
                <SelectItem key={c} value={c}>{t(`listing.condition.${c}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('listing.form.categoryLabel')}</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('listing.form.noCategory')}</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.icon ? `${c.icon} ` : ''}{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-location">{t('listing.form.locationLabel')}</Label>
          <Input id="edit-location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('listing.form.photosLabel')}</Label>
        <div className="flex flex-wrap gap-2">
          {existingUrls.map((url, i) => (
            <div key={url} className="relative size-20 rounded-md overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={toAbsoluteUrl(url)} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeExisting(i)} className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5">
                <X className="size-3" />
              </button>
            </div>
          ))}
          {newPreviews.map((src, i) => (
            <div key={i} className="relative size-20 rounded-md overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeNew(i)} className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5">
                <X className="size-3" />
              </button>
            </div>
          ))}
          {totalImages < 10 && (
            <button type="button" onClick={() => fileRef.current?.click()} className="size-20 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground hover:border-primary transition-colors">
              <ImagePlus className="size-6" />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? t('listing.form.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}

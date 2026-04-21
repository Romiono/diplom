'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@entities/review/ui/StarRating';
import { useCreateReview } from '../model/useCreateReview';

interface Props {
  transactionId: string;
  revieweeId: string;
  onSuccess?: () => void;
}

export function CreateReviewForm({ transactionId, revieweeId, onSuccess }: Props) {
  const t = useTranslations('review');
  const { mutate, isPending } = useCreateReview(revieweeId);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    mutate(
      { transactionId, rating, comment: comment.trim() || undefined },
      { onSuccess },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{t('rating')}</Label>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="review-comment">{t('comment')}</Label>
        <Textarea
          id="review-comment"
          rows={3}
          placeholder={t('commentPlaceholder')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={isPending || rating === 0}>
        {isPending ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}

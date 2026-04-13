'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@entities/category/model/queries';
import type { ListingSearchParams } from '@shared/types/api';

interface Props {
  onClose?: () => void;
}

const CONDITIONS = ['new', 'used', 'refurbished'] as const;
const SORT_BY = ['created_at', 'price', 'views_count'] as const;

export function ListingsFilter({ onClose }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: categories } = useCategories();

  const get = (key: string) => searchParams?.get(key) ?? null;

  const current: ListingSearchParams = {
    query: get('query') ?? undefined,
    category_id: get('category_id') ? Number(get('category_id')) : undefined,
    minPrice: get('minPrice') ? Number(get('minPrice')) : undefined,
    maxPrice: get('maxPrice') ? Number(get('maxPrice')) : undefined,
    condition: (get('condition') as ListingSearchParams['condition']) ?? undefined,
    location: get('location') ?? undefined,
    sortBy: (get('sortBy') as ListingSearchParams['sortBy']) ?? undefined,
    sortOrder: (get('sortOrder') as 'ASC' | 'DESC') ?? undefined,
  };

  const apply = (patch: Partial<ListingSearchParams>) => {
    const next = { ...current, ...patch };
    const qs = new URLSearchParams(
      Object.entries(next)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    router.push(`${pathname ?? ''}?${qs}`);
  };

  const reset = () => router.push(pathname ?? '');

  return (
    <div className="space-y-5 p-1">
      <div className="space-y-2">
        <Label>{t('common.search')}</Label>
        <Input
          placeholder={t('common.search')}
          defaultValue={current.query}
          onBlur={(e) => apply({ query: e.target.value || undefined })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') apply({ query: (e.target as HTMLInputElement).value || undefined });
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('listing.filter.category')}</Label>
        <Select
          value={current.category_id?.toString() ?? 'all'}
          onValueChange={(v) => apply({ category_id: v === 'all' ? undefined : Number(v) })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('listing.filter.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('listing.filter.allCategories')}</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.icon ? `${c.icon} ` : ''}{c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>{t('listing.filter.priceFrom')}</Label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            defaultValue={current.minPrice}
            onBlur={(e) => apply({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('listing.filter.priceTo')}</Label>
          <Input
            type="number"
            min={0}
            placeholder="∞"
            defaultValue={current.maxPrice}
            onBlur={(e) => apply({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('listing.filter.condition')}</Label>
        <Select
          value={current.condition ?? 'all'}
          onValueChange={(v) => apply({ condition: v === 'all' ? undefined : (v as ListingSearchParams['condition']) })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('listing.filter.anyCondition')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('listing.filter.anyCondition')}</SelectItem>
            {CONDITIONS.map((c) => (
              <SelectItem key={c} value={c}>{t(`listing.condition.${c}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('listing.filter.sort')}</Label>
        <Select
          value={current.sortBy ?? 'created_at'}
          onValueChange={(v) => apply({ sortBy: v as ListingSearchParams['sortBy'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_BY.map((s) => (
              <SelectItem key={s} value={s}>{t(`listing.sort.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={onClose}>
          {t('common.filter')}
        </Button>
        <Button variant="outline" onClick={() => { reset(); onClose?.(); }}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}

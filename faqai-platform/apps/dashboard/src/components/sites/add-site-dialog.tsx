'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useSitesStore } from '@/stores/sites-store';
import { ApiError } from '@/lib/api-client';

const schema = z.object({
  name: z.string().min(1, 'サイト名は必須です').max(255),
  url: z.string().url('有効なURLを入力してください'),
  max_pages: z.coerce.number().int().min(1).max(100).default(20),
  max_depth: z.coerce.number().int().min(1).max(5).default(3),
});

type FormValues = z.infer<typeof schema>;

interface AddSiteDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddSiteDialog({ open, onClose }: AddSiteDialogProps) {
  const createSite = useSitesStore((s) => s.createSite);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { max_pages: 20, max_depth: 3 },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await createSite({
        name: values.name,
        url: values.url,
        crawlConfig: {
          max_pages: values.max_pages,
          max_depth: values.max_depth,
        },
      });
      toast.success(`「${values.name}」を追加しました`);
      handleClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'サイトの追加に失敗しました';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} title="サイトを追加">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">サイト名</Label>
          <Input
            id="name"
            placeholder="例: 公式サポートページ"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            type="url"
            placeholder="https://example.com"
            {...register('url')}
          />
          {errors.url && (
            <p className="text-sm text-destructive">{errors.url.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="max_pages">最大ページ数</Label>
            <Input
              id="max_pages"
              type="number"
              min={1}
              max={100}
              {...register('max_pages')}
            />
            {errors.max_pages && (
              <p className="text-sm text-destructive">{errors.max_pages.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="max_depth">最大深度</Label>
            <Input
              id="max_depth"
              type="number"
              min={1}
              max={5}
              {...register('max_depth')}
            />
            {errors.max_depth && (
              <p className="text-sm text-destructive">{errors.max_depth.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            キャンセル
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Spinner size="sm" className="mr-2" />}
            追加する
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

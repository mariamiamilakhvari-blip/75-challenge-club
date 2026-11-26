'use client';
import { TodayItem } from '@/features/checkin/types/checkin.types';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

type UncheckDialogProps = {
  item: TodayItem | null;
  onClose: () => void;
  onConfirm: (item: TodayItem) => void;
};

export const UncheckDialog = ({ item, onClose, onConfirm }: UncheckDialogProps) => {
  const confirm = () => {
    if (!item) return;
    onConfirm(item);
    onClose();
  };

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Undo check-in?</DialogTitle>
          <DialogDescription>
            &ldquo;{item?.title}&rdquo; will be marked as not done{item?.comment ? ' and its note removed' : ''}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-full" onClick={onClose}>
            Keep it
          </Button>
          <Button variant="destructive" className="rounded-full" onClick={confirm}>
            Undo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

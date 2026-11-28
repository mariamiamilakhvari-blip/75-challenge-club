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
import { exceptionNoun } from '@/shared/utils/challenge-rules';

type ExceptionDialogProps = {
  item: TodayItem | null;
  onClose: () => void;
  onConfirm: (item: TodayItem) => void;
};

export const ExceptionDialog = ({ item, onClose, onConfirm }: ExceptionDialogProps) => {
  const noun = item ? exceptionNoun(item.key) : 'cheat';

  const confirm = () => {
    if (!item) return;
    onConfirm(item);
    onClose();
  };

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Use another {noun}?</DialogTitle>
          <DialogDescription>
            This is your 2nd exception this month. It counts as a miss and your counter will restart at Day 1
            tomorrow.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-full" onClick={onClose}>
            Stay clean
          </Button>
          <Button variant="destructive" className="rounded-full" onClick={confirm}>
            Log it anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

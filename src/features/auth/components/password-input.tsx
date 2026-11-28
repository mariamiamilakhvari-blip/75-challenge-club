'use client';
import { Eye, EyeOff } from 'lucide-react';
import { ComponentProps, useState } from 'react';

import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type'>;

// Props (incl. id/aria-* from FormControl) go to the <input>, so labels and errors stay linked.
export const PasswordInput = ({ className, ...props }: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-12', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className={cn(
          'absolute inset-y-0 right-1 my-auto flex size-10 items-center justify-center rounded-full',
          'text-muted-foreground transition-colors hover:text-foreground active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
      </button>
    </div>
  );
};

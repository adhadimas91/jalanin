'use client';

import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { Icons } from '@/components/icons';

import { cn } from '@/lib/utils';

  function Checkbox({ className, indeterminate, ...props }: CheckboxPrimitive.Root.Props) {
    return (
      <CheckboxPrimitive.Root
        data-slot='checkbox'
        indeterminate={indeterminate}
        className={cn(
          'peer border-muted-foreground/50 bg-background hover:border-primary/80 dark:bg-input/30 data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary data-checked:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground dark:data-indeterminate:bg-primary data-indeterminate:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border align-middle shadow-xs transition-shadow outline-none focus-visible:ring-[3px] data-disabled:cursor-not-allowed data-disabled:opacity-50',
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          data-slot='checkbox-indicator'
          className='flex items-center justify-center text-current transition-none'
        >
          {indeterminate ? (
            <Icons.minus className='size-3.5' />
          ) : (
            <Icons.check className='size-3.5' />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  }

  export { Checkbox };

'use client';

import type { Table } from '@tanstack/react-table';
import { Icons } from '@/components/icons';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import * as React from 'react';

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  const columns = table
    .getAllColumns()
    .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide());

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label='Toggle columns'
            variant='outline'
            size='sm'
            className='ml-auto flex h-8'
          />
        }
      >
        <Icons.adjustments />
        View
        <Icons.chevronsUpDown className='ml-auto opacity-50' />
      </PopoverTrigger>
      <PopoverContent align='end' className='w-48 p-0'>
        <Command>
          <CommandInput placeholder='Cari kolom...' />
          <CommandList>
            <CommandEmpty>Kolom tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {columns.map((column) => {
                const isVisible = column.getIsVisible();
                const label = column.columnDef.meta?.label ?? column.id;

                return (
                  <CommandItem
                    key={column.id}
                    value={label}
                    onSelect={() => column.toggleVisibility(!isVisible)}
                  >
                    <span className='truncate'>{label}</span>
                    <Icons.check
                      className={cn(
                        'ml-auto size-4 shrink-0',
                        isVisible ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

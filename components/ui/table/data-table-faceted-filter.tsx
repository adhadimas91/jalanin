'use client';

import type { Option } from '@/types/data-table';
import type { Column } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { DataTableFilterClear } from '@/components/ui/table/data-table-filter-clear';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import * as React from 'react';

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: Option[];
  multiple?: boolean;
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  multiple
}: DataTableFacetedFilterProps<TData, TValue>) {
  const [open, setOpen] = React.useState(false);

  const columnFilterValue = column?.getFilterValue();
  const selectedValues = React.useMemo(
    () =>
      new Set(
        Array.isArray(columnFilterValue)
          ? columnFilterValue
          : typeof columnFilterValue === 'string' && columnFilterValue
            ? [columnFilterValue]
            : []
      ),
    [columnFilterValue]
  );

  const onItemSelect = React.useCallback(
    (option: Option, isSelected: boolean) => {
      if (!column) return;

      if (multiple) {
        const newSelectedValues = new Set(selectedValues);
        if (isSelected) {
          newSelectedValues.delete(option.value);
        } else {
          newSelectedValues.add(option.value);
        }
        const filterValues = Array.from(newSelectedValues);
        column.setFilterValue(filterValues.length ? filterValues : undefined);
      } else {
        column.setFilterValue(isSelected ? undefined : [option.value]);
        setOpen(false);
      }
    },
    [column, multiple, selectedValues]
  );

  const onReset = React.useCallback(
    (event?: React.MouseEvent | React.KeyboardEvent) => {
      event?.stopPropagation();
      column?.setFilterValue(undefined);
    },
    [column]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant='outline' size='sm' className='border-dashed' />}>
        {selectedValues?.size > 0 ? (
          <DataTableFilterClear title={title} onReset={onReset} />
        ) : (
          <Icons.plusCircle />
        )}
        {title}
        {selectedValues?.size > 0 && (
          <>
            <Separator orientation='vertical' className='mx-0.5 data-[orientation=vertical]:h-4' />
            <Badge variant='secondary' className='rounded-sm px-1 font-normal lg:hidden'>
              {selectedValues.size}
            </Badge>
            <div className='hidden items-center gap-1 lg:flex'>
              {selectedValues.size > 2 ? (
                <Badge variant='secondary' className='rounded-sm px-1 font-normal'>
                  {selectedValues.size} selected
                </Badge>
              ) : (
                options
                  .filter((option) => selectedValues.has(option.value))
                  .map((option) => (
                    <Badge
                      variant='secondary'
                      key={option.value}
                      className='rounded-sm px-1 font-normal'
                    >
                      {option.label}
                    </Badge>
                  ))
              )}
            </div>
          </>
        )}
      </PopoverTrigger>
        <PopoverContent className='w-[16rem] p-0' align='start'>
          <Command>
            <CommandInput placeholder={`Cari ${title?.toLowerCase() ?? 'filter'}...`} />
            <CommandList className='max-h-full'>
              <CommandEmpty>Tidak ditemukan.</CommandEmpty>
              <CommandGroup className='max-h-[18.75rem] overflow-x-hidden overflow-y-auto'>
                {options.map((option) => {
                  const isSelected = selectedValues.has(option.value);
                  const searchValue = [
                    option.label,
                    option.description ?? '',
                    ...(option.keywords ?? [])
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <CommandItem
                      key={option.value}
                      value={searchValue}
                      onSelect={() => onItemSelect(option, isSelected)}
                    >
                      <div
                        className={cn(
                          'border-primary flex size-4 shrink-0 items-center justify-center rounded-sm border',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <Icons.check className='text-primary-foreground size-3.5' />
                      </div>
                      {option.icon && (
                        <option.icon className='text-muted-foreground size-4 shrink-0' />
                      )}
                      <div className='flex min-w-0 flex-1 flex-col'>
                        <span className='truncate'>{option.label}</span>
                        {option.description && (
                          <span className='text-muted-foreground truncate text-xs'>
                            {option.description}
                          </span>
                        )}
                      </div>
                      {option.count !== undefined && (
                          <span className='text-muted-foreground ml-auto pl-1 font-mono text-xs'>
                            {option.count}
                          </span>
                    )}
                        </CommandItem>
                      );
              })}
                    </CommandGroup>
            {
                    selectedValues.size > 0 && (
                      <>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem onSelect={() => onReset()} className='justify-center text-center'>
                            Reset filter
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )
                  }
          </CommandList>
          </Command>
        </PopoverContent>
    </Popover>
  );
}

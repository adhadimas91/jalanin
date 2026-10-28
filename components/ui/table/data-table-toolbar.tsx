'use client';

import type { Column, Table } from '@tanstack/react-table';
import * as React from 'react';

import { DataTableFacetedFilter } from '@/components/ui/table/data-table-faceted-filter';
import { DataTableViewOptions } from '@/components/ui/table/data-table-view-options';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';

export interface SearchSuggestion {
  label: string;
  value: string;
  sublabel?: string;
  category?: string;
}

interface DataTableToolbarProps<TData> extends React.ComponentProps<'div'> {
  table: Table<TData>;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  searchPlaceholder?: string;
  suggestions?: SearchSuggestion[];
}

export function DataTableToolbar<TData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  searchPlaceholder = 'Search records...',
  suggestions = [],
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const isFiltered =
    table.getState().columnFilters.length > 0 || Boolean(globalFilter && globalFilter.trim());

  const columns = table.getAllColumns().filter((column) => column.getCanFilter());

  const filteredSuggestions = React.useMemo(() => {
    if (!suggestions.length) return [];
    const q = (globalFilter ?? '').toLowerCase().trim();
    if (!q) {
      return suggestions.slice(0, 8);
    }
    return suggestions
      .filter((item) => {
        const hay = `${item.label} ${item.value} ${item.sublabel ?? ''} ${item.category ?? ''}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 8);
  }, [suggestions, globalFilter]);

  React.useEffect(() => {
    setActiveIndex(-1);
  }, [globalFilter]);

  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const onReset = React.useCallback(() => {
    table.resetColumnFilters();
    onGlobalFilterChange?.('');
    setShowSuggestions(false);
  }, [table, onGlobalFilterChange]);

  const handleSelectSuggestion = React.useCallback(
    (item: SearchSuggestion) => {
      onGlobalFilterChange?.(item.value);
      setShowSuggestions(false);
      setActiveIndex(-1);
    },
    [onGlobalFilterChange]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) {
      if (event.key === 'ArrowDown' && filteredSuggestions.length > 0) {
        setShowSuggestions(true);
        setActiveIndex(0);
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredSuggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? filteredSuggestions.length - 1 : prev - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0 && filteredSuggestions[activeIndex]) {
      event.preventDefault();
      handleSelectSuggestion(filteredSuggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div
      role='toolbar'
      aria-orientation='horizontal'
      className={cn('flex w-full flex-wrap items-start justify-between gap-2 p-1', className)}
      {...props}
    >
      <div className='flex flex-1 flex-wrap items-center gap-2'>
        {onGlobalFilterChange !== undefined && (
          <div ref={containerRef} className='relative'>
            <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ''}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onChange={(event) => {
                onGlobalFilterChange(event.target.value);
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              autoComplete='off'
              className={cn('h-8 w-52 pl-8 lg:w-72', globalFilter ? 'pr-7' : '')}
            />
            {globalFilter && (
              <button
                type='button'
                aria-label='Clear search'
                onClick={() => {
                  onGlobalFilterChange('');
                  setShowSuggestions(false);
                }}
                className='text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-xs p-0.5'
              >
                <Icons.close className='size-3.5' />
              </button>
            )}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div
                role='listbox'
                aria-label='Auto suggestions'
                className='bg-popover text-popover-foreground absolute top-full left-0 z-50 mt-1 max-h-72 w-72 overflow-y-auto rounded-md border p-1 shadow-md lg:w-80'
              >
                <div className='text-muted-foreground px-2 py-1 text-[11px] font-medium'>
                  Saran Pencarian ({filteredSuggestions.length})
                </div>
                {filteredSuggestions.map((item, idx) => {
                  const isUser = item.category === 'Nama User';
                  const ItemIcon = isUser ? Icons.user : Icons.search;
                  return (
                    <button
                      key={`${item.category ?? 'item'}-${item.value}-${idx}`}
                      type='button'
                      role='option'
                      aria-selected={idx === activeIndex}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(item);
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
                        idx === activeIndex
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent/60'
                      )}
                    >
                      <ItemIcon className='text-muted-foreground size-3.5 shrink-0' />
                      <div className='flex min-w-0 flex-1 flex-col'>
                        <span className='truncate font-medium'>{item.label}</span>
                        {item.sublabel && (
                          <span className='text-muted-foreground truncate text-xs'>
                            {item.sublabel}
                          </span>
                        )}
                      </div>
                      {item.category && (
                        <Badge
                          variant='outline'
                          className='ml-auto shrink-0 rounded-sm px-1.5 py-0 text-[10px] font-normal'
                        >
                          {item.category}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {columns.map((column) => (
          <DataTableToolbarFilter key={column.id} column={column} />
        ))}
        {isFiltered && (
          <Button
            aria-label='Reset filters'
            variant='outline'
            size='sm'
            className='border-dashed'
            onClick={onReset}
          >
            <Icons.close />
            Reset
          </Button>
        )}
      </div>
      <div className='flex items-center gap-2'>
        {children}
        <DataTableViewOptions table={table} />
      </div>
    </div>
      );
}

      interface DataTableToolbarFilterProps<TData> {
        column: Column<TData>;
}

          function DataTableToolbarFilter<TData>({column}: DataTableToolbarFilterProps<TData>) {
  const columnMeta = column.columnDef.meta;

            if (!columnMeta?.variant) return null;

            switch (columnMeta.variant) {
    case 'text':
            return (
            <Input
              placeholder={columnMeta.placeholder ?? columnMeta.label}
              value={(column.getFilterValue() as string) ?? ''}
              onChange={(event) => column.setFilterValue(event.target.value)}
              className='h-8 w-40 lg:w-56'
            />
            );

            case 'number':
            return (
            <div className='relative'>
              <Input
                type='number'
                inputMode='numeric'
                placeholder={columnMeta.placeholder ?? columnMeta.label}
                value={(column.getFilterValue() as string) ?? ''}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className={cn('h-8 w-[120px]', columnMeta.unit && 'pr-8')}
              />
              {columnMeta.unit && (
                <span className='bg-accent text-muted-foreground absolute top-0 right-0 bottom-0 flex items-center rounded-r-md px-2 text-sm'>
                  {columnMeta.unit}
                </span>
              )}
            </div>
            );

            case 'select':
            case 'multiSelect':
            return (
            <DataTableFacetedFilter
              column={column}
              title={columnMeta.label ?? column.id}
              options={columnMeta.options ?? []}
              multiple={columnMeta.variant === 'multiSelect'}
            />
            );

            default:
            return null;
  }
}


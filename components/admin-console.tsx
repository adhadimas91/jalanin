'use client';

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { AdminSnapshot, AdminTable } from '@/lib/admin';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  type Column,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState
} from '@tanstack/react-table';
import { DEFAULT_ACTIVITY_TYPE } from '@/lib/activity-types';
import { toast } from 'sonner';

import { Icons, type Icon as IconType } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { ThemeSelector } from '@/components/themes/theme-selector';
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle';
import { AlertModal } from '@/components/modal/alert-modal';
import { Modal } from '@/components/ui/modal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Option } from '@/types/data-table';

type Props = {
  initialData: AdminSnapshot;
  adminEmail: string;
};

type TableConfig = {
  label: string;
  description: string;
  group: 'Manajemen Pengguna' | 'Konten & Perjalanan' | 'Konfigurasi Sistem';
  icon: IconType;
  columns: string[];
  template: Record<string, unknown>;
};

const tableConfigs: Record<AdminTable, TableConfig> = {
  users: {
    label: 'Users',
    description: 'Kelola akun, profil, password hash, langganan PRO, dan role admin.',
    group: 'Manajemen Pengguna',
    icon: Icons.teams,
    columns: [
      'name',
      'username',
      'email',
      'role',
      'isPro',
      'isClaimed',
      'city',
      'instagram',
      'tiktok',
      'youtube',
      'createdAt'
    ],
    template: {
      email: 'new-user@example.com',
      username: 'newuser',
      passwordHash: '',
      name: 'New User',
      avatarUrl: '',
      bio: '',
      city: 'Jakarta',
      youtube: '',
      instagram: '',
      tiktok: '',
      role: 'USER',
      isPro: false,
      proExpiresAt: null,
      isClaimed: true,
      maxPrivate: 2,
      maxPublic: 5,
      maxSaved: 5,
      maxMyLink: 50
    }
  },
  accountClaims: {
    label: 'Klaim Akun',
    description: 'Kelola permohonan klaim profil kreator/influencer dan kirim link setup password.',
    group: 'Manajemen Pengguna',
    icon: Icons.userCheck,
    columns: [
      'userId',
      'claimantName',
      'claimantEmail',
      'socialHandle',
      'status',
      'proofNotes',
      'adminNotes',
      'token',
      'tokenExpiresAt',
      'createdAt'
    ],
    template: {
      userId: '',
      claimantName: '',
      claimantEmail: '',
      socialHandle: '@',
      proofNotes: '',
      status: 'PENDING',
      adminNotes: '',
      token: null,
      tokenExpiresAt: null
    }
  },
  sessions: {
    label: 'Sessions',
    description: 'Kelola session aktif pengguna, token hash, dan masa berlakunya.',
    group: 'Manajemen Pengguna',
    icon: Icons.key,
    columns: ['userId', 'token', 'expiresAt', 'createdAt'],
    template: {
      userId: '',
      token: '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    }
  },
  itineraries: {
    label: 'Itineraries',
    description: 'Kelola record utama perjalanan beserta author, budget, dan status publish.',
    group: 'Konten & Perjalanan',
    icon: Icons.route,
    columns: [
      'title',
      'destination',
      'authorId',
      'travelStyle',
      'estimatedBudget',
      'isPublished'
    ],
    template: {
      title: 'Trip Baru',
      destination: 'Bandung',
      description: '',
      durationDays: 3,
      estimatedBudget: 1500000,
      travelStyle: 'Budget trip',
      coverImageUrl: '/uploads/default-cover.svg',
      notes: '',
      isPublished: true,
      originalItineraryId: null,
      authorId: ''
    }
  },
  days: {
    label: 'Itinerary Days',
    description: 'Atur hari per itinerary dengan nomor hari dan judulnya.',
    group: 'Konten & Perjalanan',
    icon: Icons.calendar,
    columns: ['title', 'dayNumber', 'itineraryId'],
    template: {
      itineraryId: '',
      dayNumber: 1,
      title: 'Hari 1 - Kota Tujuan'
    }
  },
  activities: {
    label: 'Activities',
    description: 'Kelola aktivitas, urutan, kategori, dan biaya di tiap hari itinerary.',
    group: 'Konten & Perjalanan',
    icon: Icons.mapPin,
    columns: [
      'title',
      'time',
      'locationName',
      'category',
      'estimatedCost',
      'itineraryDayId',
      'latitude',
      'longitude',
      'orderIndex'
    ],
    template: {
      itineraryDayId: '',
      time: '09.00',
      title: 'Aktivitas baru',
      locationName: '',
      formattedAddress: '',
      latitude: null,
      longitude: null,
      mapProvider: '',
      mapPlaceId: '',
      customLocation: false,
      description: '',
      estimatedCost: 0,
      category: DEFAULT_ACTIVITY_TYPE,
      orderIndex: 0
    }
  },
  saves: {
    label: 'Saved Itineraries',
    description: 'Kelola hubungan user yang menyimpan itinerary.',
    group: 'Konten & Perjalanan',
    icon: Icons.bookmark,
    columns: ['userId', 'itineraryId', 'createdAt'],
    template: {
      userId: '',
      itineraryId: '',
      createdAt: new Date().toISOString()
    }
  },
  likes: {
    label: 'Likes',
    description: 'Kelola hubungan like antara user dan itinerary.',
    group: 'Konten & Perjalanan',
    icon: Icons.heart,
    columns: ['userId', 'itineraryId', 'createdAt'],
    template: {
      userId: '',
      itineraryId: '',
      createdAt: new Date().toISOString()
    }
  },
  myLinkWhitelistDomains: {
    label: 'Whitelist Domains MyLink',
    description: 'Kelola domain partner resmi yang diizinkan sistem (misal *.klook.com, wa.me).',
    group: 'Konfigurasi Sistem',
    icon: Icons.world,
    columns: ['domainPattern', 'isActive', 'description', 'createdAt'],
    template: {
      domainPattern: '*.klook.com',
      isActive: true,
      description: 'Klook Partner Link'
    }
  },
  appSettings: {
    label: 'App Settings',
    description: 'Kelola konfigurasi aplikasi (seperti nomor WhatsApp, harga plan, email whitelist).',
    group: 'Konfigurasi Sistem',
    icon: Icons.settings,
    columns: ['key', 'value'],
    template: {
      key: 'whatsapp_number',
      value: '088293681133'
    }
  }
};

const SIDEBAR_GROUPS: {
  label: TableConfig['group'];
  tables: AdminTable[];
}[] = [
    {
      label: 'Manajemen Pengguna',
      tables: ['users', 'accountClaims', 'sessions']
    },
    {
      label: 'Konten & Perjalanan',
      tables: ['itineraries', 'days', 'activities', 'saves', 'likes']
    },
    {
      label: 'Konfigurasi Sistem',
      tables: ['myLinkWhitelistDomains', 'appSettings']
    }
  ];

const ROLE_FILTER_OPTIONS: Option[] = [
  { label: 'USER', value: 'USER' },
  { label: 'ADMIN', value: 'ADMIN' }
];

const PLAN_FILTER_OPTIONS: Option[] = [
  { label: 'PRO Plan', value: 'PRO' },
  { label: 'FREE Plan', value: 'FREE' }
];

const CLAIM_USER_FILTER_OPTIONS: Option[] = [
  { label: 'Sudah Diklaim (Aktif)', value: 'CLAIMED' },
  { label: 'Belum Diklaim (Kurasi)', value: 'UNCLAIMED' }
];

const CLAIM_STATUS_FILTER_OPTIONS: Option[] = [
  { label: 'Menunggu Review', value: 'PENDING' },
  { label: 'Disetujui', value: 'APPROVED' },
  { label: 'Ditolak', value: 'REJECTED' }
];

const PUBLISH_FILTER_OPTIONS: Option[] = [
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Draft', value: 'DRAFT' }
];

const ACTIVE_DOMAIN_FILTER_OPTIONS: Option[] = [
  { label: 'Aktif', value: 'ACTIVE' },
  { label: 'Nonaktif', value: 'INACTIVE' }
];

const ACTIVITY_CATEGORY_OPTIONS: Option[] = [
  { label: 'Wisata', value: 'attraction' },
  { label: 'Kuliner', value: 'food' },
  { label: 'Penginapan', value: 'hotel' },
  { label: 'Transportasi', value: 'transport' },
  { label: 'Belanja', value: 'shopping' },
  { label: 'Lainnya', value: 'other' }
];

const SUBSCRIPTION_PLAN_OPTIONS = [
  { value: 'free', label: 'Plan: FREE' },
  { value: 'pro_1m', label: 'PRO (1 Bulan)' },
  { value: 'pro_3m', label: 'PRO (3 Bulan)' },
  { value: 'pro_6m', label: 'PRO (6 Bulan)' },
  { value: 'pro_1y', label: 'PRO (1 Tahun)' },
  { value: 'pro_indefinite', label: 'PRO (Seterusnya)' }
];

const DEFAULT_HIDDEN_COLUMNS: Record<AdminTable, VisibilityState> = {
  users: {
    id: false,
    email: false,
    city: false,
    instagram: false,
    tiktok: false,
    youtube: false,
    createdAt: false
  },
  accountClaims: {
    id: false,
    userId: false,
    claimantEmail: false,
    adminNotes: false,
    token: false,
    tokenExpiresAt: false
  },
  sessions: {
    id: false
  },
  itineraries: {
    id: false,
    authorId: false
  },
  days: {
    id: false
  },
  activities: {
    id: false,
    itineraryDayId: false,
    latitude: false,
    longitude: false,
    orderIndex: false
  },
  saves: {
    id: false
  },
  likes: {
    id: false
  },
  myLinkWhitelistDomains: {
    id: false
  },
  appSettings: {
    id: false
  }
};

function formatShortDate(value: unknown) {
  if (!value) return '—';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function stripMeta(record: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(record).filter(([key]) => !key.startsWith('_')));
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatLabel(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
}

function getSubscriptionOption(expiryDateStr: string | null | undefined, isPro: boolean) {
  if (!isPro) return 'free';
  if (!expiryDateStr) return 'pro_indefinite';

  const expiry = new Date(expiryDateStr);
  const diffTime = expiry.getTime() - Date.now();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'free';
  if (diffDays <= 32) return 'pro_1m';
  if (diffDays <= 93) return 'pro_3m';
  if (diffDays <= 185) return 'pro_6m';
  if (diffDays <= 367) return 'pro_1y';
  return 'pro_indefinite';
}

export function AdminConsole({ initialData, adminEmail }: Props) {
  const [tables, setTables] = useState(initialData);
  const [activeView, setActiveView] = useState<'overview' | AdminTable>('users');
  const [currentTable, setCurrentTable] = useState<AdminTable>('users');
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(JSON.stringify(tableConfigs.users.template, null, 2));
  const [busy, setBusy] = useState(false);
  const [editorTab, setEditorTab] = useState<'form' | 'json'>('form');
  const [sheetOpen, setSheetOpen] = useState(false);

  // Modal states
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [approveClaimId, setApproveClaimId] = useState<string | null>(null);
  const [approvedSetupUrl, setApprovedSetupUrl] = useState<string | null>(null);
  const [rejectClaimId, setRejectClaimId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [impersonateUserId, setImpersonateUserId] = useState<string | null>(null);

  // Datatable States (TanStack Table controlled states)
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    DEFAULT_HIDDEN_COLUMNS.users
  );
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  });

  const config = tableConfigs[currentTable];
  const records = tables[currentTable];

  const resetDraft = useCallback((table: AdminTable) => {
    setEditorMode('create');
    setEditingId(null);
    setDraft(JSON.stringify(tableConfigs[table].template, null, 2));
    setEditorTab('form');
  }, []);

  const selectTable = useCallback(
    (tableId: AdminTable) => {
      setActiveView(tableId);
      setCurrentTable(tableId);
      resetDraft(tableId);
      setGlobalFilter('');
      setSorting([]);
      setColumnFilters([]);
      setColumnVisibility(DEFAULT_HIDDEN_COLUMNS[tableId]);
      setPagination({ pageIndex: 0, pageSize: 10 });
    },
    [resetDraft]
  );

  const openCreateSheet = useCallback(() => {
    resetDraft(currentTable);
    setSheetOpen(true);
  }, [currentTable, resetDraft]);

  const openEditSheet = useCallback((id: string, record: Record<string, unknown>) => {
    setEditorMode('edit');
    setEditingId(id);
    setDraft(JSON.stringify(stripMeta(record), null, 2));
    setEditorTab('form');
    setSheetOpen(true);
  }, []);

  function updateDraftField(key: string, value: unknown) {
    try {
      const parsed = JSON.parse(draft) as Record<string, unknown>;
      parsed[key] = value;
      setDraft(JSON.stringify(parsed, null, 2));
    } catch {
      // ignore invalid JSON while editing
    }
  }

  const refreshTable = useCallback(async (table: AdminTable) => {
    const response = await fetch(`/api/admin/${table}`);
    if (!response.ok) {
      throw new Error(await response.text());
    }

    const payload = (await response.json()) as { records: Record<string, unknown>[] };
    setTables((previous) => ({
      ...previous,
      [table]: payload.records
    }));
  }, []);

  async function handleSave() {
    setBusy(true);

    try {
      const parsed = JSON.parse(draft) as Record<string, unknown>;
      const targetUrl =
        editorMode === 'create'
          ? `/api/admin/${currentTable}`
          : `/api/admin/${currentTable}/${editingId}`;
      const method = editorMode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(targetUrl, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: parsed })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await refreshTable(currentTable);
      resetDraft(currentTable);
      setSheetOpen(false);
      toast.success(
        editorMode === 'create' ? 'Record berhasil dibuat.' : 'Record berhasil diperbarui.'
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan record.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTargetId) return;
    setBusy(true);

    try {
      const response = await fetch(`/api/admin/${currentTable}/${deleteTargetId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await refreshTable(currentTable);
      if (editingId === deleteTargetId) {
        resetDraft(currentTable);
      }
      setDeleteTargetId(null);
      toast.success('Record berhasil dihapus.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus record.');
    } finally {
      setBusy(false);
    }
  }

  const handleSubscriptionChange = useCallback(
    async (id: string, record: Record<string, unknown>, value: string) => {
      setBusy(true);
      try {
        let isPro = false;
        let proExpiresAt: string | null = null;
        let limits = {
          maxPrivate: 2,
          maxPublic: 5,
          maxSaved: 5,
          maxMyLink: 50
        };

        if (value !== 'free') {
          isPro = true;
          limits = {
            maxPrivate: 100,
            maxPublic: 100,
            maxSaved: 100,
            maxMyLink: 100
          };

          const now = new Date();
          if (value === 'pro_1m') {
            now.setMonth(now.getMonth() + 1);
            proExpiresAt = now.toISOString();
          } else if (value === 'pro_3m') {
            now.setMonth(now.getMonth() + 3);
            proExpiresAt = now.toISOString();
          } else if (value === 'pro_6m') {
            now.setMonth(now.getMonth() + 6);
            proExpiresAt = now.toISOString();
          } else if (value === 'pro_1y') {
            now.setFullYear(now.getFullYear() + 1);
            proExpiresAt = now.toISOString();
          }
        }

        const updatedData = {
          ...stripMeta(record),
          isPro,
          proExpiresAt,
          ...limits
        };

        const response = await fetch(`/api/admin/users/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ data: updatedData })
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        await refreshTable('users');
        toast.success('Langganan pengguna berhasil diperbarui.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Gagal memperbarui langganan.');
      } finally {
        setBusy(false);
      }
    },
    [refreshTable]
  );

  async function confirmApproveClaim() {
    if (!approveClaimId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/claims/${approveClaimId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyetujui klaim');
      }
      await refreshTable('accountClaims');
      await refreshTable('users');
      setApproveClaimId(null);
      toast.success('Klaim akun berhasil disetujui!');
      if (data.setupUrl) {
        navigator.clipboard.writeText(data.setupUrl).catch(() => { });
        setApprovedSetupUrl(data.setupUrl);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses klaim.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmRejectClaim() {
    if (!rejectClaimId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/claims/${rejectClaimId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', adminNotes: rejectReason })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menolak klaim');
      }
      await refreshTable('accountClaims');
      setRejectClaimId(null);
      setRejectReason('');
      toast.success('Klaim akun telah ditolak.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses penolakan klaim.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmImpersonate() {
    if (!impersonateUserId) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: impersonateUserId })
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Gagal masuk sebagai akun kurasi.');
      }
      const data = await res.json();
      window.location.href = data.redirectUrl || '/create';
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal masuk sebagai akun kurasi.');
      setBusy(false);
      setImpersonateUserId(null);
    }
  }

  // Overview KPI statistics
  const kpiStats = useMemo(() => {
    const proUsersCount = tables.users.filter((u) => Boolean(u.isPro)).length;
    const unclaimedUsersCount = tables.users.filter((u) => !u.isClaimed).length;
    const pendingClaimsCount = tables.accountClaims.filter(
      (c) => String(c.status).toUpperCase() === 'PENDING'
    ).length;
    const publishedItinerariesCount = tables.itineraries.filter((i) =>
      Boolean(i.isPublished)
    ).length;

    return {
      proUsersCount,
      unclaimedUsersCount,
      pendingClaimsCount,
      publishedItinerariesCount
    };
  }, [tables]);

  // Dynamic Column Definitions for TanStack Table (next-shadcn users-table pattern)
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const dataCols: ColumnDef<Record<string, unknown>>[] = [
      {
        id: 'id',
        accessorFn: (row) => String(row.id ?? row.key ?? ''),
        header: ({ column }: { column: Column<Record<string, unknown>, unknown> }) => (
          <DataTableColumnHeader column={column} title='ID' />
        ),
        cell: (info) => (
          <span className='text-muted-foreground font-mono text-xs'>
            {String(info.getValue() ?? '')}
          </span>
        )
      },
      ...config.columns.map((colName): ColumnDef<Record<string, unknown>> => {
        const isFilterable =
          (currentTable === 'users' &&
            (colName === 'role' || colName === 'isPro' || colName === 'isClaimed')) ||
          (currentTable === 'accountClaims' && colName === 'status') ||
          (currentTable === 'itineraries' && colName === 'isPublished') ||
          (currentTable === 'myLinkWhitelistDomains' && colName === 'isActive') ||
          (currentTable === 'activities' && colName === 'category');

        let filterOptions: Option[] | undefined;
        if (currentTable === 'users' && colName === 'role') filterOptions = ROLE_FILTER_OPTIONS;
        if (currentTable === 'users' && colName === 'isPro') filterOptions = PLAN_FILTER_OPTIONS;
        if (currentTable === 'users' && colName === 'isClaimed')
          filterOptions = CLAIM_USER_FILTER_OPTIONS;
        if (currentTable === 'accountClaims' && colName === 'status')
          filterOptions = CLAIM_STATUS_FILTER_OPTIONS;
        if (currentTable === 'itineraries' && colName === 'isPublished')
          filterOptions = PUBLISH_FILTER_OPTIONS;
        if (currentTable === 'myLinkWhitelistDomains' && colName === 'isActive')
          filterOptions = ACTIVE_DOMAIN_FILTER_OPTIONS;
        if (currentTable === 'activities' && colName === 'category')
          filterOptions = ACTIVITY_CATEGORY_OPTIONS;

        return {
          id: colName,
          accessorKey: colName,
          enableColumnFilter: isFilterable,
          meta: {
            label: formatLabel(colName),
            ...(filterOptions
              ? {
                variant: 'multiSelect' as const,
                options: filterOptions
              }
              : {})
          },
          header: ({ column }: { column: Column<Record<string, unknown>, unknown> }) => (
            <DataTableColumnHeader column={column} title={formatLabel(colName)} />
          ),
          filterFn: isFilterable
            ? (row, columnId, filterValue: string | string[] | undefined) => {
              const values = Array.isArray(filterValue)
                ? filterValue
                : filterValue
                  ? [filterValue]
                  : [];
              if (values.length === 0) return true;

              const raw = row.getValue(columnId);
              let normalized = String(raw ?? '');

              if (columnId === 'isPro') {
                normalized = raw ? 'PRO' : 'FREE';
              } else if (columnId === 'isClaimed') {
                normalized = raw ? 'CLAIMED' : 'UNCLAIMED';
              } else if (columnId === 'isPublished') {
                normalized = raw ? 'PUBLISHED' : 'DRAFT';
              } else if (columnId === 'isActive') {
                normalized = raw ? 'ACTIVE' : 'INACTIVE';
              }

              return values.some((v) => v.toUpperCase() === normalized.toUpperCase());
            }
            : undefined,
          cell: (info) => {
            const val = info.getValue();
            const record = info.row.original;
            const rel =
              record._related && typeof record._related === 'object'
                ? (record._related as Record<string, unknown>)
                : undefined;

            // Stacked Name + Email cell (matching next-shadcn users-table/columns.tsx)
            if (colName === 'name' && currentTable === 'users') {
              return (
                <div className='flex flex-col'>
                  <span className='font-medium'>{formatCell(val)}</span>
                  <span className='text-muted-foreground text-xs'>
                    {formatCell(record.email)}
                  </span>
                </div>
              );
            }

            if (colName === 'username' && currentTable === 'users') {
              const handle = val ? `@${String(val).replace(/^@/, '')}` : '—';
              const city = record.city ? String(record.city) : null;
              return (
                <div className='flex flex-col'>
                  <span>{handle}</span>
                  {city && <span className='text-muted-foreground text-xs'>{city}</span>}
                </div>
              );
            }

            if (colName === 'claimantName' && currentTable === 'accountClaims') {
              return (
                <div className='flex flex-col'>
                  <span className='font-medium'>{formatCell(val)}</span>
                  <span className='text-muted-foreground text-xs'>
                    {formatCell(record.claimantEmail)}
                  </span>
                </div>
              );
            }

            if (colName === 'title' && currentTable === 'itineraries') {
              const author = rel?.author as Record<string, unknown> | undefined;
              const authorSub = author?.username
                ? `@${String(author.username)}`
                : author?.email
                  ? String(author.email)
                  : null;
              return (
                <div className='flex flex-col'>
                  <span className='max-w-[220px] truncate font-medium'>{formatCell(val)}</span>
                  {authorSub && (
                    <span className='text-muted-foreground text-xs'>{authorSub}</span>
                  )}
                </div>
              );
            }

            if (colName === 'userId' && rel?.user && typeof rel.user === 'object') {
              const u = rel.user as Record<string, unknown>;
              return (
                <div className='flex flex-col'>
                  <span className='max-w-[200px] truncate font-medium'>
                    {String(u.email ?? val ?? '—')}
                  </span>
                  <span className='text-muted-foreground font-mono text-[11px]'>
                    {String(val ?? '').slice(0, 10)}
                  </span>
                </div>
              );
            }

            if (colName === 'itineraryId' && rel?.itinerary && typeof rel.itinerary === 'object') {
              const it = rel.itinerary as Record<string, unknown>;
              return (
                <div className='flex flex-col'>
                  <span className='max-w-[200px] truncate font-medium'>
                    {String(it.title ?? val ?? '—')}
                  </span>
                  <span className='text-muted-foreground font-mono text-[11px]'>
                    {String(val ?? '').slice(0, 10)}
                  </span>
                </div>
              );
            }

            if (colName === 'status' && currentTable === 'accountClaims') {
              const statusStr = String(val).toUpperCase();
              if (statusStr === 'APPROVED') {
                return (
                  <Badge variant='default' className='bg-emerald-600 text-white hover:bg-emerald-600'>
                    <Icons.circleCheck className='size-3' />
                    Disetujui
                  </Badge>
                );
              }
              if (statusStr === 'REJECTED') {
                return (
                  <Badge variant='destructive'>
                    <Icons.circleX className='size-3' />
                    Ditolak
                  </Badge>
                );
              }
              return (
                <Badge variant='secondary' className='border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300'>
                  <Icons.clock className='size-3' />
                  Menunggu Review
                </Badge>
              );
            }

            if (colName === 'role' && currentTable === 'users') {
              const roleStr = String(val ?? 'USER').toUpperCase();
              return (
                <Badge variant={roleStr === 'ADMIN' ? 'default' : 'outline'}>
                  {roleStr === 'ADMIN' && <Icons.shieldCheck className='size-3' />}
                  {roleStr}
                </Badge>
              );
            }

            if (colName === 'isPro' && currentTable === 'users') {
              const isPro = Boolean(val);
              return isPro ? (
                <Badge variant='default' className='gap-1'>
                  <Icons.pro className='size-3' />
                  PRO
                </Badge>
              ) : (
                <Badge variant='outline'>FREE</Badge>
              );
            }

            if (colName === 'isClaimed' && currentTable === 'users') {
              const isClaimed = Boolean(val);
              return isClaimed ? (
                <Badge variant='secondary'>
                  <Icons.circleCheck className='size-3' />
                  Aktif
                </Badge>
              ) : (
                <Badge
                  variant='outline'
                  className='border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                >
                  Kurasi (Unclaimed)
                </Badge>
              );
            }

            if (
              (colName === 'isPublished' && currentTable === 'itineraries') ||
              (colName === 'isActive' && currentTable === 'myLinkWhitelistDomains')
            ) {
              const active = Boolean(val);
              return (
                <Badge variant={active ? 'default' : 'secondary'}>
                  {active ? 'Aktif' : 'Nonaktif'}
                </Badge>
              );
            }

            if (colName === 'token' && val) {
              return (
                <code className='bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-xs'>
                  {String(val).slice(0, 10)}...
                </code>
              );
            }

            if (colName === 'estimatedBudget' || colName === 'estimatedCost') {
              const num = Number(val);
              if (Number.isFinite(num)) {
                return <span className='tabular-nums'>Rp {num.toLocaleString('id-ID')}</span>;
              }
            }

            if (colName.endsWith('At')) {
              return (
                <span className='text-muted-foreground text-xs tabular-nums'>
                  {formatShortDate(val)}
                </span>
              );
            }

            return <span className='block max-w-[220px] truncate'>{formatCell(val)}</span>;
          }
        };
      }),
    {
      id: 'actions',
      size: 48,
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const record = row.original;
        const id = String(record.id ?? record.key ?? '');
        const currentSubOption =
          currentTable === 'users'
            ? getSubscriptionOption(
              record.proExpiresAt as string | null | undefined,
              Boolean(record.isPro)
            )
            : 'free';

        return (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              render={<Button variant='ghost' className='h-8 w-8 p-0' />}
            >
              <span className='sr-only'>Open menu</span>
              <Icons.ellipsis className='h-4 w-4' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-52'>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuItem onClick={() => openEditSheet(id, record)}>
                <Icons.edit className='mr-2 h-4 w-4' />
                Update
              </DropdownMenuItem>
              {currentTable === 'users' && !record.isClaimed && (
                <DropdownMenuItem onClick={() => setImpersonateUserId(id)}>
                  <Icons.login className='mr-2 h-4 w-4' />
                  Impersonate (Buat Trip)
                </DropdownMenuItem>
              )}
              {currentTable === 'users' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Ubah Langganan</DropdownMenuLabel>
                    {SUBSCRIPTION_PLAN_OPTIONS.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        disabled={busy || opt.value === currentSubOption}
                        onClick={() => void handleSubscriptionChange(id, record, opt.value)}
                      >
                        <Icons.check
                          className={cn(
                            'mr-2 h-4 w-4',
                            opt.value === currentSubOption ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </>
              )}
              {currentTable === 'accountClaims' &&
                String(record.status).toUpperCase() === 'PENDING' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setApproveClaimId(id)}>
                      <Icons.check className='mr-2 h-4 w-4' />
                      Approve Klaim
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant='destructive'
                      onClick={() => {
                        setRejectClaimId(id);
                        setRejectReason('');
                      }}
                    >
                      <Icons.close className='mr-2 h-4 w-4' />
                      Reject Klaim
                    </DropdownMenuItem>
                  </>
                )}
              {currentTable === 'accountClaims' && Boolean(record.token) && (
                <DropdownMenuItem
                  onClick={() => {
                    const url = `${window.location.origin}/setup-password?token=${record.token}`;
                    navigator.clipboard.writeText(url).catch(() => { });
                    toast.success('Tautan setup password berhasil disalin!');
                  }}
                >
                  <Icons.copy className='mr-2 h-4 w-4' />
                  Salin Link Setup
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant='destructive'
                onClick={() => setDeleteTargetId(id)}
              >
                <Icons.trash className='mr-2 h-4 w-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
}
    ];

return dataCols;
  }, [currentTable, config.columns, busy, handleSubscriptionChange, openEditSheet]);

const table = useReactTable({
  data: records,
  columns,
  state: {
    sorting,
    columnFilters,
    columnVisibility,
    globalFilter,
    pagination,
      columnPinning: { right: ['actions'] }
  },
  onSortingChange: setSorting,
  onColumnFiltersChange: (updater) => {
    setColumnFilters(updater);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  },
  onColumnVisibilityChange: setColumnVisibility,
  onGlobalFilterChange: (val) => {
    setGlobalFilter(val);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  },
  onPaginationChange: setPagination,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
  globalFilterFn: (row, _columnId, filterValue) => {
    const q = String(filterValue).toLowerCase().trim();
    if (!q) return true;

    const record = row.original;

    const baseMatch = Object.entries(record).some(([key, val]) => {
      if (key.startsWith('_')) return false;
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(q);
    });

    if (baseMatch) return true;

    if (record._related && typeof record._related === 'object') {
      const rel = record._related as Record<string, unknown>;

      const userEmail =
        (rel.user as Record<string, unknown>)?.email ||
        (rel.author as Record<string, unknown>)?.email;
      if (userEmail && String(userEmail).toLowerCase().includes(q)) return true;

      const username =
        (rel.user as Record<string, unknown>)?.username ||
        (rel.author as Record<string, unknown>)?.username;
      if (username && String(username).toLowerCase().includes(q)) return true;

      const itineraryTitle = (rel.itinerary as Record<string, unknown>)?.title;
      if (itineraryTitle && String(itineraryTitle).toLowerCase().includes(q)) return true;

      const dayTitle = (rel.day as Record<string, unknown>)?.title;
      if (dayTitle && String(dayTitle).toLowerCase().includes(q)) return true;
    }

    return false;
  }
});

function handleExportCSV() {
  const exportRows = table.getFilteredRowModel().rows;
  const headers = ['id', ...config.columns];
  const csvRows = [headers.join(',')];

  exportRows.forEach((row) => {
    const record = row.original;
    const rowValues = headers.map((col) => {
      const val = col === 'id' ? (record.id ?? record.key ?? '') : record[col];
      if (val === null || val === undefined) {
        return '';
      }
      let valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
      valStr = valStr.replace(/"/g, '""');
      if (
        valStr.includes(',') ||
        valStr.includes('"') ||
        valStr.includes('\n') ||
        valStr.includes('\r')
      ) {
        valStr = `"${valStr}"`;
      }
      return valStr;
    });
    csvRows.push(rowValues.join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `${currentTable}_export_${new Date().toISOString().slice(0, 10)}.csv`
  );
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success(`Data ${config.label} berhasil diekspor ke CSV.`);
}

const adminInitials = adminEmail.slice(0, 2).toUpperCase();

return (
  <SidebarProvider defaultOpen>
    {/* Left Navigation Sidebar (next-shadcn AppSidebar pattern) */}
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' onClick={() => selectTable('users')}>
              <div className='bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                <Icons.logo className='size-4' />
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>Jalanin Admin</span>
                <span className='text-muted-foreground truncate text-xs'>Backoffice Console</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup className='py-0'>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip='Dashboard'
                isActive={activeView === 'overview'}
                onClick={() => setActiveView('overview')}
              >
                <Icons.dashboard />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {SIDEBAR_GROUPS.map((group) => (
            <SidebarGroup key={group.label} className='py-0'>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {group.tables.map((tableId) => {
                  const itemConfig = tableConfigs[tableId];
                  const ItemIcon = itemConfig.icon;
                  const count = tables[tableId].length;
                  const isActive = activeView === tableId;

                  return (
                    <SidebarMenuItem key={tableId}>
                      <SidebarMenuButton
                        tooltip={itemConfig.label}
                        isActive={isActive}
                        onClick={() => selectTable(tableId)}
                      >
                        <ItemIcon />
                        <span>{itemConfig.label}</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge>{count}</SidebarMenuBadge>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size='lg'
                      className='data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground'
                    />
                  }
                >
                  <Avatar className='h-8 w-8 rounded-lg'>
                    <AvatarFallback className='rounded-lg text-xs font-semibold'>
                      {adminInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>Administrator</span>
                    <span className='text-muted-foreground truncate text-xs'>{adminEmail}</span>
                  </div>
                  <Icons.chevronsDown className='ml-auto size-4' />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className='w-(--anchor-width) min-w-56 rounded-lg'
                  side='bottom'
                  align='end'
                  sideOffset={4}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className='p-0 font-normal'>
                      <div className='flex items-center gap-2 px-2 py-1.5 text-left text-sm'>
                        <Avatar className='h-8 w-8 rounded-lg'>
                          <AvatarFallback className='rounded-lg text-xs font-semibold'>
                            {adminInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className='grid flex-1 text-left text-sm leading-tight'>
                          <span className='truncate font-semibold'>Administrator</span>
                          <span className='text-muted-foreground truncate text-xs'>
                            {adminEmail}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem render={<Link href='/' />}>
                      <Icons.home className='mr-2 size-4' />
                      Kembali ke Aplikasi
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <form action='/api/auth/logout' method='post'>
                    <DropdownMenuItem
                      variant='destructive'
                      render={<button type='submit' className='w-full text-left' />}
                    >
                      <Icons.logout className='mr-2 size-4' />
                      Logout
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

    {/* Main Content Area (next-shadcn SidebarInset + Header + PageContainer) */}
    <SidebarInset>
        <header className='bg-background/60 sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 backdrop-blur-md md:h-14'>
          <div className='flex items-center gap-2 px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbLink
                    render={<button type='button' onClick={() => setActiveView('overview')} />}
                  >
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className='hidden md:block'>
                  <Icons.slash />
                </BreadcrumbSeparator>
                {activeView === 'overview' ? (
                  <BreadcrumbItem>
                    <BreadcrumbPage>Overview</BreadcrumbPage>
                  </BreadcrumbItem>
                ) : (
                  <>
                    <BreadcrumbItem className='hidden lg:block'>
                      <span className='text-muted-foreground'>{config.group}</span>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className='hidden lg:block'>
                      <Icons.slash />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                      <BreadcrumbPage>{config.label}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className='flex items-center gap-2 px-4'>
            <Button
              variant='outline'
              size='sm'
              isLoading={busy}
              onClick={() =>
                refreshTable(currentTable)
                  .then(() => toast.success(`Tabel ${config.label} berhasil diperbarui.`))
                  .catch((err) =>
                    toast.error(err instanceof Error ? err.message : 'Gagal memuat ulang tabel.')
                  )
              }
            >
              <Icons.refresh className='size-4' />
              <span className='hidden sm:inline'>Refresh</span>
            </Button>
            <Button variant='outline' size='sm' nativeButton={false} render={<Link href='/' />}>
              <Icons.externalLink className='size-4' />
              <span className='hidden sm:inline'>Ke Aplikasi</span>
            </Button>
            <ThemeModeToggle />
            <div className='hidden sm:block'>
              <ThemeSelector />
            </div>
          </div>
        </header>

              {activeView === 'overview' ? (
                <PageContainer
                  pageTitle='Overview'
                  pageDescription='Ringkasan statistik dan akses cepat ke seluruh tabel database Jalanin.'
                >
                  <div className='flex flex-1 flex-col space-y-6'>
                    {/* KPI Overview Cards (next-shadcn overview pattern) */}
                    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-4'>
                      <Card
                        className='@container/card cursor-pointer transition-all hover:shadow-md'
                        onClick={() => selectTable('users')}
                      >
                        <CardHeader>
                          <CardDescription>Total Users</CardDescription>
                          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                            {tables.users.length}
                          </CardTitle>
                          <CardAction>
                            <Badge variant='outline'>
                              <Icons.pro className='size-3' />
                              {kpiStats.proUsersCount} PRO
                            </Badge>
                          </CardAction>
                        </CardHeader>
                        <CardFooter className='flex-col items-start gap-1 text-xs'>
                          <div className='flex items-center gap-1.5 font-medium'>
                            {kpiStats.unclaimedUsersCount} akun kurasi (unclaimed)
                          </div>
                          <div className='text-muted-foreground'>Klik untuk kelola pengguna</div>
                        </CardFooter>
                      </Card>

                      <Card
                        className='@container/card cursor-pointer transition-all hover:shadow-md'
                        onClick={() => selectTable('accountClaims')}
                      >
                        <CardHeader>
                          <CardDescription>Klaim Akun</CardDescription>
                          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                            {tables.accountClaims.length}
                          </CardTitle>
                          <CardAction>
                            <Badge variant={kpiStats.pendingClaimsCount > 0 ? 'default' : 'outline'}>
                              <Icons.clock className='size-3' />
                              {kpiStats.pendingClaimsCount} Pending
                            </Badge>
                          </CardAction>
                        </CardHeader>
                        <CardFooter className='flex-col items-start gap-1 text-xs'>
                          <div className='flex items-center gap-1.5 font-medium'>
                            Verifikasi kreator & influencer
                          </div>
                          <div className='text-muted-foreground'>Approve & kirim link setup password</div>
                        </CardFooter>
                      </Card>

                      <Card
                        className='@container/card cursor-pointer transition-all hover:shadow-md'
                        onClick={() => selectTable('itineraries')}
                      >
                        <CardHeader>
                          <CardDescription>Itineraries</CardDescription>
                          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                            {tables.itineraries.length}
                          </CardTitle>
                          <CardAction>
                            <Badge variant='outline'>
                              <Icons.route className='size-3' />
                              {kpiStats.publishedItinerariesCount} Public
                            </Badge>
                          </CardAction>
                        </CardHeader>
                        <CardFooter className='flex-col items-start gap-1 text-xs'>
                          <div className='flex items-center gap-1.5 font-medium'>
                            {tables.days.length} hari · {tables.activities.length} aktivitas
                          </div>
                          <div className='text-muted-foreground'>Klik untuk kelola daftar perjalanan</div>
                        </CardFooter>
                      </Card>

                    <Card
                      className='@container/card cursor-pointer transition-all hover:shadow-md'
                      onClick={() => selectTable('myLinkWhitelistDomains')}
                    >
                      <CardHeader>
                        <CardDescription>Interaksi & Konfigurasi</CardDescription>
                        <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                          {tables.saves.length + tables.likes.length}
                        </CardTitle>
                        <CardAction>
                          <Badge variant='outline'>
                            <Icons.world className='size-3' />
                            {tables.myLinkWhitelistDomains.length} Domain
                          </Badge>
                        </CardAction>
                      </CardHeader>
                      <CardFooter className='flex-col items-start gap-1 text-xs'>
                        <div className='flex items-center gap-1.5 font-medium'>
                          {tables.saves.length} disimpan · {tables.likes.length} disukai
                        </div>
                        <div className='text-muted-foreground'>
                          {tables.appSettings.length} kunci konfigurasi aktif
                        </div>
                      </CardFooter>
                    </Card>
                  </div>

                            {/* All Tables Directory Grid */}
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                            {(Object.keys(tableConfigs) as AdminTable[]).map((tableId) => {
                              const itemConfig = tableConfigs[tableId];
                              const ItemIcon = itemConfig.icon;
                              return (
                                <Card
                                  key={tableId}
                                  className='cursor-pointer transition-all hover:shadow-md'
                                  onClick={() => selectTable(tableId)}
                                >
                    <CardHeader>
                      <CardDescription className='flex items-center gap-2'>
                        <ItemIcon className='size-4' />
                        {itemConfig.group}
                      </CardDescription>
                      <CardTitle className='text-lg font-semibold'>{itemConfig.label}</CardTitle>
                      <CardAction>
                        <Badge variant='secondary'>{tables[tableId].length} records</Badge>
                      </CardAction>
                    </CardHeader>
                    <CardFooter className='text-muted-foreground text-xs'>
                      {itemConfig.description}
                    </CardFooter>
                  </Card>
                  );
                })}
                </div>
            </div>
        </PageContainer>
        ) : (
        <PageContainer
          pageTitle={config.label}
          pageDescription={config.description}
          pageHeaderAction={
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm' onClick={handleExportCSV}>
                <Icons.download className='size-4' />
                Export CSV
              </Button>
              <Button size='sm' onClick={openCreateSheet}>
                <Icons.add className='size-4' />
                Add New
              </Button>
            </div>
          }
        >
          <DataTable table={table} ariaLabel={`Tabel ${config.label}`}>
            <DataTableToolbar
              table={table}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
              searchPlaceholder={`Search ${config.label.toLowerCase()}...`}
            />
          </DataTable>
    </PageContainer>
        )}
  </SidebarInset>

      {/* Record Create / Edit Sheet (next-shadcn user-form-sheet pattern) */ }
<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
  <SheetContent className='flex h-full max-h-dvh flex-col overflow-hidden sm:max-w-xl'>
    <SheetHeader className='shrink-0'>
      <SheetTitle>
        {editorMode === 'create' ? `Buat ${config.label}` : `Edit ${config.label}`}
      </SheetTitle>
      <SheetDescription>
        {editorMode === 'create'
          ? `Isi detail form atau JSON di bawah untuk menambahkan record baru ke tabel ${config.label}.`
          : `Perbarui field record ID: ${editingId} pada tabel ${config.label}.`}
      </SheetDescription>
    </SheetHeader>

    <Tabs
      value={editorTab}
      onValueChange={(val) => setEditorTab(val as 'form' | 'json')}
      className='flex min-h-0 flex-1 flex-col overflow-hidden'
    >
      <TabsList className='w-full shrink-0'>
        <TabsTrigger value='form' className='flex-1'>
          <Icons.forms className='size-4' />
          Form Editor
        </TabsTrigger>
        <TabsTrigger value='json' className='flex-1'>
          <Icons.fileCode className='size-4' />
          JSON Editor
        </TabsTrigger>
      </TabsList>

      <div className='mt-3 -mr-2 min-h-0 flex-1 overflow-y-auto pr-2'>
        {(() => {
          let parsedDraft: Record<string, unknown> = {};
          let parseError = '';
          try {
            parsedDraft = JSON.parse(draft);
          } catch (err) {
            parseError = err instanceof Error ? err.message : 'Invalid JSON';
          }
          const formFields = Object.keys(parsedDraft).filter((key) => !key.startsWith('_'));

          return (
            <>
              <TabsContent value='form' className='flex-none space-y-4 pb-4'>
                {parseError ? (
                  <Alert variant='destructive'>
                    <Icons.alertCircle />
                    <AlertTitle>Format JSON Tidak Valid</AlertTitle>
                    <AlertDescription>
                      {parseError}. Silakan perbaiki di tab JSON Editor terlebih dahulu.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className='grid grid-cols-1 gap-4'>
                    {formFields.map((key) => {
                      const value = parsedDraft[key];
                      const labelText = formatLabel(key);

                      if (
                        currentTable === 'users' &&
                        (key === 'isPro' || key === 'proExpiresAt')
                      ) {
                        if (key === 'proExpiresAt') return null;

                        const isProVal = Boolean(parsedDraft.isPro);
                        const expiresAtVal = parsedDraft.proExpiresAt as
                          | string
                          | null
                          | undefined;
                        const currentPlan = getSubscriptionOption(expiresAtVal, isProVal);

                        return (
                          <div key='plan-selector' className='space-y-2'>
                            <Label htmlFor='form-field-plan'>Subscription Plan</Label>
                            <Select
                              items={SUBSCRIPTION_PLAN_OPTIONS}
                              value={currentPlan}
                              onValueChange={(val) => {
                                if (!val) return;
                                let isPro = false;
                                let proExpiresAt: string | null = null;
                                let limits = {
                                  maxPrivate: 2,
                                  maxPublic: 5,
                                  maxSaved: 5,
                                  maxMyLink: 50
                                };

                                if (val !== 'free') {
                                  isPro = true;
                                  limits = {
                                    maxPrivate: 100,
                                    maxPublic: 100,
                                    maxSaved: 100,
                                    maxMyLink: 100
                                  };

                                  const now = new Date();
                                  if (val === 'pro_1m') {
                                    now.setMonth(now.getMonth() + 1);
                                    proExpiresAt = now.toISOString();
                                  } else if (val === 'pro_3m') {
                                    now.setMonth(now.getMonth() + 3);
                                    proExpiresAt = now.toISOString();
                                  } else if (val === 'pro_6m') {
                                    now.setMonth(now.getMonth() + 6);
                                    proExpiresAt = now.toISOString();
                                  } else if (val === 'pro_1y') {
                                    now.setFullYear(now.getFullYear() + 1);
                                    proExpiresAt = now.toISOString();
                                  }
                                }

                                try {
                                  const parsed = JSON.parse(draft) as Record<
                                    string,
                                    unknown
                                  >;
                                  parsed.isPro = isPro;
                                  parsed.proExpiresAt = proExpiresAt;
                                  parsed.maxPrivate = limits.maxPrivate;
                                  parsed.maxPublic = limits.maxPublic;
                                  parsed.maxSaved = limits.maxSaved;
                                  parsed.maxMyLink = limits.maxMyLink;
                                  setDraft(JSON.stringify(parsed, null, 2));
                                } catch {
                                  // ignore
                                }
                              }}
                            >
                              <SelectTrigger id='form-field-plan' className='w-full'>
                                <SelectValue placeholder='Pilih plan' />
                              </SelectTrigger>
                              <SelectContent>
                                {SUBSCRIPTION_PLAN_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      }

                      if (typeof value === 'boolean') {
                        return (
                          <div
                            key={key}
                            className='flex items-center justify-between rounded-lg border p-3 shadow-2xs'
                          >
                            <Label htmlFor={`form-field-${key}`} className='cursor-pointer'>
                              {labelText}
                            </Label>
                            <Switch
                              id={`form-field-${key}`}
                              checked={value}
                              onCheckedChange={(checked) => updateDraftField(key, checked)}
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={key} className='space-y-2'>
                          <Label htmlFor={`form-field-${key}`}>{labelText}</Label>
                          {currentTable === 'appSettings' &&
                            key === 'key' &&
                            editorMode === 'edit' ? (
                            <Input
                              id={`form-field-${key}`}
                              type='text'
                              value={
                                value !== null && value !== undefined ? String(value) : ''
                              }
                              disabled
                            />
                          ) : key === 'role' ? (
                            <Select
                              items={[
                                { value: 'USER', label: 'USER' },
                                { value: 'ADMIN', label: 'ADMIN' }
                              ]}
                              value={String(value ?? 'USER')}
                              onValueChange={(val) => {
                                if (val) updateDraftField(key, val);
                              }}
                            >
                              <SelectTrigger id={`form-field-${key}`} className='w-full'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='USER'>USER</SelectItem>
                                <SelectItem value='ADMIN'>ADMIN</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : key === 'status' && currentTable === 'accountClaims' ? (
                            <Select
                              items={[
                                { value: 'PENDING', label: 'PENDING (Menunggu Review)' },
                                { value: 'APPROVED', label: 'APPROVED (Disetujui)' },
                                { value: 'REJECTED', label: 'REJECTED (Ditolak)' }
                              ]}
                              value={String(value ?? 'PENDING')}
                              onValueChange={(val) => {
                                if (val) updateDraftField(key, val);
                              }}
                            >
                              <SelectTrigger id={`form-field-${key}`} className='w-full'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='PENDING'>
                                  PENDING (Menunggu Review)
                                </SelectItem>
                                <SelectItem value='APPROVED'>
                                  APPROVED (Disetujui)
                                </SelectItem>
                                <SelectItem value='REJECTED'>REJECTED (Ditolak)</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : key === 'bio' ||
                            key === 'description' ||
                            key === 'notes' ||
                            key === 'proofNotes' ||
                            key === 'adminNotes' ? (
                            <Textarea
                              id={`form-field-${key}`}
                              value={String(value ?? '')}
                              onChange={(e) => updateDraftField(key, e.target.value)}
                              rows={3}
                            />
                          ) : key.endsWith('At') ? (
                            <Input
                              id={`form-field-${key}`}
                              type='datetime-local'
                              value={
                                value
                                  ? new Date(String(value)).toISOString().slice(0, 16)
                                  : ''
                              }
                              onChange={(e) =>
                                updateDraftField(
                                  key,
                                  e.target.value
                                    ? new Date(e.target.value).toISOString()
                                    : null
                                )
                              }
                            />
                          ) : typeof value === 'number' ? (
                            <Input
                              id={`form-field-${key}`}
                              type='number'
                              value={
                                value !== null && value !== undefined ? String(value) : ''
                              }
                              onChange={(e) =>
                                updateDraftField(
                                  key,
                                  e.target.value === '' ? null : Number(e.target.value)
                                )
                              }
                            />
                          ) : (
                            <Input
                              id={`form-field-${key}`}
                              type='text'
                              value={
                                value !== null && value !== undefined ? String(value) : ''
                              }
                              onChange={(e) => updateDraftField(key, e.target.value)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value='json' className='flex-none space-y-4 pb-4'>
                {parseError && (
                  <Alert variant='destructive'>
                    <Icons.alertCircle />
                    <AlertTitle>Format JSON Tidak Valid</AlertTitle>
                    <AlertDescription>{parseError}</AlertDescription>
                  </Alert>
                )}
                <Textarea
                  className='min-h-[360px] font-mono text-xs leading-relaxed'
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  spellCheck={false}
                />
              </TabsContent>
            </>
          );
        })()}

        {currentTable === 'appSettings' ? (
          <Alert className='mt-2 mb-4'>
            <Icons.info />
            <AlertTitle>Panduan Kunci App Settings</AlertTitle>
            <AlertDescription>
              <ul className='mt-1 list-disc space-y-1 pl-4 text-xs'>
                <li>
                  <code>whatsapp_number</code>: Nomor WhatsApp Admin (contoh:{' '}
                  <code>088293681133</code>)
                </li>
                <li>
                  <code>price_1m / 3m / 6m / 1y</code>: Harga Plan (contoh:{' '}
                  <code>Rp 29.900</code>)
                </li>
                <li>
                  <code>rate_1m / 3m / 6m / 1y</code>: Keterangan biaya (contoh:{' '}
                  <code>/bulan</code>, <code>Rp 26.633/bln</code>)
                </li>
                <li>
                  <code>promo_1m / 3m / 6m / 1y</code>: Badge Promo/Hemat (contoh:{' '}
                  <code>11% Hemat</code>)
                </li>
                <li>
                  <code>email_whitelist</code>: Whitelist domain email pendaftaran (contoh:{' '}
                  <code>gmail.com,outlook.com,yahoo.com,icloud.com</code>)
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className='mt-2 mb-4'>
            <Icons.info />
            <AlertTitle>Tips Editor</AlertTitle>
            <AlertDescription className='text-xs'>
              Anda dapat beralih antara Form Editor dan JSON Editor kapan saja. Field dengan
              prefix <code>_</code> hanya untuk tampilan relasi dan otomatis diabaikan saat
              menyimpan.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Tabs>

    <SheetFooter className='shrink-0 flex-row justify-end gap-2 border-t pt-4'>
      <Button
        type='button'
        variant='outline'
        onClick={() => resetDraft(currentTable)}
        disabled={busy}
      >
        Reset Template
      </Button>
      <Button type='button' onClick={handleSave} isLoading={busy}>
        <Icons.check className='size-4' />
        {editorMode === 'create' ? 'Create Record' : 'Update Record'}
      </Button>
    </SheetFooter>
  </SheetContent>
</Sheet>

{/* Delete Confirmation AlertModal (next-shadcn pattern) */ }
<AlertModal
  isOpen={Boolean(deleteTargetId)}
  onClose={() => setDeleteTargetId(null)}
  onConfirm={confirmDelete}
  loading={busy}
/>

{/* Approve Claim Modal */ }
<Modal
  title='Setujui Klaim Akun'
  description='Setujui permohonan klaim akun ini dan kirimkan email tautan setup password ke pemohon?'
  isOpen={Boolean(approveClaimId)}
  onClose={() => setApproveClaimId(null)}
>
  <div className='flex w-full items-center justify-end gap-2 pt-6'>
    <Button variant='outline' onClick={() => setApproveClaimId(null)} disabled={busy}>
      Batal
    </Button>
    <Button onClick={confirmApproveClaim} isLoading={busy}>
      <Icons.check className='size-4' />
      Setujui & Kirim Email
    </Button>
  </div>
</Modal>

{/* Setup URL Result Modal */ }
<Modal
  title='Klaim Disetujui!'
  description='Email notifikasi telah dikirim ke pemohon. Tautan setup password juga telah disalin ke clipboard.'
  isOpen={Boolean(approvedSetupUrl)}
  onClose={() => setApprovedSetupUrl(null)}
>
  <div className='space-y-4 pt-2'>
    <div className='flex items-center gap-2'>
      <Input readOnly value={approvedSetupUrl ?? ''} className='font-mono text-xs' />
      <Button
        variant='outline'
        size='icon'
        onClick={() => {
          if (approvedSetupUrl) {
            navigator.clipboard.writeText(approvedSetupUrl).catch(() => { });
            toast.success('Tautan disalin ke clipboard!');
          }
        }}
      >
        <Icons.copy className='size-4' />
      </Button>
    </div>
    <div className='flex justify-end'>
      <Button onClick={() => setApprovedSetupUrl(null)}>Selesai</Button>
    </div>
  </div>
</Modal>

{/* Reject Claim Modal */ }
<Modal
  title='Tolak Klaim Akun'
  description='Masukkan alasan penolakan klaim (opsional) yang akan dikirimkan ke email pemohon.'
  isOpen={Boolean(rejectClaimId)}
  onClose={() => setRejectClaimId(null)}
>
  <div className='space-y-4 pt-2'>
    <div className='space-y-2'>
      <Label htmlFor='reject-reason-input'>Alasan Penolakan</Label>
      <Textarea
        id='reject-reason-input'
        placeholder='Contoh: Bukti kepemilikan akun sosial media belum sesuai...'
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        rows={3}
      />
    </div>
    <div className='flex justify-end gap-2'>
      <Button variant='outline' onClick={() => setRejectClaimId(null)} disabled={busy}>
        Batal
      </Button>
      <Button variant='destructive' onClick={confirmRejectClaim} isLoading={busy}>
        Tolak Klaim
      </Button>
    </div>
  </div>
</Modal>

{/* Impersonate Confirmation Modal */ }
<Modal
  title='Masuk Sebagai Akun Kurasi'
  description='Anda akan masuk sebagai akun kurasi ini untuk membuat atau mengedit itinerary. Anda dapat kembali ke Admin Console kapan saja melalui banner di bagian atas halaman.'
  isOpen={Boolean(impersonateUserId)}
  onClose={() => setImpersonateUserId(null)}
>
  <div className='flex justify-end gap-2 pt-6'>
    <Button variant='outline' onClick={() => setImpersonateUserId(null)} disabled={busy}>
      Batal
    </Button>
    <Button onClick={confirmImpersonate} isLoading={busy}>
      <Icons.login className='size-4' />
      Masuk & Buat Itinerary
    </Button>
  </div>
</Modal>
    </SidebarProvider >
  );
}

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
  type VisibilityState,
  type RowSelectionState
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { DataTableToolbar, type SearchSuggestion } from '@/components/ui/table/data-table-toolbar';
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
    columns: ['title', 'dayNumber', 'itineraryId', 'authorId'],
    template: {
      itineraryId: '',
      dayNumber: 1,
      title: 'Hari 1 - Kota Tujuan'
    }
  },
  activities: {
    label: 'Activities',
    description: 'Kelola aktivitas, urutan, kategori, biaya, dan tautan MyLink di tiap hari itinerary.',
    group: 'Konten & Perjalanan',
    icon: Icons.mapPin,
    columns: [
      'title',
      'time',
      'locationName',
      'category',
      'estimatedCost',
      'myLinkId',
      'itineraryDayId',
      'authorId',
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
      myLinkId: null,
      orderIndex: 0
    }
  },
  myLinks: {
    label: 'MyLinks',
    description:
      'Kelola pustaka tautan booking/affiliate MyLink milik pengguna yang disematkan pada aktivitas.',
    group: 'Konten & Perjalanan',
    icon: Icons.link,
    columns: ['label', 'provider', 'actualUrl', 'usageCount', 'userId', 'createdAt'],
    template: {
      userId: '',
      label: 'Tiket Masuk / Booking Hotel',
      provider: 'Klook',
      actualUrl: 'https://www.klook.com/'
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
      tables: ['itineraries', 'days', 'activities', 'myLinks', 'saves', 'likes']
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
  { label: 'Sudah Diklaim (Aktif)', value: 'CLAIMED', icon: Icons.circleCheck },
  { label: 'Belum Diklaim (Kurasi)', value: 'UNCLAIMED', icon: Icons.clock }
];

const CLAIM_STATUS_FILTER_OPTIONS: Option[] = [
  { label: 'Menunggu Review', value: 'PENDING', icon: Icons.clock },
  { label: 'Disetujui', value: 'APPROVED', icon: Icons.circleCheck },
  { label: 'Ditolak', value: 'REJECTED', icon: Icons.circleX }
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

const MYLINK_PROVIDER_OPTIONS: Option[] = [
  { label: 'Klook', value: 'Klook' },
  { label: 'Agoda', value: 'Agoda' },
  { label: 'Traveloka', value: 'Traveloka' },
  { label: 'Tiket.com', value: 'Tiket.com' },
  { label: 'Booking.com', value: 'Booking.com' },
  { label: 'WhatsApp', value: 'WhatsApp' },
  { label: 'Custom', value: 'Custom' }
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
    claimantEmail: false,
    adminNotes: false,
    token: false,
    tokenExpiresAt: false
  },
  sessions: {
    id: false
  },
  itineraries: {
    id: false
  },
  days: {
    id: false
  },
  activities: {
    id: false,
    latitude: false,
    longitude: false,
    orderIndex: false
  },
  myLinks: {},
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

const ACCOUNT_CLAIM_COLUMN_LABELS: Record<string, string> = {
  userId: 'Akun Diklaim',
  claimantName: 'Nama Pemohon',
  claimantEmail: 'Email Pemohon',
  socialHandle: 'Sosial Media',
  status: 'Status',
  proofNotes: 'Bukti Klaim',
  adminNotes: 'Catatan Admin',
  token: 'Token Setup',
  tokenExpiresAt: 'Expired Token',
  createdAt: 'Tanggal Klaim'
};

function formatLabel(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
}

function formatColumnLabel(table: AdminTable, key: string) {
  if (table === 'accountClaims' && ACCOUNT_CLAIM_COLUMN_LABELS[key]) {
    return ACCOUNT_CLAIM_COLUMN_LABELS[key];
  }
  if (
    (key === 'authorId' &&
      (table === 'itineraries' || table === 'days' || table === 'activities')) ||
    (key === 'userId' && table === 'myLinks')
  ) {
    return 'Nama User';
  }
  if (key === 'itineraryId' && table === 'days') {
    return 'Itinerary';
  }
  if (key === 'itineraryDayId' && table === 'activities') {
    return 'Hari Itinerary';
  }
  if (key === 'myLinkId' && table === 'activities') {
    return 'My Link Id';
  }
  if (key === 'usageCount' && table === 'myLinks') {
    return 'Digunakan di Activity';
  }
  return formatLabel(key);
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
  const [editorTab, setEditorTab] = useState<'form' | 'json' | 'bulk'>('form');
  const [sheetOpen, setSheetOpen] = useState(false);

  // Modal states
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [approveClaimId, setApproveClaimId] = useState<string | null>(null);
  const [approvedSetupUrl, setApprovedSetupUrl] = useState<string | null>(null);
  const [rejectClaimId, setRejectClaimId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [impersonateUserId, setImpersonateUserId] = useState<string | null>(null);

  // Bulk Add states (Create Sheet -> Bulk Add tab)
  const [bulkMyLinkUserId, setBulkMyLinkUserId] = useState<string>('');
  const [bulkMyLinkRows, setBulkMyLinkRows] = useState<
    Array<{ label: string; actualUrl: string; provider: string }>
  >([
    { label: '', actualUrl: '', provider: 'Klook' },
    { label: '', actualUrl: '', provider: 'Traveloka' }
  ]);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [bulkActivityDayId, setBulkActivityDayId] = useState<string>('');
  const [bulkActivityMyLinkId, setBulkActivityMyLinkId] = useState<string>('__none__');
  const [bulkActivityRows, setBulkActivityRows] = useState<
    Array<{
      time: string;
      title: string;
      locationName: string;
      category: string;
      estimatedCost: number;
    }>
  >([
    { time: '09:00', title: '', locationName: '', category: 'wisata', estimatedCost: 0 },
    { time: '12:00', title: '', locationName: '', category: 'kuliner', estimatedCost: 0 }
  ]);
  const [bulkJsonDraft, setBulkJsonDraft] = useState<string>(
    JSON.stringify([tableConfigs.users.template], null, 2)
  );

  // Bulk Action Modal states (DataTable row selection)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [bulkSetMyLinkModalOpen, setBulkSetMyLinkModalOpen] = useState(false);
  const [bulkSelectedMyLinkId, setBulkSelectedMyLinkId] = useState<string>('__none__');
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkEditProvider, setBulkEditProvider] = useState<string>('__keep__');
  const [bulkEditUserId, setBulkEditUserId] = useState<string>('__keep__');
  const [bulkEditCategory, setBulkEditCategory] = useState<string>('__keep__');

  // MyLink Activity Usage Manager Sheet states
  const [managingMyLinkId, setManagingMyLinkId] = useState<string | null>(null);
  const [usageTab, setUsageTab] = useState<'linked' | 'add'>('linked');
  const [linkedSearch, setLinkedSearch] = useState('');
  const [selectedLinkedActivityIds, setSelectedLinkedActivityIds] = useState<string[]>([]);
  const [reassignTargetMyLinkId, setReassignTargetMyLinkId] = useState<string>('__none__');
  const [addActivitySearch, setAddActivitySearch] = useState('');
  const [addActivityItineraryFilter, setAddActivityItineraryFilter] = useState<string>('__all__');
  const [addActivityOnlyUnlinked, setAddActivityOnlyUnlinked] = useState<boolean>(false);
  const [selectedCandidateActivityIds, setSelectedCandidateActivityIds] = useState<string[]>([]);

  // Datatable States (TanStack Table controlled states)
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    DEFAULT_HIDDEN_COLUMNS.users
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
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
    setBulkJsonDraft(JSON.stringify([tableConfigs[table].template], null, 2));
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
      setRowSelection({});
      setColumnVisibility(DEFAULT_HIDDEN_COLUMNS[tableId]);
      setPagination({ pageIndex: 0, pageSize: 10 });
    },
    [resetDraft]
  );

  const openCreateSheet = useCallback(() => {
    resetDraft(currentTable);
    setSheetOpen(true);
  }, [currentTable, resetDraft]);

  const openBulkCreateSheet = useCallback(() => {
    resetDraft(currentTable);
    setEditorTab('bulk');
    setSheetOpen(true);
  }, [currentTable, resetDraft]);

  const openMyLinkUsageManager = useCallback((myLinkId: string, initialTab: 'linked' | 'add' = 'linked') => {
    setManagingMyLinkId(myLinkId);
    setUsageTab(initialTab);
    setLinkedSearch('');
    setSelectedLinkedActivityIds([]);
    setReassignTargetMyLinkId('__none__');
    setAddActivitySearch('');
    setAddActivityItineraryFilter('__all__');
    setAddActivityOnlyUnlinked(false);
    setSelectedCandidateActivityIds([]);
  }, []);

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
      if (currentTable === 'activities') {
        await refreshTable('myLinks');
      } else if (currentTable === 'myLinks') {
        await refreshTable('activities');
      }
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
      if (currentTable === 'activities') {
        await refreshTable('myLinks');
      } else if (currentTable === 'myLinks') {
        await refreshTable('activities');
      }
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

  const executeBulkAction = useCallback(
    async (
      payload: Record<string, unknown>,
      successMessage: string,
      tablesToRefresh: AdminTable[] = [currentTable]
    ) => {
      setBusy(true);
      try {
        const response = await fetch('/api/admin/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const uniqueTables = Array.from(new Set(tablesToRefresh));
        await Promise.all(uniqueTables.map((t) => refreshTable(t)));
        toast.success(successMessage);
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Gagal menjalankan aksi bulk.');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [currentTable, refreshTable]
  );

  async function handleBulkCreate() {
    if (currentTable === 'myLinks') {
      const validRows = bulkMyLinkRows.filter(
        (r) => r.label.trim() !== '' && r.actualUrl.trim() !== ''
      );
      if (validRows.length === 0) {
        toast.error('Isi minimal 1 baris MyLink (Label & Actual URL).');
        return;
      }
      if (!bulkMyLinkUserId.trim()) {
        toast.error('Pilih atau isi User ID pemilik MyLink terlebih dahulu.');
        return;
      }
      const items = validRows.map((r) => ({
        userId: bulkMyLinkUserId.trim(),
        label: r.label.trim(),
        actualUrl: r.actualUrl.trim(),
        provider: r.provider || 'Custom'
      }));
      const ok = await executeBulkAction(
        { action: 'bulkCreate', table: 'myLinks', items },
        `${items.length} MyLink berhasil ditambahkan secara bulk.`,
        ['myLinks', 'activities']
      );
      if (ok) {
        setBulkMyLinkRows([
          { label: '', actualUrl: '', provider: 'Klook' },
          { label: '', actualUrl: '', provider: 'Traveloka' }
        ]);
        setBulkPasteText('');
        setSheetOpen(false);
      }
      return;
    }

    if (currentTable === 'activities') {
      const validRows = bulkActivityRows.filter(
        (r) => r.title.trim() !== '' && r.locationName.trim() !== ''
      );
      if (validRows.length === 0) {
        toast.error('Isi minimal 1 baris Activity (Title & Location Name).');
        return;
      }
      if (!bulkActivityDayId.trim()) {
        toast.error('Pilih atau isi Itinerary Day ID terlebih dahulu.');
        return;
      }
      const items = validRows.map((r) => ({
        itineraryDayId: bulkActivityDayId.trim(),
        time: r.time.trim() || '09:00',
        title: r.title.trim(),
        locationName: r.locationName.trim(),
        category: r.category || 'wisata',
        estimatedCost: Number(r.estimatedCost) || 0,
        description: '',
        mapsUrl: '',
        myLinkId:
          bulkActivityMyLinkId && bulkActivityMyLinkId !== '__none__'
            ? bulkActivityMyLinkId
            : null
      }));
      const ok = await executeBulkAction(
        { action: 'bulkCreate', table: 'activities', items },
        `${items.length} Activity berhasil ditambahkan secara bulk.`,
        ['activities', 'myLinks']
      );
      if (ok) {
        setBulkActivityRows([
          { time: '09:00', title: '', locationName: '', category: 'wisata', estimatedCost: 0 },
          { time: '12:00', title: '', locationName: '', category: 'kuliner', estimatedCost: 0 }
        ]);
        setSheetOpen(false);
      }
      return;
    }

    try {
      const parsed = JSON.parse(bulkJsonDraft);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        toast.error('JSON harus berupa array berisi minimal 1 objek record.');
        return;
      }
      const ok = await executeBulkAction(
        { action: 'bulkCreate', table: currentTable, items: parsed },
        `${parsed.length} record ${config.label} berhasil ditambahkan secara bulk.`,
        [currentTable]
      );
      if (ok) {
        setSheetOpen(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Format JSON Array tidak valid.');
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

  // Lookup maps for resolving User, Itinerary, and Day relations across tables
  const userByIdMap = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    for (const u of tables.users) {
      if (u.id) map.set(String(u.id), u);
    }
    return map;
  }, [tables.users]);

  const itineraryByIdMap = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    for (const it of tables.itineraries) {
      if (it.id) map.set(String(it.id), it);
    }
    return map;
  }, [tables.itineraries]);

  const dayByIdMap = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    for (const d of tables.days) {
      if (d.id) map.set(String(d.id), d);
    }
    return map;
  }, [tables.days]);

  const myLinkByIdMap = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    for (const ml of tables.myLinks ?? []) {
      if (ml.id) map.set(String(ml.id), ml);
    }
    return map;
  }, [tables.myLinks]);

  const getActivitiesForMyLink = useCallback(
    (myLinkId: string): Record<string, unknown>[] => {
      if (!myLinkId) return [];
      const resultMap = new Map<string, Record<string, unknown>>();
      const knownActivityIdsInTable = new Set<string>();

      for (const act of tables.activities ?? []) {
        const actId = String(act.id ?? '');
        if (!actId) continue;
        knownActivityIdsInTable.add(actId);
        if (String(act.myLinkId ?? '') === myLinkId) {
          resultMap.set(actId, act);
        }
      }

      const mlRecord = myLinkByIdMap.get(myLinkId);
      const rel =
        mlRecord?._related && typeof mlRecord._related === 'object'
          ? (mlRecord._related as Record<string, unknown>)
          : undefined;
      if (Array.isArray(rel?.activities)) {
        for (const rawAct of rel.activities) {
          if (!rawAct || typeof rawAct !== 'object') continue;
          const actObj = rawAct as Record<string, unknown>;
          const actId = String(actObj.id ?? '');
          if (!actId || resultMap.has(actId)) continue;
          // Only fallback to _related.activities if not already overridden in tables.activities
          if (!knownActivityIdsInTable.has(actId)) {
            resultMap.set(actId, {
              ...actObj,
              myLinkId,
              _related: {
                day: actObj.day
              }
            });
          }
        }
      }

      return Array.from(resultMap.values());
    },
    [tables.activities, myLinkByIdMap]
  );

  const resolveRecordUser = useCallback(
    (record: Record<string, unknown>, tableId: AdminTable): Record<string, unknown> | undefined => {
      const rel =
        record._related && typeof record._related === 'object'
          ? (record._related as Record<string, unknown>)
          : undefined;

      if (tableId === 'itineraries') {
        if (rel?.author && typeof rel.author === 'object') {
          const author = rel.author as Record<string, unknown>;
          return {
            id: author.id ?? record.authorId,
            ...author
          };
        }
        if (record.authorId) {
          return userByIdMap.get(String(record.authorId));
        }
      }

      if (tableId === 'days') {
        const relIt =
          rel?.itinerary && typeof rel.itinerary === 'object'
            ? (rel.itinerary as Record<string, unknown>)
            : record.itineraryId
              ? itineraryByIdMap.get(String(record.itineraryId))
              : undefined;
        if (relIt) {
          if (relIt.author && typeof relIt.author === 'object') {
            const author = relIt.author as Record<string, unknown>;
            return {
              id: author.id ?? relIt.authorId,
              ...author
            };
          }
          const nestedRel =
            relIt._related && typeof relIt._related === 'object'
              ? (relIt._related as Record<string, unknown>)
              : undefined;
          if (nestedRel?.author && typeof nestedRel.author === 'object') {
            const author = nestedRel.author as Record<string, unknown>;
            return {
              id: author.id ?? relIt.authorId,
              ...author
            };
          }
          if (relIt.authorId) {
            return userByIdMap.get(String(relIt.authorId));
          }
        }
      }

      if (tableId === 'activities') {
        const relDay =
          rel?.day && typeof rel.day === 'object'
            ? (rel.day as Record<string, unknown>)
            : record.itineraryDayId
              ? dayByIdMap.get(String(record.itineraryDayId))
              : undefined;
        if (relDay) {
          const relIt =
            relDay.itinerary && typeof relDay.itinerary === 'object'
              ? (relDay.itinerary as Record<string, unknown>)
              : relDay._related &&
                typeof relDay._related === 'object' &&
                (relDay._related as Record<string, unknown>).itinerary
                ? ((relDay._related as Record<string, unknown>).itinerary as Record<
                  string,
                  unknown
                >)
                : relDay.itineraryId
                  ? itineraryByIdMap.get(String(relDay.itineraryId))
                  : undefined;
          if (relIt) {
            if (relIt.author && typeof relIt.author === 'object') {
              const author = relIt.author as Record<string, unknown>;
              return {
                id: author.id ?? relIt.authorId,
                ...author
              };
            }
            const nestedRel =
              relIt._related && typeof relIt._related === 'object'
                ? (relIt._related as Record<string, unknown>)
                : undefined;
            if (nestedRel?.author && typeof nestedRel.author === 'object') {
              const author = nestedRel.author as Record<string, unknown>;
              return {
                id: author.id ?? relIt.authorId,
                ...author
              };
            }
            if (relIt.authorId) {
              return userByIdMap.get(String(relIt.authorId));
            }
          }
        }
      }

      if (rel?.user && typeof rel.user === 'object') {
        return rel.user as Record<string, unknown>;
      }
      if (record.userId) {
        return userByIdMap.get(String(record.userId));
      }
      return undefined;
    },
    [userByIdMap, itineraryByIdMap, dayByIdMap]
  );

  const resolveRecordUserKey = useCallback(
    (record: Record<string, unknown>, tableId: AdminTable): string => {
      const u = resolveRecordUser(record, tableId);
      if (u?.id) return String(u.id);
      if (u?.email) return String(u.email);
      if (u?.username) return String(u.username);
      if (tableId === 'itineraries' && record.authorId) return String(record.authorId);
      if (tableId === 'myLinks' && record.userId) return String(record.userId);
      return '';
    },
    [resolveRecordUser]
  );

  // Dynamic Column Definitions for TanStack Table (next-shadcn users-table pattern)
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const getNormalizedFilterVal = (
      record: Record<string, unknown>,
      colName: string
    ): string => {
      const raw = record[colName];
      if (currentTable === 'accountClaims' && colName === 'userId') {
        const rel =
          record._related && typeof record._related === 'object'
            ? (record._related as Record<string, unknown>)
            : undefined;
        const targetUser =
          rel?.user && typeof rel.user === 'object'
            ? (rel.user as Record<string, unknown>)
            : undefined;
        return targetUser?.isClaimed ? 'CLAIMED' : 'UNCLAIMED';
      }
      if (
        (colName === 'authorId' &&
          (currentTable === 'itineraries' ||
            currentTable === 'days' ||
            currentTable === 'activities')) ||
        (colName === 'userId' && currentTable === 'myLinks')
      ) {
        return resolveRecordUserKey(record, currentTable);
      }
      if (colName === 'isPro') return raw ? 'PRO' : 'FREE';
      if (colName === 'isClaimed') return raw ? 'CLAIMED' : 'UNCLAIMED';
      if (colName === 'isPublished') return raw ? 'PUBLISHED' : 'DRAFT';
      if (colName === 'isActive') return raw ? 'ACTIVE' : 'INACTIVE';
      return String(raw ?? '');
    };

    const withOptionCounts = (colName: string, baseOptions: Option[]): Option[] => {
      const counts = new Map<string, number>();
      for (const rec of records) {
        const key = getNormalizedFilterVal(rec, colName).toUpperCase();
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      return baseOptions.map((opt) => ({
        ...opt,
        count: counts.get(opt.value.toUpperCase()) ?? 0
      }));
    };

    const buildUserFilterOptions = (): Option[] => {
      const userMap = new Map<
        string,
        {
          value: string;
          label: string;
          description?: string;
          keywords: string[];
          count: number;
        }
      >();

      const registerUser = (u: Record<string, unknown> | undefined, fallbackId?: string) => {
        const key = String(u?.id ?? u?.email ?? u?.username ?? fallbackId ?? '').trim();
        if (!key) return '';

        const upperKey = key.toUpperCase();
        if (!userMap.has(upperKey)) {
          const name = u?.name ? String(u.name).trim() : '';
          const username = u?.username ? String(u.username).replace(/^@/, '').trim() : '';
          const email = u?.email ? String(u.email).trim() : '';

          const label = name || (username ? `@${username}` : email || key);
          const description =
            name && username ? `@${username}` : name && email ? email : username && email ? email : undefined;

          userMap.set(upperKey, {
            value: key,
            label,
            description,
            keywords: [name, username, `@${username}`, email].filter(Boolean),
            count: 0
          });
        }
        return upperKey;
      };

      for (const u of tables.users) {
        registerUser(u, String(u.id ?? ''));
      }

      for (const rec of records) {
        const u = resolveRecordUser(rec, currentTable);
        const fallback = currentTable === 'itineraries' ? String(rec.authorId ?? '') : '';
        const upperKey = registerUser(u, fallback);
        if (upperKey) {
          const existing = userMap.get(upperKey);
          if (existing) existing.count += 1;
        }
      }

      return Array.from(userMap.values())
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return a.label.localeCompare(b.label, 'id-ID');
        })
        .map((item) => ({
          value: item.value,
          label: item.label,
          description: item.description,
          keywords: item.keywords,
          count: item.count,
          icon: Icons.user
        }));
    };

    const buildDestinationFilterOptions = (): Option[] => {
      const destCounts = new Map<string, { label: string; count: number }>();
      for (const rec of records) {
        const dest = String(rec.destination ?? '').trim();
        if (!dest) continue;
        const key = dest.toUpperCase();
        const existing = destCounts.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          destCounts.set(key, { label: dest, count: 1 });
        }
      }
      return Array.from(destCounts.values())
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'id-ID'))
        .map((d) => ({
          value: d.label,
          label: d.label,
          count: d.count,
          icon: Icons.mapPin
        }));
    };

    const buildItineraryFilterOptions = (): Option[] => {
      const itMap = new Map<
        string,
        { value: string; label: string; description?: string; keywords: string[]; count: number }
      >();

      for (const rec of records) {
        const itId = String(rec.itineraryId ?? '').trim();
        if (!itId) continue;
        const upperKey = itId.toUpperCase();
        const rel =
          rec._related && typeof rec._related === 'object'
            ? (rec._related as Record<string, unknown>)
            : undefined;
        const relIt =
          rel?.itinerary && typeof rel.itinerary === 'object'
            ? (rel.itinerary as Record<string, unknown>)
            : itineraryByIdMap.get(itId);
        const title = relIt?.title ? String(relIt.title) : itId.slice(0, 10);
        const u = resolveRecordUser(rec, currentTable);
        const userLabel = u?.name
          ? String(u.name)
          : u?.username
            ? `@${String(u.username).replace(/^@/, '')}`
            : u?.email
              ? String(u.email)
              : undefined;

        const existing = itMap.get(upperKey);
        if (existing) {
          existing.count += 1;
        } else {
          itMap.set(upperKey, {
            value: itId,
            label: title,
            description: userLabel,
            keywords: [title, userLabel ?? '', itId].filter(Boolean),
            count: 1
          });
        }
      }

      return Array.from(itMap.values())
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'id-ID'))
        .map((item) => ({
          value: item.value,
          label: item.label,
          description: item.description,
          keywords: item.keywords,
          count: item.count,
          icon: Icons.route
        }));
    };

    const buildDayFilterOptions = (): Option[] => {
      const dayMap = new Map<
        string,
        { value: string; label: string; description?: string; keywords: string[]; count: number }
      >();

      for (const rec of records) {
        const dayId = String(rec.itineraryDayId ?? '').trim();
        if (!dayId) continue;
        const upperKey = dayId.toUpperCase();
        const rel =
          rec._related && typeof rec._related === 'object'
            ? (rec._related as Record<string, unknown>)
            : undefined;
        const relDay =
          rel?.day && typeof rel.day === 'object'
            ? (rel.day as Record<string, unknown>)
            : dayByIdMap.get(dayId);
        const dayTitle = relDay?.title ? String(relDay.title) : dayId.slice(0, 10);
        const relIt =
          relDay?.itinerary && typeof relDay.itinerary === 'object'
            ? (relDay.itinerary as Record<string, unknown>)
            : relDay?.itineraryId
              ? itineraryByIdMap.get(String(relDay.itineraryId))
              : undefined;
        const itTitle = relIt?.title ? String(relIt.title) : undefined;
        const u = resolveRecordUser(rec, currentTable);
        const userLabel = u?.name
          ? String(u.name)
          : u?.username
            ? `@${String(u.username).replace(/^@/, '')}`
            : undefined;
        const desc = [itTitle, userLabel].filter(Boolean).join(' · ') || undefined;

        const existing = dayMap.get(upperKey);
        if (existing) {
          existing.count += 1;
        } else {
          dayMap.set(upperKey, {
            value: dayId,
            label: dayTitle,
            description: desc,
            keywords: [dayTitle, itTitle ?? '', userLabel ?? '', dayId].filter(Boolean),
            count: 1
          });
        }
      }

      return Array.from(dayMap.values())
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'id-ID'))
        .map((item) => ({
          value: item.value,
          label: item.label,
          description: item.description,
          keywords: item.keywords,
          count: item.count,
          icon: Icons.calendar
        }));
    };

    const buildMyLinkFilterOptions = (): Option[] => {
      const mlMap = new Map<
        string,
        { value: string; label: string; description?: string; keywords: string[]; count: number }
      >();

      const registerMyLink = (ml: Record<string, unknown> | undefined, fallbackId?: string) => {
        const key = String(ml?.id ?? fallbackId ?? '').trim();
        if (!key) return '';
        const upperKey = key.toUpperCase();
        if (!mlMap.has(upperKey)) {
          const label = ml?.label ? String(ml.label) : key;
          const provider = ml?.provider ? String(ml.provider) : undefined;
          const owner = ml ? resolveRecordUser(ml, 'myLinks') : undefined;
          const ownerLabel = owner?.name
            ? String(owner.name)
            : owner?.username
              ? `@${String(owner.username).replace(/^@/, '')}`
              : undefined;
          const desc = [provider, ownerLabel, key].filter(Boolean).join(' · ') || undefined;
          mlMap.set(upperKey, {
            value: key,
            label,
            description: desc,
            keywords: [label, provider ?? '', ownerLabel ?? '', key].filter(Boolean),
            count: 0
          });
        }
        return upperKey;
      };

      for (const ml of tables.myLinks ?? []) {
        registerMyLink(ml, String(ml.id ?? ''));
      }

      for (const rec of records) {
        const mlId = String(rec.myLinkId ?? '').trim();
        if (!mlId) continue;
        const rel =
          rec._related && typeof rec._related === 'object'
            ? (rec._related as Record<string, unknown>)
            : undefined;
        const relMl =
          rel?.myLink && typeof rel.myLink === 'object'
            ? (rel.myLink as Record<string, unknown>)
            : myLinkByIdMap.get(mlId);
        const upperKey = registerMyLink(relMl, mlId);
        if (upperKey) {
          const existing = mlMap.get(upperKey);
          if (existing) existing.count += 1;
        }
      }

      return Array.from(mlMap.values())
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'id-ID'))
        .map((item) => ({
          value: item.value,
          label: item.label,
          description: item.description,
          keywords: item.keywords,
          count: item.count,
          icon: Icons.link
        }));
    };

    const idHeaderTitle = currentTable === 'myLinks' ? 'My Link Id' : 'ID';

    const dataCols: ColumnDef<Record<string, unknown>>[] = [
      {
        id: 'select',
        size: 36,
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        header: ({ table: tbl }) => (
          <div className='flex items-center justify-center'>
            <Checkbox
              checked={tbl.getIsAllPageRowsSelected()}
              indeterminate={
                tbl.getIsSomePageRowsSelected() && !tbl.getIsAllPageRowsSelected()
              }
              onCheckedChange={(checked) => tbl.toggleAllPageRowsSelected(Boolean(checked))}
              aria-label='Pilih semua baris di halaman ini'
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className='flex items-center justify-center'>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
              aria-label='Pilih baris ini'
            />
          </div>
        )
      },
      {
        id: 'id',
        accessorFn: (row) => String(row.id ?? row.key ?? ''),
        enableColumnFilter: false,
        meta: {
          label: idHeaderTitle
        },
        header: ({ column }: { column: Column<Record<string, unknown>, unknown> }) => (
          <DataTableColumnHeader column={column} title={idHeaderTitle} />
        ),
        cell: (info) => {
          const idVal = String(info.getValue() ?? '');
          if (currentTable === 'myLinks' && idVal) {
            return (
              <div className='flex items-center gap-1.5'>
                <code className='bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs'>
                  {idVal}
                </code>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6 shrink-0'
                  title='Salin My Link Id'
                  onClick={() => {
                    navigator.clipboard.writeText(idVal).catch(() => { });
                    toast.success('My Link Id berhasil disalin!');
                  }}
                >
                  <Icons.copy className='size-3' />
                </Button>
              </div>
            );
          }
          return (
            <span className='text-muted-foreground font-mono text-xs'>
              {idVal}
            </span>
          );
        }
      },
      ...config.columns.map((colName): ColumnDef<Record<string, unknown>> => {
        const colLabel = formatColumnLabel(currentTable, colName);
        const isUserCol =
          (colName === 'authorId' &&
            (currentTable === 'itineraries' ||
              currentTable === 'days' ||
              currentTable === 'activities')) ||
          (colName === 'userId' && currentTable === 'myLinks');

        const isFilterable =
          isUserCol ||
          (currentTable === 'users' &&
            (colName === 'role' || colName === 'isPro' || colName === 'isClaimed')) ||
          (currentTable === 'accountClaims' &&
            (colName === 'status' || colName === 'userId')) ||
          (currentTable === 'itineraries' &&
            (colName === 'isPublished' || colName === 'destination')) ||
          (currentTable === 'days' && colName === 'itineraryId') ||
          (currentTable === 'myLinks' && colName === 'provider') ||
          (currentTable === 'myLinkWhitelistDomains' && colName === 'isActive') ||
          (currentTable === 'activities' &&
            (colName === 'category' || colName === 'itineraryDayId' || colName === 'myLinkId'));

        let filterOptions: Option[] | undefined;
        if (isUserCol) filterOptions = buildUserFilterOptions();
        if (currentTable === 'users' && colName === 'role')
          filterOptions = withOptionCounts(colName, ROLE_FILTER_OPTIONS);
        if (currentTable === 'users' && colName === 'isPro')
          filterOptions = withOptionCounts(colName, PLAN_FILTER_OPTIONS);
        if (currentTable === 'users' && colName === 'isClaimed')
          filterOptions = withOptionCounts(colName, CLAIM_USER_FILTER_OPTIONS);
        if (currentTable === 'accountClaims' && colName === 'status')
          filterOptions = withOptionCounts(colName, CLAIM_STATUS_FILTER_OPTIONS);
        if (currentTable === 'accountClaims' && colName === 'userId')
          filterOptions = withOptionCounts(colName, CLAIM_USER_FILTER_OPTIONS);
        if (currentTable === 'itineraries' && colName === 'isPublished')
          filterOptions = withOptionCounts(colName, PUBLISH_FILTER_OPTIONS);
        if (currentTable === 'itineraries' && colName === 'destination')
          filterOptions = buildDestinationFilterOptions();
        if (currentTable === 'days' && colName === 'itineraryId')
          filterOptions = buildItineraryFilterOptions();
        if (currentTable === 'myLinks' && colName === 'provider')
          filterOptions = withOptionCounts(colName, MYLINK_PROVIDER_OPTIONS);
        if (currentTable === 'myLinkWhitelistDomains' && colName === 'isActive')
          filterOptions = withOptionCounts(colName, ACTIVE_DOMAIN_FILTER_OPTIONS);
        if (currentTable === 'activities' && colName === 'category')
          filterOptions = withOptionCounts(colName, ACTIVITY_CATEGORY_OPTIONS);
        if (currentTable === 'activities' && colName === 'itineraryDayId')
          filterOptions = buildDayFilterOptions();
        if (currentTable === 'activities' && colName === 'myLinkId')
          filterOptions = buildMyLinkFilterOptions();

        return {
          id: colName,
          accessorKey: colName,
          accessorFn: (row) => {
            if (colName === 'usageCount' && currentTable === 'myLinks') {
              return getActivitiesForMyLink(String(row.id ?? '')).length;
            }
            if (isUserCol) {
              const u = resolveRecordUser(row, currentTable);
              return String(u?.name ?? u?.username ?? u?.email ?? row.authorId ?? '');
            }
            return row[colName];
          },
          enableColumnFilter: isFilterable,
          meta: {
            label: colLabel,
            ...(filterOptions
              ? {
                variant: 'multiSelect' as const,
                options: filterOptions
              }
              : {})
          },
          header: ({ column }: { column: Column<Record<string, unknown>, unknown> }) => (
            <DataTableColumnHeader column={column} title={colLabel} />
          ),
          filterFn: isFilterable
            ? (row, columnId, filterValue: string | string[] | undefined) => {
              const values = Array.isArray(filterValue)
                ? filterValue
                : filterValue
                  ? [filterValue]
                  : [];
              if (values.length === 0) return true;

              const normalized = getNormalizedFilterVal(row.original, columnId);
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

            if (isUserCol) {
              const u = resolveRecordUser(record, currentTable);
              if (u) {
                const displayName = u.name
                  ? String(u.name)
                  : u.username
                    ? `@${String(u.username).replace(/^@/, '')}`
                    : String(u.email ?? '—');
                const subText =
                  u.name && u.username
                    ? `@${String(u.username).replace(/^@/, '')}`
                    : u.email
                      ? String(u.email)
                      : null;
                return (
                  <div className='flex flex-col'>
                    <span className='max-w-[180px] truncate font-medium'>{displayName}</span>
                    {subText && (
                      <span className='text-muted-foreground max-w-[180px] truncate text-xs'>
                        {subText}
                      </span>
                    )}
                  </div>
                );
              }
              return (
                <span className='text-muted-foreground font-mono text-xs'>
                  {formatCell(record.authorId)}
                </span>
              );
            }

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
              const author = resolveRecordUser(record, 'itineraries');
              const authorSub = author?.username
                ? `@${String(author.username).replace(/^@/, '')}`
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

            if (colName === 'userId' && currentTable === 'accountClaims') {
              const u =
                rel?.user && typeof rel.user === 'object'
                  ? (rel.user as Record<string, unknown>)
                  : undefined;
              if (u) {
                const displayName = u.name
                  ? String(u.name)
                  : u.username
                    ? `@${String(u.username).replace(/^@/, '')}`
                    : String(u.email ?? val ?? '—');
                const handle = u.username
                  ? `@${String(u.username).replace(/^@/, '')}`
                  : String(u.email ?? '');
                const isClaimed = Boolean(u.isClaimed);
                return (
                  <div className='flex flex-col gap-0.5'>
                    <div className='flex items-center gap-1.5'>
                      <span className='max-w-[180px] truncate font-medium'>{displayName}</span>
                      <Badge
                        variant='outline'
                        className={cn(
                          'h-4 px-1 text-[10px] font-normal',
                          isClaimed
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        )}
                      >
                        {isClaimed ? 'Aktif' : 'Kurasi'}
                      </Badge>
                    </div>
                    <span className='text-muted-foreground max-w-[200px] truncate text-xs'>
                      {handle}
                    </span>
                  </div>
                );
              }
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

            if (colName === 'itineraryId') {
              const it =
                rel?.itinerary && typeof rel.itinerary === 'object'
                  ? (rel.itinerary as Record<string, unknown>)
                  : val
                    ? itineraryByIdMap.get(String(val))
                    : undefined;
              if (it) {
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
            }

            if (colName === 'itineraryDayId') {
              const dayObj =
                rel?.day && typeof rel.day === 'object'
                  ? (rel.day as Record<string, unknown>)
                  : val
                    ? dayByIdMap.get(String(val))
                    : undefined;
              if (dayObj) {
                const itObj =
                  dayObj.itinerary && typeof dayObj.itinerary === 'object'
                    ? (dayObj.itinerary as Record<string, unknown>)
                    : dayObj.itineraryId
                      ? itineraryByIdMap.get(String(dayObj.itineraryId))
                      : undefined;
                return (
                  <div className='flex flex-col'>
                    <span className='max-w-[200px] truncate font-medium'>
                      {String(dayObj.title ?? val ?? '—')}
                    </span>
                    <span className='text-muted-foreground max-w-[200px] truncate text-xs'>
                      {itObj?.title
                        ? String(itObj.title)
                        : String(val ?? '').slice(0, 10)}
                    </span>
                  </div>
                );
              }
            }

            if (colName === 'myLinkId' && currentTable === 'activities') {
              if (!val) {
                return <span className='text-muted-foreground text-xs'>—</span>;
              }
              const mlIdStr = String(val);
              const mlObj =
                rel?.myLink && typeof rel.myLink === 'object'
                  ? (rel.myLink as Record<string, unknown>)
                  : myLinkByIdMap.get(mlIdStr);
              if (mlObj) {
                return (
                  <div className='flex flex-col gap-0.5'>
                    <div className='flex items-center gap-1.5'>
                      {Boolean(mlObj.provider) && (
                        <Badge variant='outline' className='h-4 px-1 text-[10px] font-normal'>
                          {String(mlObj.provider)}
                        </Badge>
                      )}
                      <button
                        type='button'
                        className='hover:text-primary max-w-[180px] truncate text-left font-medium hover:underline'
                        title='Cek semua Activity yang menggunakan MyLink ini'
                        onClick={() => openMyLinkUsageManager(mlIdStr, 'linked')}
                      >
                        {String(mlObj.label ?? mlIdStr)}
                      </button>
                    </div>
                    <div className='flex items-center gap-1'>
                      <code className='text-muted-foreground font-mono text-[11px]'>
                        {mlIdStr}
                      </code>
                      <button
                        type='button'
                        className='text-muted-foreground hover:text-foreground inline-flex items-center'
                        title='Salin My Link Id'
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(mlIdStr).catch(() => { });
                          toast.success('My Link Id berhasil disalin!');
                        }}
                      >
                        <Icons.copy className='size-3' />
                      </button>
                    </div>
                  </div>
                );
              }
              return (
                <div className='flex items-center gap-1'>
                  <code className='bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-xs'>
                    {mlIdStr}
                  </code>
                  <button
                    type='button'
                    className='text-muted-foreground hover:text-foreground inline-flex items-center'
                    title='Salin My Link Id'
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(mlIdStr).catch(() => { });
                      toast.success('My Link Id berhasil disalin!');
                    }}
                  >
                    <Icons.copy className='size-3' />
                  </button>
                </div>
              );
            }

            if (colName === 'usageCount' && currentTable === 'myLinks') {
              const myLinkIdStr = String(record.id ?? '');
              const usedActivities = getActivitiesForMyLink(myLinkIdStr);
              const count = usedActivities.length;
              return (
                <div className='flex flex-col items-start gap-1'>
                  <div className='flex items-center gap-1.5'>
                    <Button
                      type='button'
                      variant={count > 0 ? 'secondary' : 'outline'}
                      size='sm'
                      className='h-7 gap-1.5 px-2.5 text-xs'
                      onClick={() =>
                        openMyLinkUsageManager(myLinkIdStr, count > 0 ? 'linked' : 'add')
                      }
                    >
                      <Icons.kanban className='size-3.5' />
                      <span>{count} Activity</span>
                      <span className='text-muted-foreground text-[10px]'>
                        ({count > 0 ? 'Cek & Kelola' : '+ Pasang'})
                      </span>
                    </Button>
                  </div>
                  {count > 0 && (
                    <span className='text-muted-foreground max-w-[220px] truncate text-[11px]'>
                      {usedActivities
                        .slice(0, 2)
                        .map((a) => String(a.title ?? a.id ?? ''))
                        .join(', ')}
                      {count > 2 ? ` +${count - 2} lainnya` : ''}
                    </span>
                  )}
                </div>
              );
            }

            if (colName === 'provider' && currentTable === 'myLinks') {
              return (
                <Badge variant='outline'>
                  <Icons.link className='size-3' />
                  {formatCell(val)}
                </Badge>
              );
            }

            if (colName === 'actualUrl' && currentTable === 'myLinks' && val) {
              const urlStr = String(val);
              return (
                <a
                  href={urlStr}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary inline-flex max-w-[240px] items-center gap-1 truncate text-xs hover:underline'
                >
                  <span className='truncate'>{urlStr}</span>
                  <Icons.externalLink className='size-3 shrink-0' />
                </a>
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
                {currentTable === 'myLinks' && (
                  <>
                    <DropdownMenuItem
                      onClick={() => openMyLinkUsageManager(id, 'linked')}
                    >
                      <Icons.kanban className='mr-2 h-4 w-4' />
                      Cek & Kelola Activity ({getActivitiesForMyLink(id).length})
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openMyLinkUsageManager(id, 'add')}
                    >
                      <Icons.add className='mr-2 h-4 w-4' />
                      Pasang ke Activity
                    </DropdownMenuItem>
                  </>
                )}
                {currentTable === 'activities' && Boolean(record.myLinkId) && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        openMyLinkUsageManager(String(record.myLinkId ?? ''), 'linked')
                      }
                    >
                      <Icons.kanban className='mr-2 h-4 w-4' />
                      Cek Penggunaan MyLink Ini
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={busy}
                      onClick={() =>
                        void executeBulkAction(
                          {
                            action: 'bulkSetActivitiesMyLink',
                            activityIds: [id],
                            myLinkId: null
                          },
                          'MyLink berhasil dilepas dari Activity ini.',
                          ['activities', 'myLinks']
                        )
                      }
                    >
                      <Icons.close className='mr-2 h-4 w-4' />
                      Lepas MyLink
                    </DropdownMenuItem>
                  </>
                )}
                {(currentTable === 'myLinks' ||
                  (currentTable === 'activities' && Boolean(record.myLinkId))) && (
                    <DropdownMenuItem
                      onClick={() => {
                        const targetMyLinkId =
                          currentTable === 'myLinks' ? id : String(record.myLinkId ?? '');
                        if (!targetMyLinkId) return;
                        navigator.clipboard.writeText(targetMyLinkId).catch(() => { });
                        toast.success('My Link Id berhasil disalin!');
                      }}
                    >
                      <Icons.copy className='mr-2 h-4 w-4' />
                      Salin My Link Id
                    </DropdownMenuItem>
                  )}
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
  }, [
    currentTable,
    config.columns,
    records,
    tables.users,
    tables.myLinks,
    itineraryByIdMap,
    dayByIdMap,
    myLinkByIdMap,
    getActivitiesForMyLink,
    openMyLinkUsageManager,
    executeBulkAction,
    resolveRecordUser,
    resolveRecordUserKey,
    busy,
    handleSubscriptionChange,
    openEditSheet
  ]);

  // Auto-suggestions for search input in Itineraries, Itinerary Days, Activities, and MyLinks
  const searchSuggestions = useMemo<SearchSuggestion[]>(() => {
    if (
      currentTable !== 'itineraries' &&
      currentTable !== 'days' &&
      currentTable !== 'activities' &&
      currentTable !== 'myLinks'
    ) {
      return [];
    }

    const items: SearchSuggestion[] = [];
    const seen = new Set<string>();
    const addSuggestion = (item: SearchSuggestion) => {
      const k = `${item.category ?? ''}:${item.value.toLowerCase()}`;
      if (!item.value.trim() || seen.has(k)) return;
      seen.add(k);
      items.push(item);
    };

    // 1. User suggestions (Nama User) from records & users table
    for (const rec of records) {
      const u = resolveRecordUser(rec, currentTable);
      if (!u) continue;
      const name = u.name ? String(u.name).trim() : '';
      const username = u.username ? String(u.username).replace(/^@/, '').trim() : '';
      const email = u.email ? String(u.email).trim() : '';
      const primary = name || (username ? `@${username}` : email);
      if (!primary) continue;
      const sublabel =
        name && username ? `@${username}` : name && email ? email : username ? email : undefined;
      addSuggestion({
        label: primary,
        value: name || username || email,
        sublabel,
        category: 'Nama User'
      });
    }

    for (const u of tables.users) {
      const name = u.name ? String(u.name).trim() : '';
      const username = u.username ? String(u.username).replace(/^@/, '').trim() : '';
      const email = u.email ? String(u.email).trim() : '';
      const primary = name || (username ? `@${username}` : email);
      if (!primary) continue;
      const sublabel =
        name && username ? `@${username}` : name && email ? email : username ? email : undefined;
      addSuggestion({
        label: primary,
        value: name || username || email,
        sublabel,
        category: 'Nama User'
      });
    }

    // 2. Table-specific entity suggestions
    if (currentTable === 'itineraries') {
      for (const rec of records) {
        if (rec.title) {
          const u = resolveRecordUser(rec, 'itineraries');
          const authorName = u?.name
            ? String(u.name)
            : u?.username
              ? `@${String(u.username).replace(/^@/, '')}`
              : undefined;
          addSuggestion({
            label: String(rec.title),
            value: String(rec.title),
            sublabel: authorName,
            category: 'Itinerary'
          });
        }
        if (rec.destination) {
          addSuggestion({
            label: String(rec.destination),
            value: String(rec.destination),
            category: 'Destinasi'
          });
        }
      }
    } else if (currentTable === 'days') {
      for (const rec of records) {
        if (rec.title) {
          addSuggestion({
            label: String(rec.title),
            value: String(rec.title),
            category: 'Hari'
          });
        }
        const rel =
          rec._related && typeof rec._related === 'object'
            ? (rec._related as Record<string, unknown>)
            : undefined;
        const it =
          rel?.itinerary && typeof rel.itinerary === 'object'
            ? (rel.itinerary as Record<string, unknown>)
            : rec.itineraryId
              ? itineraryByIdMap.get(String(rec.itineraryId))
              : undefined;
        if (it?.title) {
          addSuggestion({
            label: String(it.title),
            value: String(it.title),
            category: 'Itinerary'
          });
        }
      }
    } else if (currentTable === 'activities') {
      for (const rec of records) {
        if (rec.title) {
          addSuggestion({
            label: String(rec.title),
            value: String(rec.title),
            sublabel: rec.locationName ? String(rec.locationName) : undefined,
            category: 'Aktivitas'
          });
        }
        if (rec.locationName) {
          addSuggestion({
            label: String(rec.locationName),
            value: String(rec.locationName),
            category: 'Lokasi'
          });
        }
        if (rec.myLinkId) {
          const mlId = String(rec.myLinkId);
          const ml = myLinkByIdMap.get(mlId);
          addSuggestion({
            label: ml?.label ? String(ml.label) : mlId,
            value: mlId,
            sublabel: ml?.provider ? `${String(ml.provider)} · ${mlId}` : mlId,
            category: 'My Link Id'
          });
        }
      }
    } else if (currentTable === 'myLinks') {
      for (const rec of records) {
        if (rec.label) {
          addSuggestion({
            label: String(rec.label),
            value: String(rec.label),
            sublabel: rec.provider ? String(rec.provider) : undefined,
            category: 'Label MyLink'
          });
        }
        if (rec.id) {
          addSuggestion({
            label: String(rec.id),
            value: String(rec.id),
            sublabel: rec.label ? String(rec.label) : undefined,
            category: 'My Link Id'
          });
        }
      }
    }

    return items;
  }, [currentTable, records, tables.users, resolveRecordUser, itineraryByIdMap, myLinkByIdMap]);

  const table = useReactTable({
    data: records,
    columns,
    getRowId: (row, index) => String(row.id ?? row.key ?? index),
    enableRowSelection: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
      columnPinning: { right: ['actions'] }
    },
    onRowSelectionChange: setRowSelection,
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

      const resolvedUser = resolveRecordUser(record, currentTable);
      if (resolvedUser) {
        if (resolvedUser.name && String(resolvedUser.name).toLowerCase().includes(q)) return true;
        if (resolvedUser.username && String(resolvedUser.username).toLowerCase().includes(q))
          return true;
        if (resolvedUser.email && String(resolvedUser.email).toLowerCase().includes(q)) return true;
      }

      if (record._related && typeof record._related === 'object') {
        const rel = record._related as Record<string, unknown>;

        const userEmail =
          (rel.user as Record<string, unknown>)?.email ||
          (rel.author as Record<string, unknown>)?.email;
        if (userEmail && String(userEmail).toLowerCase().includes(q)) return true;
        const itineraryObj =
          rel.itinerary && typeof rel.itinerary === 'object'
            ? (rel.itinerary as Record<string, unknown>)
            : undefined;
        if (itineraryObj?.title && String(itineraryObj.title).toLowerCase().includes(q))
          return true;

        const username =
          (rel.user as Record<string, unknown>)?.username ||
          (rel.author as Record<string, unknown>)?.username;
        if (username && String(username).toLowerCase().includes(q)) return true;

        const userName =
          (rel.user as Record<string, unknown>)?.name ||
          (rel.author as Record<string, unknown>)?.name;
        if (userName && String(userName).toLowerCase().includes(q)) return true;

        const dayObj =
          rel.day && typeof rel.day === 'object'
            ? (rel.day as Record<string, unknown>)
            : undefined;
        if (dayObj?.title && String(dayObj.title).toLowerCase().includes(q)) return true;
        const dayItineraryObj =
          dayObj?.itinerary && typeof dayObj.itinerary === 'object'
            ? (dayObj.itinerary as Record<string, unknown>)
            : undefined;
        if (dayItineraryObj?.title && String(dayItineraryObj.title).toLowerCase().includes(q))
          return true;

        const myLinkObj =
          rel.myLink && typeof rel.myLink === 'object'
            ? (rel.myLink as Record<string, unknown>)
            : record.myLinkId
              ? myLinkByIdMap.get(String(record.myLinkId))
              : undefined;
        if (myLinkObj?.label && String(myLinkObj.label).toLowerCase().includes(q)) return true;
        if (myLinkObj?.provider && String(myLinkObj.provider).toLowerCase().includes(q)) return true;
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
        let val: unknown = col === 'id' ? (record.id ?? record.key ?? '') : record[col];
        if (
          (col === 'authorId' &&
            (currentTable === 'itineraries' ||
              currentTable === 'days' ||
              currentTable === 'activities')) ||
          (col === 'userId' && currentTable === 'myLinks')
        ) {
          const u = resolveRecordUser(record, currentTable);
          val = u?.name ?? u?.username ?? u?.email ?? record[col] ?? '';
        }
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
                <Button variant='secondary' size='sm' onClick={openBulkCreateSheet}>
                  <Icons.add className='size-4' />
                  Bulk Add
                </Button>
                <Button size='sm' onClick={openCreateSheet}>
                  <Icons.add className='size-4' />
                  Add New
                </Button>
              </div>
            }
          >
            <DataTable
              key={currentTable}
              table={table}
              ariaLabel={`Tabel ${config.label}`}
              actionBar={(() => {
                const selectedRows = table.getFilteredSelectedRowModel().rows;
                const selectedIds = selectedRows
                  .map((r) => String(r.original.id ?? r.original.key ?? ''))
                  .filter(Boolean);
                if (selectedIds.length === 0) return null;

                return (
                  <div className='bg-card/95 supports-backdrop-filter:bg-card/85 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 shadow-md backdrop-blur-xs'>
                    <div className='flex items-center gap-2'>
                      <Badge variant='default'>{selectedIds.length} baris dipilih</Badge>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => setRowSelection({})}
                        disabled={busy}
                      >
                        Batal Pilih
                      </Button>
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                      {currentTable === 'activities' && (
                        <>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            disabled={busy}
                            onClick={() => {
                              setBulkSelectedMyLinkId('__none__');
                              setBulkSetMyLinkModalOpen(true);
                            }}
                          >
                            <Icons.link className='size-4' />
                            Pasang / Ubah MyLink
                          </Button>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            disabled={busy}
                            onClick={async () => {
                              const ok = await executeBulkAction(
                                {
                                  action: 'bulkSetActivitiesMyLink',
                                  activityIds: selectedIds,
                                  myLinkId: null
                                },
                                `MyLink dilepas dari ${selectedIds.length} Activity.`,
                                ['activities', 'myLinks']
                              );
                              if (ok) setRowSelection({});
                            }}
                          >
                            <Icons.close className='size-4' />
                            Lepas MyLink
                          </Button>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            disabled={busy}
                            onClick={() => {
                              setBulkEditCategory('__keep__');
                              setBulkEditModalOpen(true);
                            }}
                          >
                            <Icons.edit className='size-4' />
                            Bulk Edit Kategori
                          </Button>
                        </>
                      )}
                      {currentTable === 'myLinks' && (
                        <>
                          {selectedIds.length === 1 && (
                            <Button
                              type='button'
                              variant='secondary'
                              size='sm'
                              disabled={busy}
                              onClick={() => openMyLinkUsageManager(selectedIds[0], 'linked')}
                            >
                              <Icons.kanban className='size-4' />
                              Cek & Kelola Activity
                            </Button>
                          )}
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            disabled={busy}
                            onClick={async () => {
                              const ok = await executeBulkAction(
                                {
                                  action: 'bulkUnlinkMyLinksFromActivities',
                                  myLinkIds: selectedIds
                                },
                                `Semua Activity yang memakai ${selectedIds.length} MyLink terpilih telah dilepas.`,
                                ['myLinks', 'activities']
                              );
                              if (ok) setRowSelection({});
                            }}
                          >
                            <Icons.close className='size-4' />
                            Lepas dari Semua Activity
                          </Button>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            disabled={busy}
                            onClick={() => {
                              setBulkEditProvider('__keep__');
                              setBulkEditUserId('__keep__');
                              setBulkEditModalOpen(true);
                            }}
                          >
                            <Icons.edit className='size-4' />
                            Bulk Edit Provider / Owner
                          </Button>
                        </>
                      )}
                      <Button
                        type='button'
                        variant='destructive'
                        size='sm'
                        disabled={busy}
                        onClick={() => setBulkDeleteConfirmOpen(true)}
                      >
                        <Icons.trash className='size-4' />
                        Hapus Terpilih ({selectedIds.length})
                      </Button>
                    </div>
                  </div>
                );
              })()}
            >
              <DataTableToolbar
                table={table}
                globalFilter={globalFilter}
                onGlobalFilterChange={setGlobalFilter}
                searchPlaceholder={
                  currentTable === 'itineraries' ||
                    currentTable === 'days' ||
                    currentTable === 'activities' ||
                    currentTable === 'myLinks'
                    ? `Cari nama user, My Link Id, atau ${config.label.toLowerCase()}...`
                    : `Search ${config.label.toLowerCase()}...`
                }
                suggestions={searchSuggestions}
              />
            </DataTable>
          </PageContainer>
        )}
      </SidebarInset>

      {/* Record Create / Edit Sheet (next-shadcn user-form-sheet pattern) */}
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
            onValueChange={(val) => setEditorTab(val as 'form' | 'json' | 'bulk')}
            className='flex min-h-0 flex-1 flex-col overflow-hidden'
          >
            <TabsList className='w-full shrink-0'>
              <TabsTrigger value='form' className='flex-1'>
                <Icons.forms className='size-4' />
                Form (Satu)
              </TabsTrigger>
              {editorMode === 'create' && (
                <TabsTrigger value='bulk' className='flex-1'>
                  <Icons.add className='size-4' />
                  Bulk Add
                </TabsTrigger>
              )}
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
                          {currentTable === 'myLinks' && editorMode === 'edit' && editingId && (
                            <div className='space-y-2 rounded-lg border p-3'>
                              <div className='flex items-center justify-between gap-2'>
                                <Label>My Link Id & Penggunaan Activity</Label>
                                <Button
                                  type='button'
                                  variant='secondary'
                                  size='sm'
                                  className='h-7 text-xs'
                                  onClick={() => {
                                    setSheetOpen(false);
                                    openMyLinkUsageManager(editingId, 'linked');
                                  }}
                                >
                                  <Icons.kanban className='size-3.5' />
                                  Cek & Kelola Activity ({getActivitiesForMyLink(editingId).length})
                                </Button>
                              </div>
                              <div className='flex items-center gap-2'>
                                <Input
                                  type='text'
                                  value={editingId}
                                  readOnly
                                  className='font-mono text-xs'
                                />
                                <Button
                                  type='button'
                                  variant='outline'
                                  size='icon'
                                  title='Salin My Link Id'
                                  onClick={() => {
                                    navigator.clipboard.writeText(editingId).catch(() => { });
                                    toast.success('My Link Id berhasil disalin!');
                                  }}
                                >
                                  <Icons.copy className='size-4' />
                                </Button>
                              </div>
                            </div>
                          )}
                          {formFields.map((key) => {
                            const value = parsedDraft[key];
                            const labelText = formatLabel(key);

                            if (currentTable === 'activities' && key === 'myLinkId') {
                              const currentMyLinkId =
                                value !== null && value !== undefined && String(value) !== ''
                                  ? String(value)
                                  : '__none__';
                              const myLinkSelectItems = [
                                { value: '__none__', label: '-- Tanpa MyLink (Kosong) --' },
                                ...(tables.myLinks ?? []).map((ml) => {
                                  const mlId = String(ml.id ?? '');
                                  const mlLabel = String(ml.label ?? mlId);
                                  const mlProvider = ml.provider ? `[${String(ml.provider)}] ` : '';
                                  const owner = resolveRecordUser(ml, 'myLinks');
                                  const ownerName = owner?.username
                                    ? ` · @${String(owner.username).replace(/^@/, '')}`
                                    : owner?.name
                                      ? ` · ${String(owner.name)}`
                                      : '';
                                  return {
                                    value: mlId,
                                    label: `${mlProvider}${mlLabel}${ownerName} (${mlId})`
                                  };
                                })
                              ];

                              return (
                                <div key={key} className='space-y-2'>
                                  <Label htmlFor={`form-field-${key}`}>My Link Id</Label>
                                  <Select
                                    items={myLinkSelectItems}
                                    value={
                                      myLinkSelectItems.some((item) => item.value === currentMyLinkId)
                                        ? currentMyLinkId
                                        : '__none__'
                                    }
                                    onValueChange={(val) => {
                                      updateDraftField(
                                        key,
                                        !val || val === '__none__' ? null : val
                                      );
                                    }}
                                  >
                                    <SelectTrigger id={`form-field-${key}-select`} className='w-full'>
                                      <SelectValue placeholder='Pilih dari daftar MyLink...' />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {myLinkSelectItems.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    id={`form-field-${key}`}
                                    type='text'
                                    placeholder='Atau masukkan My Link Id secara langsung (kosongkan jika tanpa link)'
                                    className='font-mono text-xs'
                                    value={
                                      value !== null && value !== undefined ? String(value) : ''
                                    }
                                    onChange={(e) =>
                                      updateDraftField(
                                        key,
                                        e.target.value.trim() === '' ? null : e.target.value
                                      )
                                    }
                                  />
                                </div>
                              );
                            }

                            if (currentTable === 'myLinks' && key === 'provider') {
                              return (
                                <div key={key} className='space-y-2'>
                                  <Label htmlFor={`form-field-${key}`}>Provider</Label>
                                  <Select
                                    items={MYLINK_PROVIDER_OPTIONS}
                                    value={String(value || 'Custom')}
                                    onValueChange={(val) => {
                                      if (val) updateDraftField(key, val);
                                    }}
                                  >
                                    <SelectTrigger id={`form-field-${key}`} className='w-full'>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {MYLINK_PROVIDER_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            }

                            if (currentTable === 'myLinks' && key === 'userId') {
                              const userSelectItems = tables.users.map((u) => {
                                const uId = String(u.id ?? '');
                                const uName = u.name ? String(u.name) : '';
                                const uHandle = u.username
                                  ? `@${String(u.username).replace(/^@/, '')}`
                                  : String(u.email ?? '');
                                return {
                                  value: uId,
                                  label: `${uName ? `${uName} (${uHandle})` : uHandle} — ${uId}`
                                };
                              });

                              return (
                                <div key={key} className='space-y-2'>
                                  <Label htmlFor={`form-field-${key}`}>User (Pemilik MyLink)</Label>
                                  <Select
                                    items={userSelectItems}
                                    value={String(value ?? '')}
                                    onValueChange={(val) => {
                                      if (val) updateDraftField(key, val);
                                    }}
                                  >
                                    <SelectTrigger id={`form-field-${key}-select`} className='w-full'>
                                      <SelectValue placeholder='Pilih pengguna...' />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {userSelectItems.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    id={`form-field-${key}`}
                                    type='text'
                                    placeholder='User ID'
                                    className='font-mono text-xs'
                                    value={
                                      value !== null && value !== undefined ? String(value) : ''
                                    }
                                    onChange={(e) => updateDraftField(key, e.target.value)}
                                  />
                                </div>
                              );
                            }

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

                    <TabsContent value='bulk' className='flex-none space-y-4 pb-4'>
                      {currentTable === 'myLinks' ? (
                        <div className='space-y-4'>
                          <div className='space-y-2'>
                            <Label>User (Pemilik untuk Semua Baris MyLink)</Label>
                            {(() => {
                              const userSelectItems = tables.users.map((u) => {
                                const uId = String(u.id ?? '');
                                const uName = u.name ? String(u.name) : '';
                                const uHandle = u.username
                                  ? `@${String(u.username).replace(/^@/, '')}`
                                  : String(u.email ?? '');
                                return {
                                  value: uId,
                                  label: `${uName ? `${uName} (${uHandle})` : uHandle} — ${uId}`
                                };
                              });
                              return (
                                <Select
                                  items={userSelectItems}
                                  value={bulkMyLinkUserId}
                                  onValueChange={(val) => {
                                    if (val) setBulkMyLinkUserId(val);
                                  }}
                                >
                                  <SelectTrigger className='w-full'>
                                    <SelectValue placeholder='Pilih pengguna pemilik MyLink...' />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {userSelectItems.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              );
                            })()}
                            <Input
                              type='text'
                              placeholder='Atau masukkan User ID secara langsung...'
                              className='font-mono text-xs'
                              value={bulkMyLinkUserId}
                              onChange={(e) => setBulkMyLinkUserId(e.target.value)}
                            />
                          </div>

                          <div className='space-y-2 rounded-lg border p-3'>
                            <div className='flex items-center justify-between'>
                              <Label className='text-xs'>
                                Impor Cepat dari Teks (Format per baris: <code>Label | URL | Provider</code>)
                              </Label>
                              <Button
                                type='button'
                                variant='secondary'
                                size='sm'
                                className='h-7 text-xs'
                                onClick={() => {
                                  const lines = bulkPasteText
                                    .split('\n')
                                    .map((l) => l.trim())
                                    .filter(Boolean);
                                  if (lines.length === 0) {
                                    toast.error('Tempelkan minimal 1 baris teks terlebih dahulu.');
                                    return;
                                  }
                                  const parsedRows = lines.map((line) => {
                                    const parts = line.includes('|')
                                      ? line.split('|').map((p) => p.trim())
                                      : line.split('\t').map((p) => p.trim());
                                    return {
                                      label: parts[0] || 'Link',
                                      actualUrl: parts[1] || parts[0] || '',
                                      provider: parts[2] || 'Klook'
                                    };
                                  });
                                  setBulkMyLinkRows(parsedRows);
                                  toast.success(`${parsedRows.length} baris berhasil diimpor ke daftar.`);
                                }}
                              >
                                Impor ke Baris
                              </Button>
                            </div>
                            <Textarea
                              rows={3}
                              className='font-mono text-xs'
                              placeholder={`Tiket USJ Express | https://www.klook.com/id/... | Klook\nJR Pass 7 Hari | https://www.traveloka.com/... | Traveloka`}
                              value={bulkPasteText}
                              onChange={(e) => setBulkPasteText(e.target.value)}
                            />
                          </div>

                          <div className='space-y-2'>
                            <div className='flex items-center justify-between'>
                              <Label>Daftar Baris MyLink ({bulkMyLinkRows.length})</Label>
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                className='h-7 text-xs'
                                onClick={() =>
                                  setBulkMyLinkRows((prev) => [
                                    ...prev,
                                    { label: '', actualUrl: '', provider: 'Klook' }
                                  ])
                                }
                              >
                                <Icons.add className='size-3.5' />
                                Tambah Baris
                              </Button>
                            </div>
                            <div className='space-y-2'>
                              {bulkMyLinkRows.map((row, idx) => (
                                <div
                                  key={idx}
                                  className='bg-muted/30 grid grid-cols-1 gap-2 rounded-lg border p-2.5 sm:grid-cols-12'
                                >
                                  <div className='sm:col-span-4'>
                                    <Input
                                      placeholder='Label (mis: Tiket USJ)'
                                      value={row.label}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setBulkMyLinkRows((prev) =>
                                          prev.map((r, i) => (i === idx ? { ...r, label: val } : r))
                                        );
                                      }}
                                    />
                                  </div>
                                  <div className='sm:col-span-5'>
                                    <Input
                                      placeholder='https://...'
                                      value={row.actualUrl}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setBulkMyLinkRows((prev) =>
                                          prev.map((r, i) =>
                                            i === idx ? { ...r, actualUrl: val } : r
                                          )
                                        );
                                      }}
                                    />
                                  </div>
                                  <div className='flex items-center gap-1 sm:col-span-3'>
                                    <Select
                                      items={MYLINK_PROVIDER_OPTIONS}
                                      value={row.provider}
                                      onValueChange={(val) => {
                                        if (!val) return;
                                        setBulkMyLinkRows((prev) =>
                                          prev.map((r, i) =>
                                            i === idx ? { ...r, provider: val } : r
                                          )
                                        );
                                      }}
                                    >
                                      <SelectTrigger className='w-full'>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {MYLINK_PROVIDER_OPTIONS.map((opt) => (
                                          <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='icon'
                                      className='h-8 w-8 shrink-0'
                                      disabled={bulkMyLinkRows.length <= 1}
                                      onClick={() =>
                                        setBulkMyLinkRows((prev) =>
                                          prev.filter((_, i) => i !== idx)
                                        )
                                      }
                                    >
                                      <Icons.trash className='size-3.5' />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : currentTable === 'activities' ? (
                        <div className='space-y-4'>
                          <div className='space-y-2'>
                            <Label>Itinerary Day (Tujuan untuk Semua Activity)</Label>
                            {(() => {
                              const daySelectItems = tables.days.map((d) => {
                                const dId = String(d.id ?? '');
                                const dTitle = String(d.title ?? `Day ${d.dayNumber ?? ''}`);
                                const itObj = d.itineraryId
                                  ? itineraryByIdMap.get(String(d.itineraryId))
                                  : undefined;
                                const itTitle = itObj?.title ? `${String(itObj.title)} — ` : '';
                                return {
                                  value: dId,
                                  label: `${itTitle}${dTitle} (${dId})`
                                };
                              });
                              return (
                                <Select
                                  items={daySelectItems}
                                  value={bulkActivityDayId}
                                  onValueChange={(val) => {
                                    if (val) setBulkActivityDayId(val);
                                  }}
                                >
                                  <SelectTrigger className='w-full'>
                                    <SelectValue placeholder='Pilih Itinerary Day...' />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {daySelectItems.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              );
                            })()}
                            <Input
                              type='text'
                              placeholder='Atau masukkan Itinerary Day ID secara langsung...'
                              className='font-mono text-xs'
                              value={bulkActivityDayId}
                              onChange={(e) => setBulkActivityDayId(e.target.value)}
                            />
                          </div>

                          <div className='space-y-2'>
                            <Label>Pasang MyLink ke Semua Activity Ini (Opsional)</Label>
                            {(() => {
                              const myLinkSelectItems = [
                                { value: '__none__', label: '-- Tanpa MyLink (Kosong) --' },
                                ...(tables.myLinks ?? []).map((ml) => ({
                                  value: String(ml.id ?? ''),
                                  label: `[${String(ml.provider ?? 'Custom')}] ${String(ml.label ?? ml.id)} (${String(ml.id)})`
                                }))
                              ];
                              return (
                                <Select
                                  items={myLinkSelectItems}
                                  value={bulkActivityMyLinkId}
                                  onValueChange={(val) => {
                                    if (val) setBulkActivityMyLinkId(val);
                                  }}
                                >
                                  <SelectTrigger className='w-full'>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {myLinkSelectItems.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              );
                            })()}
                          </div>

                          <div className='space-y-2'>
                            <div className='flex items-center justify-between'>
                              <Label>Daftar Baris Activity ({bulkActivityRows.length})</Label>
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                className='h-7 text-xs'
                                onClick={() =>
                                  setBulkActivityRows((prev) => [
                                    ...prev,
                                    {
                                      time: '14:00',
                                      title: '',
                                      locationName: '',
                                      category: 'wisata',
                                      estimatedCost: 0
                                    }
                                  ])
                                }
                              >
                                <Icons.add className='size-3.5' />
                                Tambah Baris
                              </Button>
                            </div>
                            <div className='space-y-2'>
                              {bulkActivityRows.map((row, idx) => (
                                <div
                                  key={idx}
                                  className='bg-muted/30 space-y-2 rounded-lg border p-2.5'
                                >
                                  <div className='grid grid-cols-1 gap-2 sm:grid-cols-12'>
                                    <div className='sm:col-span-3'>
                                      <Input
                                        placeholder='09:00'
                                        value={row.time}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setBulkActivityRows((prev) =>
                                            prev.map((r, i) =>
                                              i === idx ? { ...r, time: val } : r
                                            )
                                          );
                                        }}
                                      />
                                    </div>
                                    <div className='sm:col-span-5'>
                                      <Input
                                        placeholder='Judul Activity'
                                        value={row.title}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setBulkActivityRows((prev) =>
                                            prev.map((r, i) =>
                                              i === idx ? { ...r, title: val } : r
                                            )
                                          );
                                        }}
                                      />
                                    </div>
                                    <div className='flex items-center gap-1 sm:col-span-4'>
                                      <Input
                                        placeholder='Nama Lokasi'
                                        value={row.locationName}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setBulkActivityRows((prev) =>
                                            prev.map((r, i) =>
                                              i === idx ? { ...r, locationName: val } : r
                                            )
                                          );
                                        }}
                                      />
                                      <Button
                                        type='button'
                                        variant='ghost'
                                        size='icon'
                                        className='h-8 w-8 shrink-0'
                                        disabled={bulkActivityRows.length <= 1}
                                        onClick={() =>
                                          setBulkActivityRows((prev) =>
                                            prev.filter((_, i) => i !== idx)
                                          )
                                        }
                                      >
                                        <Icons.trash className='size-3.5' />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className='space-y-3'>
                          <Label>JSON Array untuk Bulk Create ({config.label})</Label>
                          <Textarea
                            className='min-h-[340px] font-mono text-xs leading-relaxed'
                            value={bulkJsonDraft}
                            onChange={(e) => setBulkJsonDraft(e.target.value)}
                            spellCheck={false}
                          />
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
                    Anda dapat menambahkan data satu-per-satu melalui <b>Form (Satu)</b> atau sekaligus
                    banyak melalui tab <b>Bulk Add</b>.
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
            {editorMode === 'create' && editorTab === 'bulk' ? (
              <Button type='button' onClick={handleBulkCreate} isLoading={busy}>
                <Icons.check className='size-4' />
                Simpan Bulk {config.label}
              </Button>
            ) : (
              <Button type='button' onClick={handleSave} isLoading={busy}>
                <Icons.check className='size-4' />
                {editorMode === 'create' ? 'Create Record' : 'Update Record'}
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation AlertModal (next-shadcn pattern) */}
      <AlertModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        loading={busy}
      />

      {/* Approve Claim Modal */}
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

      {/* Setup URL Result Modal */}
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

      {/* Reject Claim Modal */}
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

      {/* Impersonate Confirmation Modal */}
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

      {/* Bulk Delete Confirmation Modal */}
      <AlertModal
        isOpen={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        loading={busy}
        onConfirm={async () => {
          const selectedIds = table
            .getFilteredSelectedRowModel()
            .rows.map((r) => String(r.original.id ?? r.original.key ?? ''))
            .filter(Boolean);
          if (selectedIds.length === 0) {
            setBulkDeleteConfirmOpen(false);
            return;
          }
          const refreshList: AdminTable[] =
            currentTable === 'myLinks' || currentTable === 'activities'
              ? ['myLinks', 'activities']
              : [currentTable];
          const ok = await executeBulkAction(
            { action: 'bulkDelete', table: currentTable, ids: selectedIds },
            `${selectedIds.length} record ${config.label} berhasil dihapus.`,
            refreshList
          );
          if (ok) {
            setRowSelection({});
            setBulkDeleteConfirmOpen(false);
          }
        }}
      />

      {/* Bulk Set / Change MyLink Modal for Selected Activities */}
      <Modal
        title='Pasang / Ubah MyLink secara Bulk'
        description={`Pilih MyLink yang ingin dipasang ke ${table.getFilteredSelectedRowModel().rows.length} Activity terpilih.`}
        isOpen={bulkSetMyLinkModalOpen}
        onClose={() => setBulkSetMyLinkModalOpen(false)}
      >
        <div className='space-y-4 pt-2'>
          <div className='space-y-2'>
            <Label>Pilih MyLink</Label>
            {(() => {
              const myLinkSelectItems = [
                { value: '__none__', label: '-- Lepas MyLink (Kosongkan) --' },
                ...(tables.myLinks ?? []).map((ml) => {
                  const mlId = String(ml.id ?? '');
                  const mlLabel = String(ml.label ?? mlId);
                  const mlProvider = ml.provider ? `[${String(ml.provider)}] ` : '';
                  return {
                    value: mlId,
                    label: `${mlProvider}${mlLabel} (${mlId})`
                  };
                })
              ];
              return (
                <Select
                  items={myLinkSelectItems}
                  value={bulkSelectedMyLinkId}
                  onValueChange={(val) => {
                    if (val) setBulkSelectedMyLinkId(val);
                  }}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Pilih MyLink...' />
                  </SelectTrigger>
                  <SelectContent>
                    {myLinkSelectItems.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            })()}
          </div>
          <div className='flex justify-end gap-2 pt-2'>
            <Button
              variant='outline'
              onClick={() => setBulkSetMyLinkModalOpen(false)}
              disabled={busy}
            >
              Batal
            </Button>
            <Button
              isLoading={busy}
              onClick={async () => {
                const selectedIds = table
                  .getFilteredSelectedRowModel()
                  .rows.map((r) => String(r.original.id ?? ''))
                  .filter(Boolean);
                if (selectedIds.length === 0) return;
                const targetMyLink =
                  bulkSelectedMyLinkId === '__none__' ? null : bulkSelectedMyLinkId;
                const ok = await executeBulkAction(
                  {
                    action: 'bulkSetActivitiesMyLink',
                    activityIds: selectedIds,
                    myLinkId: targetMyLink
                  },
                  targetMyLink
                    ? `MyLink berhasil dipasang ke ${selectedIds.length} Activity.`
                    : `MyLink berhasil dilepas dari ${selectedIds.length} Activity.`,
                  ['activities', 'myLinks']
                );
                if (ok) {
                  setRowSelection({});
                  setBulkSetMyLinkModalOpen(false);
                }
              }}
            >
              <Icons.check className='size-4' />
              Terapkan ke {table.getFilteredSelectedRowModel().rows.length} Activity
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Edit Modal for MyLinks / Activities */}
      <Modal
        title={`Bulk Edit ${config.label}`}
        description={`Perbarui field sekaligus untuk ${table.getFilteredSelectedRowModel().rows.length} baris terpilih.`}
        isOpen={bulkEditModalOpen}
        onClose={() => setBulkEditModalOpen(false)}
      >
        <div className='space-y-4 pt-2'>
          {currentTable === 'myLinks' && (
            <>
              <div className='space-y-2'>
                <Label>Ubah Provider</Label>
                <Select
                  items={[
                    { value: '__keep__', label: '-- Jangan Ubah Provider --' },
                    ...MYLINK_PROVIDER_OPTIONS
                  ]}
                  value={bulkEditProvider}
                  onValueChange={(val) => {
                    if (val) setBulkEditProvider(val);
                  }}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='__keep__'>-- Jangan Ubah Provider --</SelectItem>
                    {MYLINK_PROVIDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Ubah Pemilik (User)</Label>
                {(() => {
                  const userOpts = [
                    { value: '__keep__', label: '-- Jangan Ubah User --' },
                    ...tables.users.map((u) => ({
                      value: String(u.id ?? ''),
                      label: `${String(u.name ?? u.username ?? u.email ?? u.id)} (${String(u.id)})`
                    }))
                  ];
                  return (
                    <Select
                      items={userOpts}
                      value={bulkEditUserId}
                      onValueChange={(val) => {
                        if (val) setBulkEditUserId(val);
                      }}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {userOpts.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </div>
            </>
          )}

          {currentTable === 'activities' && (
            <div className='space-y-2'>
              <Label>Ubah Kategori Activity</Label>
              <Select
                items={[
                  { value: '__keep__', label: '-- Jangan Ubah Kategori --' },
                  ...ACTIVITY_CATEGORY_OPTIONS
                ]}
                value={bulkEditCategory}
                onValueChange={(val) => {
                  if (val) setBulkEditCategory(val);
                }}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='__keep__'>-- Jangan Ubah Kategori --</SelectItem>
                  {ACTIVITY_CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className='flex justify-end gap-2 pt-2'>
            <Button variant='outline' onClick={() => setBulkEditModalOpen(false)} disabled={busy}>
              Batal
            </Button>
            <Button
              isLoading={busy}
              onClick={async () => {
                const selectedIds = table
                  .getFilteredSelectedRowModel()
                  .rows.map((r) => String(r.original.id ?? ''))
                  .filter(Boolean);
                if (selectedIds.length === 0) return;

                const patchData: Record<string, unknown> = {};
                if (currentTable === 'myLinks') {
                  if (bulkEditProvider !== '__keep__') patchData.provider = bulkEditProvider;
                  if (bulkEditUserId !== '__keep__') patchData.userId = bulkEditUserId;
                } else if (currentTable === 'activities') {
                  if (bulkEditCategory !== '__keep__') patchData.category = bulkEditCategory;
                }

                if (Object.keys(patchData).length === 0) {
                  toast.error('Pilih minimal 1 field yang ingin diubah.');
                  return;
                }

                const ok = await executeBulkAction(
                  {
                    action: 'bulkUpdate',
                    table: currentTable,
                    ids: selectedIds,
                    data: patchData
                  },
                  `${selectedIds.length} record ${config.label} berhasil diperbarui.`,
                  currentTable === 'myLinks' || currentTable === 'activities'
                    ? ['myLinks', 'activities']
                    : [currentTable]
                );
                if (ok) {
                  setRowSelection({});
                  setBulkEditModalOpen(false);
                }
              }}
            >
              <Icons.check className='size-4' />
              Simpan Perubahan Bulk
            </Button>
          </div>
        </div>
      </Modal>

      {/* MyLink Activity Usage Manager Sheet (Cek, Edit, Hapus/Lepas, & Pasang Satu-Satu atau Bulk) */}
      <Sheet
        open={Boolean(managingMyLinkId)}
        onOpenChange={(open) => {
          if (!open) setManagingMyLinkId(null);
        }}
      >
        <SheetContent className='flex h-full max-h-dvh flex-col overflow-hidden sm:max-w-2xl'>
          {(() => {
            const activeMyLinkId = managingMyLinkId ?? '';
            const mlRecord = myLinkByIdMap.get(activeMyLinkId);
            const mlOwner = mlRecord ? resolveRecordUser(mlRecord, 'myLinks') : undefined;
            const allLinkedActivities = getActivitiesForMyLink(activeMyLinkId);

            const resolveActivityContext = (act: Record<string, unknown>) => {
              const rel =
                act._related && typeof act._related === 'object'
                  ? (act._related as Record<string, unknown>)
                  : undefined;
              const dayObj =
                rel?.day && typeof rel.day === 'object'
                  ? (rel.day as Record<string, unknown>)
                  : act.itineraryDayId
                    ? dayByIdMap.get(String(act.itineraryDayId))
                    : undefined;
              const itObj =
                dayObj?.itinerary && typeof dayObj.itinerary === 'object'
                  ? (dayObj.itinerary as Record<string, unknown>)
                  : dayObj?.itineraryId
                    ? itineraryByIdMap.get(String(dayObj.itineraryId))
                    : undefined;
              const authorObj = resolveRecordUser(act, 'activities');
              return {
                dayTitle: dayObj?.title
                  ? String(dayObj.title)
                  : dayObj?.dayNumber
                    ? `Day ${String(dayObj.dayNumber)}`
                    : String(act.itineraryDayId ?? '—'),
                itineraryId: itObj?.id ? String(itObj.id) : dayObj?.itineraryId ? String(dayObj.itineraryId) : '',
                itineraryTitle: itObj?.title ? String(itObj.title) : '—',
                authorLabel: authorObj?.name
                  ? String(authorObj.name)
                  : authorObj?.username
                    ? `@${String(authorObj.username).replace(/^@/, '')}`
                    : authorObj?.email
                      ? String(authorObj.email)
                      : '—'
              };
            };

            const filteredLinkedActivities = allLinkedActivities.filter((act) => {
              const q = linkedSearch.toLowerCase().trim();
              if (!q) return true;
              const ctx = resolveActivityContext(act);
              return (
                String(act.title ?? '').toLowerCase().includes(q) ||
                String(act.locationName ?? '').toLowerCase().includes(q) ||
                String(act.id ?? '').toLowerCase().includes(q) ||
                ctx.dayTitle.toLowerCase().includes(q) ||
                ctx.itineraryTitle.toLowerCase().includes(q) ||
                ctx.authorLabel.toLowerCase().includes(q)
              );
            });

            const candidateActivities = (tables.activities ?? []).filter((act) => {
              const actId = String(act.id ?? '');
              if (!actId) return false;
              if (String(act.myLinkId ?? '') === activeMyLinkId) return false;
              if (addActivityOnlyUnlinked && Boolean(act.myLinkId)) return false;

              const ctx = resolveActivityContext(act);
              if (
                addActivityItineraryFilter !== '__all__' &&
                ctx.itineraryId !== addActivityItineraryFilter
              ) {
                return false;
              }

              const q = addActivitySearch.toLowerCase().trim();
              if (!q) return true;
              return (
                String(act.title ?? '').toLowerCase().includes(q) ||
                String(act.locationName ?? '').toLowerCase().includes(q) ||
                actId.toLowerCase().includes(q) ||
                ctx.dayTitle.toLowerCase().includes(q) ||
                ctx.itineraryTitle.toLowerCase().includes(q) ||
                ctx.authorLabel.toLowerCase().includes(q)
              );
            });

            const otherMyLinkOptions = [
              { value: '__none__', label: '-- Pilih MyLink Tujuan --' },
              ...(tables.myLinks ?? [])
                .filter((m) => String(m.id ?? '') !== activeMyLinkId)
                .map((m) => ({
                  value: String(m.id ?? ''),
                  label: `[${String(m.provider ?? 'Custom')}] ${String(m.label ?? m.id)} (${String(m.id)})`
                }))
            ];

            const itineraryFilterOptions = [
              { value: '__all__', label: 'Semua Itinerary' },
              ...tables.itineraries.map((it) => ({
                value: String(it.id ?? ''),
                label: `${String(it.title ?? it.id)} (${String(it.destination ?? '')})`
              }))
            ];

            return (
              <>
                <SheetHeader className='shrink-0 space-y-2 border-b pb-3'>
                  <div className='flex items-start justify-between gap-2 pr-6'>
                    <div>
                      <SheetTitle className='flex items-center gap-2 text-base'>
                        <Icons.link className='size-4' />
                        <span>
                          {mlRecord?.label ? String(mlRecord.label) : 'Kelola Penggunaan MyLink'}
                        </span>
                        {Boolean(mlRecord?.provider) && (
                          <Badge variant='outline'>{String(mlRecord?.provider)}</Badge>
                        )}
                      </SheetTitle>
                      <SheetDescription className='mt-1 text-xs'>
                        Cek dipakai di Activity mana saja, lepas/hapus, edit, atau pasang ke Activity
                        baru secara satu-per-satu maupun bulk.
                      </SheetDescription>
                    </div>
                  </div>

                  <div className='bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='text-muted-foreground'>My Link Id:</span>
                      <code className='bg-background rounded border px-1.5 py-0.5 font-mono text-xs'>
                        {activeMyLinkId}
                      </code>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='h-6 w-6'
                        title='Salin My Link Id'
                        onClick={() => {
                          navigator.clipboard.writeText(activeMyLinkId).catch(() => { });
                          toast.success('My Link Id berhasil disalin!');
                        }}
                      >
                        <Icons.copy className='size-3' />
                      </Button>
                      {mlOwner && (
                        <span className='text-muted-foreground'>
                          · Owner:{' '}
                          <b className='text-foreground'>
                            {String(mlOwner.name ?? mlOwner.username ?? mlOwner.email ?? '')}
                          </b>
                        </span>
                      )}
                    </div>
                    <div className='flex items-center gap-1.5'>
                      {Boolean(mlRecord?.actualUrl) && (
                        <a
                          href={String(mlRecord?.actualUrl)}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary inline-flex items-center gap-1 hover:underline'
                        >
                          <span>Buka URL</span>
                          <Icons.externalLink className='size-3' />
                        </a>
                      )}
                      {mlRecord && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          className='h-7 text-xs'
                          onClick={() => {
                            setManagingMyLinkId(null);
                            setCurrentTable('myLinks');
                            setActiveView('myLinks');
                            openEditSheet(activeMyLinkId, mlRecord);
                          }}
                        >
                          <Icons.edit className='size-3' />
                          Edit MyLink
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetHeader>

                <Tabs
                  value={usageTab}
                  onValueChange={(val) => setUsageTab(val as 'linked' | 'add')}
                  className='mt-2 flex min-h-0 flex-1 flex-col overflow-hidden'
                >
                  <TabsList className='w-full shrink-0'>
                    <TabsTrigger value='linked' className='flex-1'>
                      <Icons.kanban className='size-4' />
                      Digunakan di Activity ({allLinkedActivities.length})
                    </TabsTrigger>
                    <TabsTrigger value='add' className='flex-1'>
                      <Icons.add className='size-4' />
                      Pasang ke Activity (Satu / Bulk)
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB 1: LINKED ACTIVITIES */}
                  <TabsContent
                    value='linked'
                    className='mt-3 flex min-h-0 flex-1 flex-col space-y-3 overflow-hidden'
                  >
                    <div className='flex shrink-0 flex-wrap items-center justify-between gap-2'>
                      <Input
                        placeholder='Cari judul activity, lokasi, itinerary, atau user...'
                        value={linkedSearch}
                        onChange={(e) => setLinkedSearch(e.target.value)}
                        className='h-8 flex-1 text-xs'
                      />
                      {allLinkedActivities.length > 0 && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          className='h-8 text-xs'
                          disabled={busy}
                          onClick={async () => {
                            const allIds = allLinkedActivities
                              .map((a) => String(a.id ?? ''))
                              .filter(Boolean);
                            const ok = await executeBulkAction(
                              {
                                action: 'bulkSetActivitiesMyLink',
                                activityIds: allIds,
                                myLinkId: null
                              },
                              `MyLink berhasil dilepas dari semua (${allIds.length}) Activity.`,
                              ['activities', 'myLinks']
                            );
                            if (ok) setSelectedLinkedActivityIds([]);
                          }}
                        >
                          <Icons.close className='size-3.5' />
                          Lepas Semua ({allLinkedActivities.length})
                        </Button>
                      )}
                    </div>

                    {filteredLinkedActivities.length > 0 && (
                      <div className='bg-muted/30 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs'>
                        <label className='flex cursor-pointer items-center gap-2 font-medium'>
                          <Checkbox
                            checked={
                              filteredLinkedActivities.length > 0 &&
                              filteredLinkedActivities.every((a) =>
                                selectedLinkedActivityIds.includes(String(a.id ?? ''))
                              )
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLinkedActivityIds(
                                  filteredLinkedActivities
                                    .map((a) => String(a.id ?? ''))
                                    .filter(Boolean)
                                );
                              } else {
                                setSelectedLinkedActivityIds([]);
                              }
                            }}
                          />
                          <span>
                            Pilih Semua ({selectedLinkedActivityIds.length}/
                            {filteredLinkedActivities.length} terpilih)
                          </span>
                        </label>

                        {selectedLinkedActivityIds.length > 0 && (
                          <div className='flex flex-wrap items-center gap-1.5'>
                            <Button
                              type='button'
                              variant='secondary'
                              size='sm'
                              className='h-7 text-xs'
                              disabled={busy}
                              onClick={async () => {
                                const ok = await executeBulkAction(
                                  {
                                    action: 'bulkSetActivitiesMyLink',
                                    activityIds: selectedLinkedActivityIds,
                                    myLinkId: null
                                  },
                                  `MyLink dilepas dari ${selectedLinkedActivityIds.length} Activity terpilih.`,
                                  ['activities', 'myLinks']
                                );
                                if (ok) setSelectedLinkedActivityIds([]);
                              }}
                            >
                              <Icons.close className='size-3.5' />
                              Lepas Link ({selectedLinkedActivityIds.length})
                            </Button>
                            <Button
                              type='button'
                              variant='destructive'
                              size='sm'
                              className='h-7 text-xs'
                              disabled={busy}
                              onClick={async () => {
                                const ok = await executeBulkAction(
                                  {
                                    action: 'bulkDelete',
                                    table: 'activities',
                                    ids: selectedLinkedActivityIds
                                  },
                                  `${selectedLinkedActivityIds.length} Activity berhasil dihapus permanen.`,
                                  ['activities', 'myLinks']
                                );
                                if (ok) setSelectedLinkedActivityIds([]);
                              }}
                            >
                              <Icons.trash className='size-3.5' />
                              Hapus Activity ({selectedLinkedActivityIds.length})
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedLinkedActivityIds.length > 0 && otherMyLinkOptions.length > 1 && (
                      <div className='bg-muted/20 flex shrink-0 flex-wrap items-center gap-2 rounded-lg border p-2.5 text-xs'>
                        <span className='font-medium'>
                          Bulk Edit / Pindahkan {selectedLinkedActivityIds.length} Activity ke:
                        </span>
                        <div className='min-w-[200px] flex-1'>
                          <Select
                            items={otherMyLinkOptions}
                            value={reassignTargetMyLinkId}
                            onValueChange={(val) => {
                              if (val) setReassignTargetMyLinkId(val);
                            }}
                          >
                            <SelectTrigger className='h-8 w-full text-xs'>
                              <SelectValue placeholder='Pilih MyLink tujuan...' />
                            </SelectTrigger>
                            <SelectContent>
                              {otherMyLinkOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type='button'
                          size='sm'
                          className='h-8 text-xs'
                          disabled={busy || reassignTargetMyLinkId === '__none__'}
                          onClick={async () => {
                            if (!reassignTargetMyLinkId || reassignTargetMyLinkId === '__none__')
                              return;
                            const ok = await executeBulkAction(
                              {
                                action: 'bulkSetActivitiesMyLink',
                                activityIds: selectedLinkedActivityIds,
                                myLinkId: reassignTargetMyLinkId
                              },
                              `${selectedLinkedActivityIds.length} Activity berhasil dipindahkan ke MyLink baru.`,
                              ['activities', 'myLinks']
                            );
                            if (ok) {
                              setSelectedLinkedActivityIds([]);
                              setReassignTargetMyLinkId('__none__');
                            }
                          }}
                        >
                          <Icons.check className='size-3.5' />
                          Pindahkan
                        </Button>
                      </div>
                    )}

                    <div className='-mr-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-2 pb-4'>
                      {filteredLinkedActivities.length === 0 ? (
                        <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center text-xs'>
                          <Icons.kanban className='mb-2 size-8 opacity-40' />
                          <p className='font-medium'>
                            {allLinkedActivities.length === 0
                              ? 'MyLink ini belum digunakan di Activity mana pun.'
                              : 'Tidak ada Activity yang cocok dengan pencarian.'}
                          </p>
                          {allLinkedActivities.length === 0 && (
                            <Button
                              type='button'
                              variant='secondary'
                              size='sm'
                              className='mt-3 h-7 text-xs'
                              onClick={() => setUsageTab('add')}
                            >
                              <Icons.add className='size-3.5' />
                              Pasang ke Activity Sekarang
                            </Button>
                          )}
                        </div>
                      ) : (
                        filteredLinkedActivities.map((act) => {
                          const actId = String(act.id ?? '');
                          const isChecked = selectedLinkedActivityIds.includes(actId);
                          const ctx = resolveActivityContext(act);

                          return (
                            <div
                              key={actId}
                              className={cn(
                                'flex flex-col justify-between gap-2.5 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center',
                                isChecked && 'border-primary/50 bg-primary/5'
                              )}
                            >
                              <div className='flex items-start gap-2.5'>
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    setSelectedLinkedActivityIds((prev) =>
                                      checked
                                        ? [...prev, actId]
                                        : prev.filter((item) => item !== actId)
                                    );
                                  }}
                                  className='mt-0.5'
                                />
                                <div className='space-y-1'>
                                  <div className='flex flex-wrap items-center gap-1.5'>
                                    {Boolean(act.time) && (
                                      <Badge variant='outline' className='font-mono text-[10px]'>
                                        {String(act.time)}
                                      </Badge>
                                    )}
                                    <span className='text-sm font-medium'>
                                      {String(act.title ?? actId)}
                                    </span>
                                    {Boolean(act.category) && (
                                      <Badge variant='secondary' className='text-[10px]'>
                                        {String(act.category)}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs'>
                                    {Boolean(act.locationName) && (
                                      <span>📍 {String(act.locationName)}</span>
                                    )}
                                    <span>· {ctx.dayTitle}</span>
                                    <span>
                                      · Itinerary: <b className='text-foreground'>{ctx.itineraryTitle}</b>
                                    </span>
                                    <span>· User: {ctx.authorLabel}</span>
                                  </div>
                                </div>
                              </div>

                              <div className='flex shrink-0 flex-wrap items-center gap-1.5 pl-6 sm:pl-0'>
                                <Button
                                  type='button'
                                  variant='outline'
                                  size='sm'
                                  className='h-7 px-2 text-xs'
                                  disabled={busy}
                                  onClick={() => {
                                    const fullActivity =
                                      (tables.activities ?? []).find(
                                        (a) => String(a.id ?? '') === actId
                                      ) ?? act;
                                    setManagingMyLinkId(null);
                                    setCurrentTable('activities');
                                    setActiveView('activities');
                                    openEditSheet(actId, fullActivity);
                                  }}
                                >
                                  <Icons.edit className='size-3' />
                                  Edit
                                </Button>
                                <Button
                                  type='button'
                                  variant='secondary'
                                  size='sm'
                                  className='h-7 px-2 text-xs'
                                  disabled={busy}
                                  onClick={async () => {
                                    const ok = await executeBulkAction(
                                      {
                                        action: 'bulkSetActivitiesMyLink',
                                        activityIds: [actId],
                                        myLinkId: null
                                      },
                                      'MyLink berhasil dilepas dari Activity.',
                                      ['activities', 'myLinks']
                                    );
                                    if (ok) {
                                      setSelectedLinkedActivityIds((prev) =>
                                        prev.filter((id) => id !== actId)
                                      );
                                    }
                                  }}
                                >
                                  <Icons.close className='size-3' />
                                  Lepas Link
                                </Button>
                                <Button
                                  type='button'
                                  variant='destructive'
                                  size='sm'
                                  className='h-7 px-2 text-xs'
                                  disabled={busy}
                                  title='Hapus Activity ini secara permanen'
                                  onClick={async () => {
                                    const ok = await executeBulkAction(
                                      {
                                        action: 'bulkDelete',
                                        table: 'activities',
                                        ids: [actId]
                                      },
                                      'Activity berhasil dihapus.',
                                      ['activities', 'myLinks']
                                    );
                                    if (ok) {
                                      setSelectedLinkedActivityIds((prev) =>
                                        prev.filter((id) => id !== actId)
                                      );
                                    }
                                  }}
                                >
                                  <Icons.trash className='size-3' />
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </TabsContent>

                  {/* TAB 2: ADD / ATTACH TO ACTIVITIES (SINGLE OR BULK) */}
                  <TabsContent
                    value='add'
                    className='mt-3 flex min-h-0 flex-1 flex-col space-y-3 overflow-hidden'
                  >
                    <div className='grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2'>
                      <Input
                        placeholder='Cari activity, lokasi, hari, atau user...'
                        value={addActivitySearch}
                        onChange={(e) => setAddActivitySearch(e.target.value)}
                        className='h-8 text-xs'
                      />
                      <Select
                        items={itineraryFilterOptions}
                        value={addActivityItineraryFilter}
                        onValueChange={(val) => {
                          if (val) setAddActivityItineraryFilter(val);
                        }}
                      >
                        <SelectTrigger className='h-8 w-full text-xs'>
                          <SelectValue placeholder='Filter Itinerary...' />
                        </SelectTrigger>
                        <SelectContent>
                          {itineraryFilterOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='bg-muted/30 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs'>
                      <div className='flex flex-wrap items-center gap-4'>
                        <label className='flex cursor-pointer items-center gap-2 font-medium'>
                          <Checkbox
                            checked={
                              candidateActivities.length > 0 &&
                              candidateActivities.every((a) =>
                                selectedCandidateActivityIds.includes(String(a.id ?? ''))
                              )
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCandidateActivityIds(
                                  candidateActivities
                                    .map((a) => String(a.id ?? ''))
                                    .filter(Boolean)
                                );
                              } else {
                                setSelectedCandidateActivityIds([]);
                              }
                            }}
                          />
                          <span>
                            Pilih Semua ({selectedCandidateActivityIds.length}/
                            {candidateActivities.length})
                          </span>
                        </label>

                        <label className='text-muted-foreground flex cursor-pointer items-center gap-2'>
                          <Checkbox
                            checked={addActivityOnlyUnlinked}
                            onCheckedChange={(checked) =>
                              setAddActivityOnlyUnlinked(Boolean(checked))
                            }
                          />
                          <span>Hanya yang belum punya MyLink</span>
                        </label>
                      </div>

                      {selectedCandidateActivityIds.length > 0 && (
                        <Button
                          type='button'
                          size='sm'
                          className='h-7 text-xs'
                          disabled={busy}
                          onClick={async () => {
                            const ok = await executeBulkAction(
                              {
                                action: 'bulkSetActivitiesMyLink',
                                activityIds: selectedCandidateActivityIds,
                                myLinkId: activeMyLinkId
                              },
                              `MyLink berhasil dipasang ke ${selectedCandidateActivityIds.length} Activity terpilih.`,
                              ['activities', 'myLinks']
                            );
                            if (ok) {
                              setSelectedCandidateActivityIds([]);
                              setUsageTab('linked');
                            }
                          }}
                        >
                          <Icons.add className='size-3.5' />
                          Pasang ke {selectedCandidateActivityIds.length} Activity Terpilih
                        </Button>
                      )}
                    </div>

                    <div className='-mr-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-2 pb-4'>
                      {candidateActivities.length === 0 ? (
                        <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center text-xs'>
                          <p>Tidak ada Activity kandidat yang cocok dengan filter.</p>
                        </div>
                      ) : (
                        candidateActivities.slice(0, 100).map((act) => {
                          const actId = String(act.id ?? '');
                          const isChecked = selectedCandidateActivityIds.includes(actId);
                          const ctx = resolveActivityContext(act);
                          const existingMlId = act.myLinkId ? String(act.myLinkId) : null;
                          const existingMl = existingMlId ? myLinkByIdMap.get(existingMlId) : null;

                          return (
                            <div
                              key={actId}
                              className={cn(
                                'flex flex-col justify-between gap-2.5 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center',
                                isChecked && 'border-primary/50 bg-primary/5'
                              )}
                            >
                              <div className='flex items-start gap-2.5'>
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    setSelectedCandidateActivityIds((prev) =>
                                      checked
                                        ? [...prev, actId]
                                        : prev.filter((item) => item !== actId)
                                    );
                                  }}
                                  className='mt-0.5'
                                />
                                <div className='space-y-1'>
                                  <div className='flex flex-wrap items-center gap-1.5'>
                                    {Boolean(act.time) && (
                                      <Badge variant='outline' className='font-mono text-[10px]'>
                                        {String(act.time)}
                                      </Badge>
                                    )}
                                    <span className='text-sm font-medium'>
                                      {String(act.title ?? actId)}
                                    </span>
                                    {existingMlId && (
                                      <Badge variant='outline' className='text-[10px]'>
                                        Saat ini: {String(existingMl?.label ?? existingMlId)}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs'>
                                    {Boolean(act.locationName) && (
                                      <span>📍 {String(act.locationName)}</span>
                                    )}
                                    <span>· {ctx.dayTitle}</span>
                                    <span>
                                      · Itinerary: <b className='text-foreground'>{ctx.itineraryTitle}</b>
                                    </span>
                                    <span>· User: {ctx.authorLabel}</span>
                                  </div>
                                </div>
                              </div>

                              <div className='flex shrink-0 items-center gap-1.5 pl-6 sm:pl-0'>
                                <Button
                                  type='button'
                                  variant='outline'
                                  size='sm'
                                  className='h-7 px-2.5 text-xs'
                                  disabled={busy}
                                  onClick={async () => {
                                    const ok = await executeBulkAction(
                                      {
                                        action: 'bulkSetActivitiesMyLink',
                                        activityIds: [actId],
                                        myLinkId: activeMyLinkId
                                      },
                                      `MyLink berhasil dipasang ke Activity "${String(act.title ?? actId)}".`,
                                      ['activities', 'myLinks']
                                    );
                                    if (ok) {
                                      setSelectedCandidateActivityIds((prev) =>
                                        prev.filter((id) => id !== actId)
                                      );
                                    }
                                  }}
                                >
                                  <Icons.add className='size-3.5' />
                                  Pasang
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </SidebarProvider >
  );
}

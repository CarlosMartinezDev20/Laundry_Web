import React, { useState, useEffect, useMemo, useId, useCallback, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Select } from '../components/UI/Select';
import {
  MagnifyingGlass,
  Plus,
  Eye,
  PencilSimple,
  Trash,
  CheckCircle,
  Buildings,
  User,
  Tag,
  CalendarBlank,
  Calendar,
  FolderDashed,
  FileText,
  FunnelSimple,
  X,
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissionUtils';
import { TableSkeleton } from '../components/UI/TableSkeleton';
import { ConfirmModal } from '../components/UI/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { ErrorState } from '../components/UI/ErrorState';
import { formatApiError } from '../utils/apiErrors';

const INITIAL_FILTERS = {
  companyId: '',
  status: '',
  employeeId: '',
  startDate: '',
  endDate: '',
  week: '',
};

const statusLabel = (status) => {
  const map = {
    DRAFT: 'Draft',
    PENDING_APPROVAL: 'Pending approval',
    APPROVED: 'Approved',
  };
  return map[status] || status?.replace(/_/g, ' ') || '';
};

const safeParseYmd = (iso) => {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const StatusBadgeCell = memo(function StatusBadgeCell({ status }) {
  const classMap = { DRAFT: 'draft', PENDING_APPROVAL: 'pending', APPROVED: 'approved' };
  return (
    <span className={`status-badge ${classMap[status] || 'draft'}`}>{statusLabel(status)}</span>
  );
});

const FormTableRow = memo(function FormTableRow({
  form,
  user,
  onView,
  onEdit,
  onDelete,
  onApprove,
}) {
  const companyName = form.company?.name || 'company';
  const dateLabel = form._dateLabel || (form.date || '—');
  const canEdit = hasPermission(user, 'Forms', 'Edit');
  const canDelete = hasPermission(user, 'Forms', 'Delete');
  const canApprove = hasPermission(user, 'Forms', 'Approve');

  return (
    <tr>
      <td
        style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}
        title={form.date ? dateLabel : undefined}
      >
        {dateLabel}
      </td>
      <td style={{ fontWeight: 500 }}>{form.company?.name || 'Unknown'}</td>
      <td>
        <StatusBadgeCell status={form.status} />
      </td>
      <td style={{ color: 'var(--color-text-muted)' }}>{form.createdBy?.name || '—'}</td>
      <td className="forms-actions-cell">
        <div className="forms-actions-wrap">
          <button
            type="button"
            className="icon-btn primary"
            onClick={() => onView(form.id)}
            title="View form"
            aria-label={`View form for ${companyName}`}
          >
            <Eye size={15} aria-hidden />
          </button>

          {form.status === 'PENDING_APPROVAL' && canApprove && (
            <button
              type="button"
              className="icon-btn success"
              onClick={() => onApprove(form.id)}
              title="Approve form"
              aria-label="Approve form"
            >
              <CheckCircle size={15} aria-hidden />
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => onEdit(form.id)}
              disabled={form.status === 'APPROVED'}
              title={form.status === 'APPROVED' ? 'Approved forms cannot be edited' : 'Edit form'}
              aria-label="Edit form"
              style={form.status === 'APPROVED' ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            >
              <PencilSimple size={15} aria-hidden />
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              className="icon-btn danger"
              onClick={() => onDelete(form.id)}
              title="Delete form"
              aria-label="Delete form"
            >
              <Trash size={15} aria-hidden />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

export const FormsManagement = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  const weekFieldId = useId();
  const tableWrapperRef = useRef(null);
  const scrollTopRef = useRef(0);
  const rafRef = useRef(0);
  const [forms, setForms] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({ today: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [formsFetchError, setFormsFetchError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [approveModal, setApproveModal] = useState({ isOpen: false, id: null });
  const [endOfDayModal, setEndOfDayModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleName = (user?.role?.name || user?.role || '').toString().toUpperCase();
  const isAdminOrManager = roleName === 'ADMIN' || roleName === 'MANAGER';

  const [filters, setFilters] = useState({ ...INITIAL_FILTERS });
  const [searchText, setSearchText] = useState('');

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
    [],
  );

  // ── Virtualized table state (smooth scrolling with large datasets) ──
  const [tableScrollTop, setTableScrollTop] = useState(0);
  const [tableViewportH, setTableViewportH] = useState(520);
  const ROW_HEIGHT = 52; // px (approx, keeps scrolling smooth)
  const OVERSCAN = 10;   // render a bit extra above/below

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    const el = tableWrapperRef.current;
    if (!el) return;

    const measure = () => {
      const h = el.clientHeight || 520;
      setTableViewportH(h);
    };

    measure();
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    } else {
      window.addEventListener('resize', measure);
    }

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', measure);
    };
  }, []);

  const onTableScroll = useCallback((e) => {
    const nextTop = e.currentTarget.scrollTop;
    scrollTopRef.current = nextTop;
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      setTableScrollTop(scrollTopRef.current);
    });
  }, []);

  const fetchForms = useCallback(async (filterSnapshot, currentFilters) => {
    setLoading(true);
    const f = filterSnapshot !== undefined ? filterSnapshot : currentFilters;
    const params = new URLSearchParams();
    if (f.companyId) params.set('companyId', f.companyId);
    if (f.status) params.set('status', f.status);
    if (f.employeeId) params.set('employeeId', f.employeeId);
    if (f.startDate) params.set('startDate', f.startDate);
    if (f.endDate) params.set('endDate', f.endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    try {
      const data = await api.get(`/forms${query}`);
      const normalized = (data || []).map((form) => {
        const company = form.company?.name || '';
        const creator = form.createdBy?.name || '';
        const initials = form.createdBy?.initials || '';
        const statusLbl = statusLabel(form.status);
        const parsed = safeParseYmd(form.date);
        const dateLabel = parsed ? dateFormatter.format(parsed) : (form.date || '');
        const searchIndex = [
          company,
          creator,
          initials,
          String(form.date || ''),
          dateLabel,
          statusLbl,
          String(form.id ?? ''),
        ]
          .join(' | ')
          .toLowerCase();

        return {
          ...form,
          _dateLabel: dateLabel,
          _statusLabel: statusLbl,
          _searchIndex: searchIndex,
        };
      });
      setForms(normalized);
      setFormsFetchError(null);
    } catch (err) {
      const msg = formatApiError(err);
      setFormsFetchError(msg);
      toastRef.current.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.get('/forms/stats');
      setStats(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchForms({ ...INITIAL_FILTERS }, { ...INITIAL_FILTERS });
    fetchStats();
    Promise.all([
      api.get('/companies').catch(() => []),
      api.get('/users').catch(() => []),
    ]).then(([comps, emps]) => {
      if (!cancelled) {
        setCompanies(comps);
        setEmployees(emps);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetchForms, fetchStats]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.companyId ||
          filters.status ||
          filters.employeeId ||
          filters.startDate ||
          filters.endDate ||
          filters.week ||
          searchText.trim(),
      ),
    [filters, searchText],
  );

  const displayedForms = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return forms;
    return forms.filter((form) => {
      const idx = form._searchIndex;
      if (idx) return idx.includes(q);
      // Fallback for unexpected shapes
      const company = (form.company?.name || '').toLowerCase();
      const creator = (form.createdBy?.name || '').toLowerCase();
      const initials = (form.createdBy?.initials || '').toLowerCase();
      const dateRaw = String(form.date || '').toLowerCase();
      const status = statusLabel(form.status).toLowerCase();
      const idStr = String(form.id ?? '').toLowerCase();
      return company.includes(q) || creator.includes(q) || initials.includes(q) || dateRaw.includes(q) || status.includes(q) || idStr.includes(q);
    });
  }, [forms, searchText]);

  // Reset scroll position when list changes significantly (filters/search)
  useEffect(() => {
    const el = tableWrapperRef.current;
    if (!el) return;
    el.scrollTop = 0;
    setTableScrollTop(0);
  }, [filters.companyId, filters.status, filters.employeeId, filters.startDate, filters.endDate, filters.week, searchText]);

  const virtualWindow = useMemo(() => {
    const total = displayedForms.length;
    const visibleCount = Math.max(1, Math.ceil(tableViewportH / ROW_HEIGHT));
    const startIndex = Math.max(0, Math.floor(tableScrollTop / ROW_HEIGHT) - OVERSCAN);
    const endIndex = Math.min(total, startIndex + visibleCount + OVERSCAN * 2);
    const slice = displayedForms.slice(startIndex, endIndex);
    const topPad = startIndex * ROW_HEIGHT;
    const bottomPad = (total - endIndex) * ROW_HEIGHT;
    return { total, startIndex, endIndex, slice, topPad, bottomPad };
  }, [displayedForms, tableScrollTop, tableViewportH]);

  const endOfDayPendingForms = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayYmd = `${y}-${m}-${d}`;
    return displayedForms.filter(
      (form) => form.status === 'PENDING_APPROVAL' && String(form.date || '') <= todayYmd,
    );
  }, [displayedForms]);

  const filterChips = useMemo(() => {
    const chips = [];
    if (filters.companyId) {
      const c = companies.find((x) => x.id === filters.companyId);
      if (c) chips.push({ key: 'companyId', label: c.name });
    }
    if (filters.employeeId) {
      const e = employees.find((x) => x.id === filters.employeeId);
      if (e) chips.push({ key: 'employeeId', label: e.name });
    }
    if (filters.status) {
      chips.push({ key: 'status', label: statusLabel(filters.status) });
    }
    if (filters.week) {
      chips.push({ key: 'week', label: `Week ${filters.week.replace('-W', ' · W')}` });
    } else if (filters.startDate || filters.endDate) {
      const aD = filters.startDate ? safeParseYmd(filters.startDate) : null;
      const bD = filters.endDate ? safeParseYmd(filters.endDate) : null;
      const a = aD ? dateFormatter.format(aD) : (filters.startDate ? String(filters.startDate) : '…');
      const b = bD ? dateFormatter.format(bD) : (filters.endDate ? String(filters.endDate) : '…');
      chips.push({ key: 'dateRange', label: `${a} – ${b}` });
    }
    return chips;
  }, [filters, companies, employees, dateFormatter]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'week' && value) {
      const [year, weekStr] = value.split('-W');
      const w = parseInt(weekStr, 10);
      const simple = new Date(year, 0, 1 + (w - 1) * 7);
      const dow = simple.getDay();
      const start = simple;
      if (dow <= 4) start.setDate(simple.getDate() - simple.getDay() + 1);
      else start.setDate(simple.getDate() + 8 - simple.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const fmt = (d) => d.toISOString().split('T')[0];
      setFilters((prev) => ({ ...prev, week: value, startDate: fmt(start), endDate: fmt(end) }));
      return;
    }
    if (name === 'week' && !value) {
      setFilters((prev) => ({ ...prev, week: '', startDate: '', endDate: '' }));
      return;
    }
    if (name === 'startDate' || name === 'endDate') {
      setFilters((prev) => ({ ...prev, [name]: value, week: '' }));
      return;
    }
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const removeFilterChip = useCallback(
    (key) => {
      setFilters((prev) => {
        let next = { ...prev };
        if (key === 'dateRange' || key === 'week') {
          next = { ...next, week: '', startDate: '', endDate: '' };
        } else {
          next = { ...next, [key]: '' };
        }
        fetchForms(next, next);
        return next;
      });
    },
    [fetchForms],
  );

  const clearAllFilters = useCallback(() => {
    const cleared = { ...INITIAL_FILTERS };
    setFilters(cleared);
    setSearchText('');
    fetchForms(cleared, cleared);
  }, [fetchForms]);

  const handleDeleteClick = useCallback((id) => setDeleteModal({ isOpen: true, id }), []);

  const confirmDelete = useCallback(async () => {
    try {
      await api.delete(`/forms/${deleteModal.id}`);
      toast.success('Form deleted successfully');
      fetchForms(undefined, filters);
      fetchStats();
    } catch {
      toast.error('Failed to delete form');
    }
  }, [deleteModal.id, fetchForms, fetchStats, filters, toast]);

  const handleApprove = useCallback(async () => {
    try {
      await api.patch(`/forms/${approveModal.id}/approve`);
      toast.success('Form approved successfully');
      fetchForms(undefined, filters);
      fetchStats();
    } catch {
      toast.error('Failed to approve form');
    }
  }, [approveModal.id, fetchForms, fetchStats, filters, toast]);

  const handleEndOfDayApproval = useCallback(async () => {
    const pendingIds = endOfDayPendingForms.map((form) => form.id);
    if (pendingIds.length === 0) return;
    const results = await Promise.allSettled(
      pendingIds.map((formId) => api.patch(`/forms/${formId}/approve`)),
    );
    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failedCount = results.length - successCount;
    if (successCount > 0) {
      toast.success(`End-of-day approval completed: ${successCount} form(s) approved.`);
    }
    if (failedCount > 0) {
      toast.error(`${failedCount} form(s) could not be approved. Please retry.`);
    }
    fetchForms(undefined, filters);
    fetchStats();
  }, [endOfDayPendingForms, fetchForms, fetchStats, filters, toast]);

  const handleViewForm = useCallback((formId) => navigate(`/forms/${formId}`), [navigate]);
  const handleEditForm = useCallback((formId) => navigate(`/forms/${formId}/edit`), [navigate]);
  const handleApproveClick = useCallback((formId) => setApproveModal({ isOpen: true, id: formId }), []);

  return (
    <div className="forms-management flex flex-col gap-6 animate-fade-in min-w-0 max-w-full">

      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Forms</h1>
          <p className="page-subtitle">Manage and track all laundry reports</p>
        </div>
        {hasPermission(user, 'Forms', 'Add') && (
          <Button variant="primary" onClick={() => navigate('/forms/new')} className="w-full sm:w-fit flex-shrink-0">
            <Plus size={16} aria-hidden /> New form
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ backgroundColor: 'var(--color-brand-light)' }}>
            <FileText size={22} weight="duotone" style={{ color: 'var(--color-brand-text)' }} aria-hidden />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--color-brand-text)' }}>
              {stats.today}
            </div>
            <div className="stat-label">Reports today</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ backgroundColor: 'var(--color-warning-light)' }}>
            <Calendar size={22} weight="duotone" style={{ color: 'var(--color-warning)' }} aria-hidden />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{stats.pending}</div>
            <div className="stat-label">Pending approval</div>
          </div>
        </div>
      </div>

      {hasPermission(user, 'Forms', 'Approve') && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 style={{ marginBottom: 0 }}>End-of-day approval</h3>
              <p className="text-sm text-muted" style={{ marginTop: '4px' }}>
                Pending forms dated today or earlier must be approved by a manager before closing the day.
              </p>
            </div>
            <Button
              variant="success"
              onClick={() => setEndOfDayModal(true)}
              disabled={endOfDayPendingForms.length === 0}
              className="w-full sm:w-fit"
            >
              <CheckCircle size={16} aria-hidden /> Approve {endOfDayPendingForms.length} pending
            </Button>
          </div>
        </Card>
      )}

      <div className="filter-card">
        <div className="filter-card-header">
          <div className="filter-card-heading">
            <div
              className="stat-icon-wrap"
              style={{
                backgroundColor: 'var(--color-brand-light)',
                width: '40px',
                height: '40px',
              }}
            >
              <FunnelSimple size={20} weight="duotone" style={{ color: 'var(--color-brand-text)' }} aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="filter-card-title">Filters</h2>
              <p className="filter-card-subtitle">
                Refine by company, author, status and dates. Apply to reload from the server; search filters the results
                below instantly.
              </p>
            </div>
          </div>
          {hasActiveFilters && (
            <Button
              type="button"
              onClick={clearAllFilters}
              className="w-full sm:w-fit flex-shrink-0"
            >
              Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label={
              <span className="flex items-center gap-1">
                <MagnifyingGlass size={14} aria-hidden /> Search
              </span>
            }
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Company, author, date, status, id..."
            autoComplete="off"
            className="md:col-span-2 lg:col-span-3"
          />

          <Select
            label={
              <span className="flex items-center gap-1">
                <Buildings size={14} aria-hidden /> Company
              </span>
            }
            name="companyId"
            value={filters.companyId}
            onChange={handleFilterChange}
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select
            label={
              <span className="flex items-center gap-1">
                <User size={14} aria-hidden /> Created by
              </span>
            }
            name="employeeId"
            value={filters.employeeId}
            onChange={handleFilterChange}
          >
            <option value="">All users</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.initials || '—'})
              </option>
            ))}
          </Select>

          <Select
            label={
              <span className="flex items-center gap-1">
                <Tag size={14} aria-hidden /> Status
              </span>
            }
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending approval</option>
            <option value="APPROVED">Approved</option>
          </Select>

          <div className="input-group">
            <label htmlFor={weekFieldId} className="input-label">
              <Calendar size={14} aria-hidden /> By week
            </label>
            <input
              id={weekFieldId}
              type="week"
              name="week"
              className="input-field"
              value={filters.week}
              onChange={handleFilterChange}
            />
          </div>

          <div className="input-group md:col-span-2 lg:col-span-1">
            <span className="input-label">
              <CalendarBlank size={14} aria-hidden /> Date range
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="flex-1"
                aria-label="Start date"
              />
              <Input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="flex-1"
                aria-label="End date"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 justify-end md:col-span-2 lg:col-span-1">
            <Button variant="action" onClick={() => fetchForms(undefined, filters)} className="w-full">
              <MagnifyingGlass size={16} aria-hidden /> Apply filters
            </Button>
            <Button
              type="button"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className="w-full"
            >
              Reset filters
            </Button>
          </div>
        </div>

        {filterChips.length > 0 && (
          <div className="filter-chips-row">
            <span className="filter-chips-label">Active</span>
            <div className="filter-chips">
              {filterChips.map((chip) => (
                <button
                  key={`${chip.key}-${chip.label}`}
                  type="button"
                  className="filter-chip"
                  onClick={() => removeFilterChip(chip.key)}
                  aria-label={`Remove filter: ${chip.label}`}
                >
                  {chip.label}
                  <X size={12} weight="bold" aria-hidden />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Card className="min-w-0 forms-list-card" style={{ padding: 0 }}>
        {!loading && !formsFetchError && (
          <div className="forms-table-toolbar">
            <span className="forms-table-count">
              {displayedForms.length === 0
                ? searchText.trim()
                  ? 'No forms match search or filters'
                  : 'No forms match the current filters'
                : searchText.trim() && displayedForms.length !== forms.length
                  ? `${displayedForms.length} of ${forms.length} forms shown`
                  : displayedForms.length === 1
                  ? '1 form in the list'
                  : `${displayedForms.length} forms in the list`}
            </span>
          </div>
        )}
        {loading ? (
          <div style={{ padding: 'var(--spacing-6)' }}>
            <TableSkeleton rows={5} columns={5} />
          </div>
        ) : formsFetchError ? (
          <ErrorState
            title="Could not load forms"
            message={formsFetchError}
            onRetry={() => fetchForms(undefined, filters)}
            className="error-state--fill"
          />
        ) : (
          <div
            ref={tableWrapperRef}
            className="table-wrapper table-flush forms-data-table forms-virtual-table"
            style={{ maxHeight: '70vh', overflowY: 'auto' }}
            onScroll={onTableScroll}
          >
            <table className="table">
              <thead>
                <tr>
                  {['Date', 'Company', 'Status', 'Created by'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                  <th className="forms-actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {virtualWindow.total === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <FolderDashed size={48} weight="thin" aria-hidden />
                        <div>
                          <div className="empty-state-title">No forms found</div>
                          <div className="empty-state-desc">
                            {searchText.trim()
                              ? 'Try clearing search or adjusting filters, then apply again.'
                              : 'Try adjusting filters and applying again, or create a new form.'}
                          </div>
                        </div>
                        <Button variant="primary" onClick={() => navigate('/forms/new')} className="mt-2 w-full sm:w-fit">
                          <Plus size={16} aria-hidden /> New form
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {virtualWindow.topPad > 0 && (
                      <tr aria-hidden="true">
                        <td colSpan={5} style={{ padding: 0, borderBottom: 'none', height: virtualWindow.topPad }} />
                      </tr>
                    )}

                    {virtualWindow.slice.map((form) => (
                      <FormTableRow
                        key={form.id}
                        form={form}
                        user={user}
                        onView={handleViewForm}
                        onEdit={handleEditForm}
                        onDelete={handleDeleteClick}
                        onApprove={handleApproveClick}
                      />
                    ))}

                    {virtualWindow.bottomPad > 0 && (
                      <tr aria-hidden="true">
                        <td colSpan={5} style={{ padding: 0, borderBottom: 'none', height: virtualWindow.bottomPad }} />
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete form"
        message="Are you sure you want to permanently delete this form? All associated data will be lost and this cannot be undone."
        confirmText="Delete"
      />
      <ConfirmModal
        isOpen={approveModal.isOpen}
        onClose={() => setApproveModal({ isOpen: false, id: null })}
        onConfirm={handleApprove}
        title="Approve form"
        message="Are you sure you want to approve this report? This will mark it as completed and notify the team."
        confirmText="Approve"
        confirmVariant="success"
      />
      <ConfirmModal
        isOpen={endOfDayModal}
        onClose={() => setEndOfDayModal(false)}
        onConfirm={async () => {
          await handleEndOfDayApproval();
          setEndOfDayModal(false);
        }}
        title="End-of-day approval"
        message={`Approve all pending forms dated up to today? (${endOfDayPendingForms.length} form(s))`}
        confirmText="Approve all"
        confirmVariant="success"
      />
    </div>
  );
};

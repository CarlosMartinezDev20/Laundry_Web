import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { api } from '../services/api';
import { formatApiError } from '../utils/apiErrors';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { Skeleton } from '../components/UI/Skeleton';
import { useToast } from '../context/ToastContext';
import { ErrorState } from '../components/UI/ErrorState';
import {
  ChartBar,
  Buildings,
  ClipboardText,
  Package,
  Bag,
  Rows,
  ArrowCounterClockwise,
  MagnifyingGlass,
  CalendarBlank,
  Info,
} from '@phosphor-icons/react';

/* ─── Helpers ─────────────────────────────────────── */
const pct = (value, total) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const toYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatNumber = (n) =>
  n == null || Number.isNaN(n)
    ? '—'
    : new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);

const formatPeriodBanner = (start, end) => {
  if (!start || !end) return 'All time';
  const opts = { dateStyle: 'medium' };
  try {
    const a = new Date(`${start}T12:00:00`);
    const b = new Date(`${end}T12:00:00`);
    return `${a.toLocaleDateString(undefined, opts)} — ${b.toLocaleDateString(undefined, opts)}`;
  } catch {
    return `${start} — ${end}`;
  }
};

const sortEntriesDesc = (entries) =>
  [...entries].sort((a, b) => b[1] - a[1]);

/* ─── Sub-components ──────────────────────────────── */

/** KPI card with optional accent color and icon */
const KpiCard = memo(function KpiCard({ icon, label, value, sub, accentColor, accentBg }) {
  return (
    <div className="report-kpi-card" style={{ '--kpi-accent': accentColor, '--kpi-accent-bg': accentBg }}>
      <div className="report-kpi-icon">
        {icon}
      </div>
      <div className="report-kpi-body">
        <p className="report-kpi-value">{typeof value === 'number' ? formatNumber(value) : (value ?? '—')}</p>
        <p className="report-kpi-label">{label}</p>
        {sub && <p className="report-kpi-sub">{sub}</p>}
      </div>
    </div>
  );
});

/** Single breakdown row with an animated progress bar */
const BreakdownRow = memo(function BreakdownRow({ label, value, total, color }) {
  const percentage = pct(value, total);
  return (
    <div className="report-breakdown-row">
      <div className="report-breakdown-meta">
        <span className="report-breakdown-label">{label}</span>
        <span className="report-breakdown-count" style={{ color }}>
          {formatNumber(value)}
          <span className="report-breakdown-pct"> · {percentage}%</span>
        </span>
      </div>
      <div className="report-progress-track">
        <div
          className="report-progress-fill"
          style={{ width: `${percentage}%`, background: color }}
        />
      </div>
    </div>
  );
});

/** Thematic group: title + optional description + grid of cards */
const ReportGroup = ({ id, title, description, children }) => (
  <section className="report-group" aria-labelledby={id}>
    <header className="report-group-header">
      <h2 id={id} className="report-group-title">{title}</h2>
      {description ? (
        <p className="report-group-desc">{description}</p>
      ) : null}
    </header>
    {children}
  </section>
);

/** Section card wrapper with header */
const ReportSection = ({ icon, title, badge, badgeVariant = 'draft', children }) => (
  <div className="report-section-card">
    <div className="report-section-header">
      <div className="report-section-title-group">
        <span className="report-section-icon">{icon}</span>
        <h3 className="report-section-title">{title}</h3>
      </div>
      {badge !== undefined && (
        <span className={`status-badge ${badgeVariant}`}>{badge}</span>
      )}
    </div>
    <div className="report-section-body">
      {children}
    </div>
  </div>
);

/* ─── Main Component ──────────────────────────────── */
export const ReportsView = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  const [companies, setCompanies]             = useState([]);
  const [companiesError, setCompaniesError]     = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [startDate, setStartDate]             = useState('');
  const [endDate, setEndDate]                 = useState('');
  const [report, setReport]                   = useState(null);
  const [loading, setLoading]                 = useState(false);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const loadCompanies = useCallback(() => {
    setCompaniesError(null);
    api
      .get('/companies')
      .then((data) => {
        setCompanies(data);
        setCompaniesError(null);
      })
      .catch((err) => {
        const msg = formatApiError(err);
        setCompaniesError(msg);
        toastRef.current.error(msg);
      });
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const applyPreset = useCallback((preset) => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    if (preset === 'clear') {
      setStartDate('');
      setEndDate('');
      return;
    }
    let start;
    if (preset === '7d') {
      start = new Date(today);
      start.setDate(start.getDate() - 6);
    } else if (preset === '30d') {
      start = new Date(today);
      start.setDate(start.getDate() - 29);
    } else if (preset === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    setStartDate(toYMD(start));
    setEndDate(toYMD(today));
  }, []);

  const handleGenerate = useCallback(
    async (e) => {
      e.preventDefault();
      if (!selectedCompanyId) return;
      const oneDateOnly = Boolean(startDate) !== Boolean(endDate);
      if (oneDateOnly) {
        toast.error('Please set both start and end date, or leave both empty for all time.');
        return;
      }
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }
      const qs = params.toString();
      try {
        const data = await api.get(`/reports/company/${selectedCompanyId}${qs ? `?${qs}` : ''}`);
        setReport(data);
      } catch (err) {
        toast.error(formatApiError(err));
      } finally {
        setLoading(false);
      }
    },
    [selectedCompanyId, startDate, endDate, toast],
  );

  const handleReset = useCallback(() => {
    setReport(null);
    setSelectedCompanyId('');
    setStartDate('');
    setEndDate('');
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const selectedCompany = useMemo(
    () => companies.find((c) => String(c.id) === String(selectedCompanyId)),
    [companies, selectedCompanyId],
  );

  /* ── Derived totals for progress bars ── */
  const { totalItems, sheetSizes, totalSheets, standardEntries, coloredEntries } = useMemo(() => {
    if (!report) {
      return {
        totalItems: 0,
        sheetSizes: [],
        totalSheets: 0,
        standardEntries: [],
        coloredEntries: [],
      };
    }
    const ti = (report.totals.standard || 0) + (report.totals.colored || 0);
    const sheets = ['SIMPLE', 'DOUBLE', 'QUEEN', 'KING'].map((s) => ({
      key: s,
      label: s.charAt(0) + s.slice(1).toLowerCase(),
      value: report.totals.sheetSizes?.[s] ?? 0,
    }));
    const ts = sheets.reduce((a, s) => a + s.value, 0);
    return {
      totalItems: ti,
      sheetSizes: sheets,
      totalSheets: ts,
      standardEntries: sortEntriesDesc(Object.entries(report.totals.standardItems ?? {})),
      coloredEntries: sortEntriesDesc(Object.entries(report.totals.coloredItems ?? {})),
    };
  }, [report]);

  return (
    <div
      className="flex flex-col gap-6 animate-fade-in pb-10"
      aria-busy={loading}
    >

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Cumulative statistics by company and date range</p>
        </div>
        {report && (
          <div className="flex gap-2 flex-wrap justify-end">
            <button className="btn" onClick={handlePrint} type="button" title="Print (or Save as PDF)">
              Print
            </button>
            <button className="btn" onClick={handleReset} type="button">
              <ArrowCounterClockwise size={15} />
              New Report
            </button>
          </div>
        )}
      </div>

      {/* ── Filter Card ── */}
      <div className="report-filter-card">
        <div className="report-filter-label">
          <MagnifyingGlass size={14} weight="bold" />
          Generate Report
        </div>
        {companiesError ? (
          <ErrorState
            title="No se pudieron cargar las empresas"
            message={companiesError}
            onRetry={loadCompanies}
          />
        ) : null}
        <form onSubmit={handleGenerate} className="report-filter-form">
          <div className="input-group">
            <label className="input-label">
              <Buildings size={14} /> Company
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              required
              className="input-field"
            >
              <option value="">Select a company…</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <Input
            type="date"
            label="Start date (optional)"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            label="End date (optional)"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <div className="flex items-end">
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !selectedCompanyId}
              className="w-full"
            >
              <ChartBar size={16} />
              {loading ? 'Generating…' : 'Generate'}
            </Button>
          </div>
        </form>

        <div className="report-date-presets">
          <span>
            <CalendarBlank size={14} weight="bold" style={{ verticalAlign: '-2px', marginRight: 4 }} />
            Quick range
          </span>
          <button type="button" className="btn report-preset-btn" onClick={() => applyPreset('7d')}>
            Last 7 days
          </button>
          <button type="button" className="btn report-preset-btn" onClick={() => applyPreset('30d')}>
            Last 30 days
          </button>
          <button type="button" className="btn report-preset-btn" onClick={() => applyPreset('month')}>
            This month
          </button>
          <button type="button" className="btn report-preset-btn" onClick={() => applyPreset('clear')}>
            All time
          </button>
        </div>
      </div>

      {/* ── Loading Skeletons ── */}
      {loading && (
        <div className="report-document flex flex-col gap-4">
          <div className="report-kpi-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="report-kpi-card" style={{ '--kpi-accent': 'var(--color-border)', '--kpi-accent-bg': 'var(--color-surface-hover)' }}>
                <Skeleton height="44px" style={{ width: 44, borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                <div className="report-kpi-body" style={{ gap: 6 }}>
                  <Skeleton height="28px" style={{ width: '60%' }} />
                  <Skeleton height="14px" style={{ width: '80%' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton height="200px" style={{ borderRadius: 'var(--radius-lg)' }} />
            <Skeleton height="200px" style={{ borderRadius: 'var(--radius-lg)' }} />
            <Skeleton height="160px" style={{ borderRadius: 'var(--radius-lg)' }} />
            <Skeleton height="160px" style={{ borderRadius: 'var(--radius-lg)' }} />
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && !report && (
        <div className="report-empty-state">
          <div className="report-empty-icon">
            <ClipboardText size={36} weight="duotone" />
          </div>
          <p className="report-empty-title">No report generated yet</p>
          <p className="report-empty-desc">
            Select a company above and optionally choose a date range, then click <strong>Generate</strong> to see cumulative statistics.
          </p>
        </div>
      )}

      {/* ── Report Data ── */}
      {!loading && report && (
        <div className="report-document">

          {report.totalForms === 0 && (
            <div className="report-zero-callout" role="status">
              <Info size={22} weight="duotone" style={{ flexShrink: 0, color: 'var(--color-warning)' }} />
              <div>
                <strong>No forms in this period</strong>
                There are no laundry forms for this company with the current filters. Try widening the date range or pick another company.
              </div>
            </div>
          )}

          {/* ── Scope: company + period ── */}
          <div className="report-banner">
            <div className="report-banner-icon">
              <Buildings size={18} weight="duotone" />
            </div>
            <div>
              <p className="report-banner-company">{selectedCompany?.name ?? 'Company'}</p>
              <p className="report-banner-period">
                {formatPeriodBanner(startDate, endDate)}
              </p>
            </div>
          </div>

          <ReportGroup
            id="report-overview-heading"
            title="Overview"
            description="High-level counts for the selected company and period. Total items combine standard and colored line quantities."
          >
            <div className="report-kpi-grid">
              <KpiCard
                icon={<ClipboardText size={20} weight="duotone" />}
                label="Forms Processed"
                value={report.totalForms}
                accentColor="var(--color-brand-text)"
                accentBg="var(--color-brand-light)"
              />
              <KpiCard
                icon={<Package size={20} weight="duotone" />}
                label="Total Items"
                value={totalItems}
                sub={`${formatNumber(report.totals.standard)} std · ${formatNumber(report.totals.colored)} col`}
                accentColor="var(--color-success)"
                accentBg="var(--color-success-light)"
              />
              <KpiCard
                icon={<Rows size={20} weight="duotone" />}
                label="Pocket Count"
                value={report.totals.pockets}
                accentColor="#7c3aed"
                accentBg="rgba(124,58,237,0.08)"
              />
              <KpiCard
                icon={<Bag size={20} weight="duotone" />}
                label="Plastic Bags"
                value={report.totals.plasticBags?.total}
                sub={`${formatNumber(report.totals.plasticBags?.small ?? 0)} small · ${formatNumber(report.totals.plasticBags?.large ?? 0)} large`}
                accentColor="var(--color-warning)"
                accentBg="var(--color-warning-light)"
              />
            </div>

            {totalItems > 0 && (
              <div className="report-split-wrap">
                <div className="report-split-bar" role="img" aria-label="Share of item volume: standard versus colored">
                  <div
                    className="report-split-bar-std"
                    style={{ width: `${pct(report.totals.standard, totalItems)}%` }}
                  />
                  <div
                    className="report-split-bar-col"
                    style={{ width: `${pct(report.totals.colored, totalItems)}%` }}
                  />
                </div>
                <div className="report-split-legend">
                  <span>
                    <span className="report-split-dot" style={{ background: 'var(--color-brand-text)' }} aria-hidden />
                    Standard {formatNumber(report.totals.standard)} ({pct(report.totals.standard, totalItems)}%)
                  </span>
                  <span>
                    <span className="report-split-dot" style={{ background: 'var(--color-warning)' }} aria-hidden />
                    Colored {formatNumber(report.totals.colored)} ({pct(report.totals.colored, totalItems)}%)
                  </span>
                </div>
              </div>
            )}
          </ReportGroup>

          <ReportGroup
            id="report-items-heading"
            title="Items by category"
            description="Breakdown of line-item quantities. Bars show each category’s share within standard or colored totals."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReportSection
                icon={<Package size={16} weight="duotone" />}
                title="Standard Items"
                badge={`${formatNumber(report.totals.standard)} units`}
                badgeVariant="draft"
              >
                {standardEntries.length === 0 ? (
                  <p className="text-sm text-muted">No items recorded.</p>
                ) : (
                  standardEntries.map(([cat, qty]) => (
                    <BreakdownRow
                      key={cat}
                      label={cat}
                      value={qty}
                      total={report.totals.standard}
                      color="var(--color-brand-text)"
                    />
                  ))
                )}
              </ReportSection>

              <ReportSection
                icon={<Package size={16} weight="duotone" />}
                title="Colored Items"
                badge={`${formatNumber(report.totals.colored)} units`}
                badgeVariant="pending"
              >
                {coloredEntries.length === 0 ? (
                  <p className="text-sm text-muted">No items recorded.</p>
                ) : (
                  coloredEntries.map(([cat, qty]) => (
                    <BreakdownRow
                      key={cat}
                      label={cat}
                      value={qty}
                      total={report.totals.colored}
                      color="var(--color-warning)"
                    />
                  ))
                )}
              </ReportSection>
            </div>
          </ReportGroup>

          <ReportGroup
            id="report-sheets-heading"
            title="Sheets & supplies"
            description="Bedding sizes (from line items with a size) and plastic bag counts aggregated from forms."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReportSection
                icon={<Rows size={16} weight="duotone" />}
                title="Sheet Sizes"
                badge={`${formatNumber(totalSheets)} total`}
              >
                {sheetSizes.map(({ key, label, value }) => (
                  <BreakdownRow
                    key={key}
                    label={label}
                    value={value}
                    total={totalSheets}
                    color="var(--color-brand-text)"
                  />
                ))}
              </ReportSection>

              <ReportSection
                icon={<Bag size={16} weight="duotone" />}
                title="Plastic Bags"
                badge={`${formatNumber(report.totals.plasticBags?.total ?? 0)} total`}
              >
                {[
                  { label: 'Small bags', value: report.totals.plasticBags?.small ?? 0 },
                  { label: 'Large bags', value: report.totals.plasticBags?.large ?? 0 },
                ].map(({ label, value }) => (
                  <BreakdownRow
                    key={label}
                    label={label}
                    value={value}
                    total={report.totals.plasticBags?.total ?? 0}
                    color="var(--color-warning)"
                  />
                ))}
              </ReportSection>
            </div>
          </ReportGroup>
        </div>
      )}
    </div>
  );
};

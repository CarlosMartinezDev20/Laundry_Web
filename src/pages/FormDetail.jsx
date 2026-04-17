import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { CaretLeft, CheckCircle, Buildings, CalendarBlank, User, UserCheck, Tray, Bag, Note, PencilSimple, Hash } from '@phosphor-icons/react';
import { Skeleton } from '../components/UI/Skeleton';
import { ConfirmModal } from '../components/UI/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { ErrorState } from '../components/UI/ErrorState';
import { formatApiError } from '../utils/apiErrors';

const safeParseYmd = (iso) => {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

/* ── Helpers ── */
const StatusBadge = memo(function StatusBadge({ status }) {
  const key = (status && String(status).toUpperCase()) || '';
  const map = {
    APPROVED: 'approved',
    PENDING_APPROVAL: 'pending',
    PENDING: 'pending',
    DRAFT: 'draft',
  };
  const cls = map[key] ?? 'draft';
  return <span className={`status-badge ${cls}`}>{status}</span>;
});

const InfoRow = memo(function InfoRow({ icon: Icon, label, value, full = false }) {
  return (
    <div
      className="info-row form-detail__info-cell"
      style={{ gridColumn: full ? '1 / -1' : undefined }}
    >
      {Icon && (
        <span className="info-row-icon" aria-hidden>
          <Icon size={16} weight="duotone" />
        </span>
      )}
      <div className="min-w-0 flex flex-col">
        <span className="info-row-label">{label}</span>
        <span className="info-row-value">
          {value || <span className="text-subtle">—</span>}
        </span>
      </div>
    </div>
  );
});

/* ── Component ── */
export const FormDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast    = useToast();

  const [form, setForm]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [approveModal, setApproveModal] = useState(false);

  const roleName  = (user?.role?.name || user?.role || '').toString().toUpperCase();
  const canApprove = roleName === 'MANAGER' || roleName === 'ADMIN';

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    [],
  );

  const displayDate = useMemo(() => {
    if (!form?.date) return null;
    const parsed = safeParseYmd(form.date);
    return parsed ? dateFormatter.format(parsed) : String(form.date);
  }, [form?.date, dateFormatter]);

  const fetchForm = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api.get(`/forms/${id}`);
      setForm(data);
    } catch (err) {
      const msg = formatApiError(err);
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const handleApprove = useCallback(async () => {
    try {
      await api.patch(`/forms/${id}/approve`);
      toast.success('Form approved successfully');
      fetchForm();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  }, [fetchForm, id, toast]);

  /* ── Loading ── */
  if (loading) return (
    <div className="form-detail animate-fade-in">
      <div className="form-detail__hero form-detail__hero--loading">
        <Skeleton height="36px" width="120px" className="rounded-lg" />
        <div className="form-detail__title-block min-w-0 flex-1">
          <Skeleton height="28px" width="55%" className="max-w-md" />
          <Skeleton height="16px" width="40%" className="mt-2 max-w-sm" />
        </div>
        <Skeleton height="36px" width="100px" className="rounded-lg flex-shrink-0" />
      </div>
      <Card className="form-detail__card">
        <div className="section-title-bar mb-0">
          <div className="section-title-accent" />
          <Skeleton height="20px" width="180px" />
        </div>
        <div className="form-detail__info-grid form-detail__info-grid--skeleton mt-4">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <Skeleton key={k} height="88px" className="rounded-lg" />
          ))}
        </div>
      </Card>
      <Card className="form-detail__card">
        <Skeleton height="24px" width="200px" className="mb-4" />
        <Skeleton height="200px" className="rounded-lg" />
      </Card>
    </div>
  );

  if (loadError) {
    return (
      <div className="form-detail animate-fade-in flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button className="form-detail__back" onClick={() => navigate('/forms')}>
            <CaretLeft size={16} weight="bold" aria-hidden /> Volver
          </Button>
        </div>
        <ErrorState
          title="No se pudo cargar el formulario"
          message={loadError}
          onRetry={fetchForm}
          className="error-state--fill"
        />
      </div>
    );
  }

  if (!form) return (
    <div className="form-detail">
      <div className="empty-state form-detail__empty">
        <p className="empty-state-title">Form not found</p>
        <p className="empty-state-desc">It may have been removed or you don&apos;t have access.</p>
        <Button variant="primary" onClick={() => navigate('/forms')} className="mt-2">
          <CaretLeft size={16} aria-hidden /> Back to forms
        </Button>
      </div>
    </div>
  );

  const isApproved = form.status?.toUpperCase() === 'APPROVED';

  /* ── View ── */
  return (
    <div className="form-detail flex flex-col gap-6 animate-fade-in pb-10">

      <header className="form-detail__hero">
        <Button type="button" className="form-detail__back" onClick={() => navigate('/forms')} aria-label="Back to forms list">
          <CaretLeft size={18} weight="bold" aria-hidden />
          <span>Back</span>
        </Button>

        <div className="form-detail__title-block min-w-0">
          <p className="form-detail__eyebrow">
            <Hash size={13} weight="bold" className="form-detail__eyebrow-hash" aria-hidden />
            <span className="form-detail__eyebrow-id">{id}</span>
            {form.company?.name ? (
              <>
                <span className="form-detail__eyebrow-sep" aria-hidden>·</span>
                <span className="truncate">{form.company.name}</span>
              </>
            ) : null}
          </p>
          <h1 className="form-detail__title">Form details</h1>
          {displayDate && (
            <p className="form-detail__subtitle">{displayDate}</p>
          )}
        </div>

        <div className="form-detail__actions">
          <StatusBadge status={form.status} />
          {!isApproved && (
            <Button type="button" onClick={() => navigate(`/forms/${id}/edit`)} className="form-detail__btn-secondary">
              <PencilSimple size={16} aria-hidden /> Edit
            </Button>
          )}
          {canApprove && !isApproved && (
            <Button variant="success" onClick={() => setApproveModal(true)}>
              <CheckCircle size={16} weight="fill" aria-hidden /> Approve
            </Button>
          )}
        </div>
      </header>

      {/* General info */}
      <Card className="form-detail__card">
        <div className="form-detail__section-head">
          <div className="section-title-accent" aria-hidden />
          <div className="min-w-0">
            <h2 className="form-detail__section-title">General information</h2>
            <p className="form-detail__section-desc">Summary and logistics for this report.</p>
          </div>
        </div>

        <div className="form-detail__info-grid">
          <InfoRow icon={Buildings} label="Company" value={form.company?.name} />
          <InfoRow icon={CalendarBlank} label="Date" value={displayDate || form.date} />
          <InfoRow icon={User} label="Created by" value={form.createdBy?.name} />
          <InfoRow icon={UserCheck} label="Approved by" value={form.approvedBy?.name || 'Pending'} />
          <InfoRow icon={Tray} label="Pocket count" value={form.pocketCount} />
          <InfoRow icon={Bag} label="Bags (S / L)" value={`${form.plasticBagsSmall ?? 0} / ${form.plasticBagsLarge ?? 0}`} />
          {form.notes && <InfoRow icon={Note} label="Notes" value={form.notes} full />}
        </div>
      </Card>

      {/* Sections */}
      {form.sections?.length > 0 ? (
        form.sections.map((section, idx) => {
          const total = section.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) ?? 0;

          return (
            <Card key={idx} className="form-detail__card form-detail__card--section">
              <div className="form-detail__lineitems-head">
                <div className="form-detail__section-head form-detail__section-head--compact">
                  <div className="section-title-accent form-detail__section-accent" aria-hidden />
                  <h3 className="form-detail__lineitems-title capitalize">
                    {section.sectionName.replace(/_/g, ' ').toLowerCase()}
                  </h3>
                </div>

                <div className="form-detail__lineitems-meta">
                  {section.filledByInitials && (
                    <div className="form-detail__initials" title="Section initials">
                      <span className="form-detail__initials-avatar" aria-hidden>
                        {section.filledByInitials}
                      </span>
                      <span className="form-detail__initials-label">Initials</span>
                    </div>
                  )}
                  {total > 0 && (
                    <span className="form-detail__unit-pill">
                      {total} <span className="form-detail__unit-pill-muted">units</span>
                    </span>
                  )}
                </div>
              </div>

              {section.items?.length > 0 ? (
                <div className="table-wrapper form-detail__table-wrap">
                  <table className="table form-detail__table w-full">
                    <thead>
                      <tr>
                        <th className="form-detail__th-index">#</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th className="form-detail__th-qty">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.items.map((item, iIdx) => (
                        <tr key={iIdx}>
                          <td className="form-detail__td-index">{iIdx + 1}</td>
                          <td className="form-detail__td-cat">{item.category}</td>
                          <td>
                            <span
                              className={
                                item.isColored
                                  ? 'form-detail__fiber-pill form-detail__fiber-pill--brand'
                                  : 'form-detail__fiber-pill form-detail__fiber-pill--muted'
                              }
                            >
                              <span className="form-detail__fiber-dot" aria-hidden />
                              {item.isColored ? 'Colored' : 'Plain'}
                            </span>
                          </td>
                          <td className="form-detail__td-qty">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="form-detail__tfoot-row">
                        <td colSpan={3} className="form-detail__tfoot-label">
                          Total
                        </td>
                        <td className="form-detail__tfoot-val">{total}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="form-detail__inline-empty">
                  <p className="empty-state-desc mb-0">No items in this section.</p>
                </div>
              )}
            </Card>
          );
        })
      ) : (
        <Card className="form-detail__card">
          <div className="empty-state form-detail__empty form-detail__empty--soft">
            <p className="empty-state-title">No line items yet</p>
            <p className="empty-state-desc">Sections will appear here once the form is filled in.</p>
          </div>
        </Card>
      )}

      {/* Approve modal */}
      <ConfirmModal
        isOpen={approveModal}
        onClose={() => setApproveModal(false)}
        onConfirm={handleApprove}
        title="Approve Form"
        message="Are you sure you want to approve this report? This action will mark it as completed and lock it from further edits."
        confirmText="Yes, Approve"
        confirmVariant="success"
      />
    </div>
  );
};
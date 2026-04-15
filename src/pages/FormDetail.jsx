import React, { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { CaretLeft, CheckCircle, Buildings, CalendarBlank, User, UserCheck, Tray, Bag, Note } from '@phosphor-icons/react';
import { Skeleton } from '../components/UI/Skeleton';
import { ConfirmModal } from '../components/UI/ConfirmModal';
import { useToast } from '../context/ToastContext';

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
    className="info-row"
    style={{ gridColumn: full ? '1 / -1' : undefined }}
  >
    {Icon && (
      <span className="info-row-icon">
        <Icon size={15} weight="duotone" />
      </span>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <span className="info-row-label">{label}</span>
      <span className="info-row-value">
        {value || <span style={{ color: 'var(--color-text-subtle)', fontStyle: 'italic', fontWeight: 400 }}>—</span>}
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
  const [approveModal, setApproveModal] = useState(false);

  const roleName  = (user?.role?.name || user?.role || '').toString().toUpperCase();
  const canApprove = roleName === 'MANAGER' || roleName === 'ADMIN';

  const fetchForm = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/forms/${id}`);
      setForm(data);
    } catch {
      toast.error('Failed to load form');
      navigate('/forms');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const handleApprove = useCallback(async () => {
    try {
      await api.patch(`/forms/${id}/approve`);
      toast.success('Form approved successfully');
      fetchForm();
    } catch {
      toast.error('Failed to approve form');
    }
  }, [fetchForm, id, toast]);

  /* ── Loading ── */
  if (loading) return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton height="40px" width="30%" />
      <Card><Skeleton height="160px" /></Card>
      <Card><Skeleton height="220px" /></Card>
    </div>
  );

  if (!form) return (
    <div className="empty-state p-6">
      <p className="empty-state-title">Form not found.</p>
    </div>
  );

  const isApproved = form.status?.toUpperCase() === 'APPROVED';

  /* ── View ── */
  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/forms')}>
            <CaretLeft size={15} /> Back
          </Button>
          <div>
            <h2 style={{ marginBottom: 0 }}>Form Details</h2>
            <p className="text-sm text-muted" style={{ marginTop: 2 }}>
              #{id} · {form.company?.name}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={form.status} />
          {canApprove && !isApproved && (
            <Button variant="success" onClick={() => setApproveModal(true)}>
              <CheckCircle size={15} weight="fill" /> Approve Form
            </Button>
          )}
        </div>
      </div>

      {/* General info */}
      <Card>
        <div className="section-title-bar">
          <div className="section-title-accent" />
          <h3 style={{ marginBottom: 0 }}>General Information</h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '0 var(--spacing-6)',
        }}>
          <InfoRow icon={Buildings}     label="Company"      value={form.company?.name} />
          <InfoRow icon={CalendarBlank} label="Date"         value={form.date} />
          <InfoRow icon={User}          label="Created By"   value={form.createdBy?.name} />
          <InfoRow icon={UserCheck}     label="Approved By"  value={form.approvedBy?.name || 'Pending'} />
          <InfoRow icon={Tray}          label="Pocket Count" value={form.pocketCount} />
          <InfoRow icon={Bag}           label="Bags (S / L)" value={`${form.plasticBagsSmall ?? 0} / ${form.plasticBagsLarge ?? 0}`} />
          {form.notes && <InfoRow icon={Note} label="Notes" value={form.notes} full />}
        </div>
      </Card>

      {/* Sections */}
      {form.sections?.length > 0 ? (
        form.sections.map((section, idx) => {
          const total = section.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) ?? 0;

          return (
            <Card key={idx}>
              <div className="card-section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                  <div className="section-title-accent" style={{ background: 'var(--color-brand-mid)' }} />
                  <h3 className="capitalize" style={{ marginBottom: 0 }}>
                    {section.sectionName.replace(/_/g, ' ').toLowerCase()}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  {section.filledByInitials && (
                    <div className="flex items-center gap-2">
                      <div style={{
                        width: 26, height: 26,
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-brand-light)',
                        color: 'var(--color-brand-text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 'var(--font-size-xs)', fontWeight: 700,
                      }}>
                        {section.filledByInitials}
                      </div>
                      <span className="text-xs text-muted">Initials</span>
                    </div>
                  )}
                  {total > 0 && (
                    <span style={{
                      fontSize: 'var(--font-size-xs)', fontWeight: 600,
                      color: 'var(--color-brand-text)',
                      background: 'var(--color-brand-light)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.2rem 0.65rem',
                    }}>
                      {total} total units
                    </span>
                  )}
                </div>
              </div>

              {section.items?.length > 0 ? (
                <div className="table-wrapper">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Category</th>
                        <th>Colored</th>
                        <th style={{ textAlign: 'right' }}>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.items.map((item, iIdx) => (
                        <tr key={iIdx}>
                          <td style={{ color: 'var(--color-text-subtle)', fontVariantNumeric: 'tabular-nums' }}>
                            {iIdx + 1}
                          </td>
                          <td style={{ fontWeight: 500 }}>{item.category}</td>
                          <td>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 'var(--font-size-xs)', fontWeight: 600,
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-full)',
                              background: item.isColored ? 'var(--color-brand-light)' : 'var(--color-surface-hover)',
                              color: item.isColored ? 'var(--color-brand-text)' : 'var(--color-text-muted)',
                              border: '1px solid',
                              borderColor: item.isColored ? 'rgba(30,58,95,0.15)' : 'var(--color-border)',
                            }}>
                              <span style={{
                                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                                background: item.isColored ? 'var(--color-brand)' : 'var(--color-text-subtle)',
                              }} />
                              {item.isColored ? 'Colored' : 'Plain'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                            {item.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} style={{
                          fontWeight: 600, fontSize: 'var(--font-size-xs)',
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          color: 'var(--color-text-muted)',
                          borderTop: '2px solid var(--color-border)',
                        }}>
                          Total
                        </td>
                        <td style={{
                          textAlign: 'right', fontWeight: 700,
                          fontSize: 'var(--font-size-base)',
                          borderTop: '2px solid var(--color-border)',
                        }}>
                          {total}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 'var(--spacing-6)' }}>
                  <p className="empty-state-desc">No items in this section.</p>
                </div>
              )}
            </Card>
          );
        })
      ) : (
        <Card>
          <div className="empty-state">
            <p className="empty-state-title">This form is empty.</p>
            <p className="empty-state-desc">No sections have been added yet.</p>
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
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/UI/Card';
import { Input } from '../components/UI/Input';
import { Select } from '../components/UI/Select';
import { Button } from '../components/UI/Button';
import { FloppyDisk, CaretLeft, Check, Lock } from '@phosphor-icons/react';
import { Skeleton } from '../components/UI/Skeleton';
import { useToast } from '../context/ToastContext';
import { ErrorState } from '../components/UI/ErrorState';
import { formatApiError, isAbortError } from '../utils/apiErrors';
import { useAuth } from '../context/AuthContext';

/** Calendar date in the user's local timezone (avoid `toISOString()` which is UTC and can shift the day). */
const toYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/* ── Stepper Component ── */
const Stepper = memo(function Stepper({ steps, activeIndex, onStepClick }) {
  return (
    <div className="stepper">
      {steps.map((step, i) => {
        const isDone = i < activeIndex;
        const isActive = i === activeIndex;
        return (
          <React.Fragment key={`step-${i}`}>
            {i > 0 && <div className={`step-connector ${isDone ? 'done' : ''}`} />}
            <div
              role="button"
              tabIndex={0}
              className={`step-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
              onClick={() => onStepClick(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onStepClick(i);
                }
              }}
            >
              <div className="step-circle">
                {isDone ? <Check size={14} weight="bold" /> : i + 1}
              </div>
              <span className="step-label">{step}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
});

export const FormCreateEdit = () => {
  const toast = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(!!id);
  const [loadError, setLoadError] = useState(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [activeStep, setActiveStep] = useState(0); // 0 = General, 1+ = sections
  const roleName = (user?.role?.name || user?.role || '').toString().toUpperCase();
  const isManagerOrAdmin = roleName === 'MANAGER' || roleName === 'ADMIN';

  const [formData, setFormData] = useState({
    companyId: '',
    date: toYMD(new Date()),
    pocketCount: 0,
    plasticBagsSmall: 0,
    plasticBagsLarge: 0,
    notes: '',
    status: 'DRAFT',
    sections: [
      { sectionName: 'TOWELS',     filledByInitials: '', items: [] },
      { sectionName: 'BED_SHEETS', filledByInitials: '', items: [] },
    ],
  });

  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;
    setLoadError(null);

    const load = async () => {
      try {
        const [comps, items, users] = await Promise.all([
          api.get('/companies', { signal }),
          api.get('/forms/catalog', { signal }),
          api.get('/users', { signal }),
        ]);
        if (signal.aborted) return;
        setCompanies(comps);
        setEmployees(users);

        if (!id) {
          const initialSections = [
            { sectionName: 'TOWELS', filledByInitials: '', items: [] },
            { sectionName: 'BED_SHEETS', filledByInitials: '', items: [] },
            { sectionName: 'COVERS', filledByInitials: '', items: [] },
          ];
          items.forEach((item) => {
            const idx = initialSections.findIndex((s) => s.sectionName === item.category);
            if (idx !== -1) {
              initialSections[idx].items.push({ category: item.name, std: 0, clr: 0 });
            }
          });
          setFormData((prev) => ({ ...prev, sections: initialSections }));
        }
      } catch (e) {
        if (isAbortError(e)) return;
        setLoadError(formatApiError(e));
        setFetching(false);
        return;
      }

      if (!id || signal.aborted) {
        if (!signal.aborted) setFetching(false);
        return;
      }

      try {
        const data = await api.get(`/forms/${id}`, { signal });
        if (signal.aborted) return;
        const parsedSections = (data.sections || []).map((section) => {
          const groupedItems = [];
          const itemsMap = {};
          section.items.forEach((item) => {
            if (!itemsMap[item.category]) {
              itemsMap[item.category] = { category: item.category, std: 0, clr: 0 };
              groupedItems.push(itemsMap[item.category]);
            }
            if (item.isColored) itemsMap[item.category].clr = item.quantity;
            else itemsMap[item.category].std = item.quantity;
          });
          return { ...section, items: groupedItems };
        });
        setFormData({
          companyId: data.company.id,
          date: data.date,
          pocketCount: data.pocketCount,
          plasticBagsSmall: data.plasticBagsSmall,
          plasticBagsLarge: data.plasticBagsLarge,
          notes: data.notes || '',
          status: data.status,
          sections: parsedSections,
        });
      } catch (e) {
        if (!isAbortError(e)) setLoadError(formatApiError(e));
      } finally {
        if (!signal.aborted) setFetching(false);
      }
    };

    if (id) setFetching(true);
    load();

    return () => ac.abort();
  }, [id, reloadNonce]);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setReloadNonce((n) => n + 1);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  }, []);

  const handleItemChange = useCallback((sectionIdx, itemIdx, field, value) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIdx] = { ...newSections[sectionIdx] };
      newSections[sectionIdx].items = [...newSections[sectionIdx].items];
      newSections[sectionIdx].items[itemIdx] = {
        ...newSections[sectionIdx].items[itemIdx],
        [field]: value,
      };
      return { ...prev, sections: newSections };
    });
  }, []);

  const handleFilledByChange = useCallback((sectionIdx, value) => {
    const v = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    setFormData((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIdx] = { ...newSections[sectionIdx], filledByInitials: v };
      return { ...prev, sections: newSections };
    });
  }, []);

  const handleStepClick = useCallback((i) => setActiveStep(i), []);

  const stepNames = useMemo(
    () => ['General', ...formData.sections.map((s) => s.sectionName.replace(/_/g, ' ').toLowerCase())],
    [formData.sections],
  );

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const missingInitialsSection = formData.sections.find(
      (section) => !String(section.filledByInitials || '').trim(),
    );
    if (missingInitialsSection) {
      toast.error(`Select initials for section: ${missingInitialsSection.sectionName.replace(/_/g, ' ').toLowerCase()}`);
      const sectionIdx = formData.sections.findIndex((s) => s.sectionName === missingInitialsSection.sectionName);
      if (sectionIdx >= 0) setActiveStep(sectionIdx + 1);
      return;
    }

    const submitStatus = isManagerOrAdmin ? formData.status : 'PENDING_APPROVAL';
    setLoading(true);
    const submissionData = {
      ...formData,
      status: submitStatus,
      sections: formData.sections.map(section => ({
        ...section,
        items: section.items.flatMap(item => [
          { category: item.category, isColored: false, quantity: item.std || 0 },
          { category: item.category, isColored: true,  quantity: item.clr || 0 },
        ]).filter(item => item.quantity > 0),
      })),
    };
    try {
      if (id) await api.patch(`/forms/${id}`, submissionData);
      else    await api.post('/forms', submissionData);
      toast.success('Form saved successfully');
      navigate('/forms');
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  /* ── Loading ── */
  if (fetching) return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton height="40px" width="30%" />
      <Card><Skeleton height="400px" /></Card>
    </div>
  );

  if (loadError) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in p-6">
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/forms')}><CaretLeft size={16} /> Volver</Button>
        </div>
        <ErrorState
          title="Could not load the form"
          message={loadError}
          onRetry={retryLoad}
          className="error-state--fill"
        />
      </div>
    );
  }

  /* ── Approved notice ── */
  if (formData.status === 'APPROVED') {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate('/forms')}><CaretLeft size={16} /> Back</Button>
          <h2 style={{ marginBottom: 0 }}>Form Details</h2>
        </div>
        <div className="approved-notice">
          <div className="approved-notice-icon">
            <Lock size={28} weight="duotone" />
          </div>
          <h3 style={{ marginBottom: 0, color: 'var(--color-success)' }}>Form Approved</h3>
          <p className="text-sm text-muted" style={{ maxWidth: 320 }}>
            This form has been approved and is locked from further edits.
          </p>
          <Button variant="primary" onClick={() => navigate(`/forms/${id}`)}>
            View Form Details
          </Button>
        </div>
      </div>
    );
  }

  const sectionIndex = activeStep - 1; // -1 when General

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">

      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate(-1)}><CaretLeft size={16} /> Back</Button>
          <h2 style={{ marginBottom: 0 }}>{id ? 'Edit Form' : 'New Form'}</h2>
        </div>
      </div>

      {/* ── Stepper ── */}
      <Stepper steps={stepNames} activeIndex={activeStep} onStepClick={handleStepClick} />

      {/* ── General Info ── */}
      {activeStep === 0 && (
        <Card>
          <div className="section-title-bar">
            <div className="section-title-accent" />
            <h3 style={{ marginBottom: 0 }}>General Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginTop: 'var(--spacing-4)' }}>
            <Select
              label="Company"
              name="companyId"
              value={formData.companyId}
              onChange={handleChange}
              required
            >
              <option value="">Select a company</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Input
              type="date"
              label="Form date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
            <Input
              type="number"
              label="Pocket count"
              name="pocketCount"
              value={formData.pocketCount}
              onChange={handleChange}
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="0"
            />
            <Input
              type="number"
              label="Plastic bags (small)"
              name="plasticBagsSmall"
              value={formData.plasticBagsSmall}
              onChange={handleChange}
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="0"
            />
            <Input
              type="number"
              label="Plastic bags (large)"
              name="plasticBagsLarge"
              value={formData.plasticBagsLarge}
              onChange={handleChange}
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="0"
            />
            {isManagerOrAdmin ? (
              <Select label="Status" name="status" value={formData.status} onChange={handleChange}>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending approval</option>
              </Select>
            ) : (
              <div className="input-group">
                <label className="input-label">Status</label>
                <input className="input-field" value="Pending approval" disabled />
              </div>
            )}
          </div>
          <div className="input-group" style={{ marginTop: 'var(--spacing-4)' }}>
            <label htmlFor="form-notes" className="input-label">Notes (optional)</label>
            <textarea
              id="form-notes"
              name="notes"
              className="input-field"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Special instructions, incidents, etc."
            />
          </div>
        </Card>
      )}

      {/* ── Section forms ── */}
      {sectionIndex >= 0 && sectionIndex < formData.sections.length && (() => {
        const section = formData.sections[sectionIndex];
        const sIdx = sectionIndex;
        return (
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end mb-4">
              <div className="section-title-bar" style={{ marginBottom: 0 }}>
                <div className="section-title-accent" style={{ background: 'var(--color-brand-mid)' }} />
                <h3 className="capitalize" style={{ marginBottom: 0 }}>
                  {section.sectionName.replace(/_/g, ' ').toLowerCase()}
                </h3>
              </div>
              <div className="input-group" style={{ width: '100%', maxWidth: '220px' }}>
                <label className="input-label">Filled by (initials)</label>
                <select
                  name={`filledByInitials-${sIdx}`}
                  className="input-field"
                  value={section.filledByInitials || ''}
                  onChange={(e) => handleFilledByChange(sIdx, e.target.value)}
                >
                  <option value="">Select initials</option>
                  {employees
                    .filter((emp) => String(emp.initials || '').trim())
                    .map((emp) => (
                      <option key={emp.id} value={emp.initials.toUpperCase()}>
                        {emp.initials.toUpperCase()} - {emp.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="text-center">Standard</th>
                    <th className="text-center">Color</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.map((item, iIdx) => (
                    <tr key={iIdx}>
                      <td style={{ fontWeight: 600 }}>{item.category}</td>
                                           <td>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          className="input-field w-full text-center"
                          style={{ minWidth: '4.5rem' }}
                          value={item.std}
                          onChange={e => handleItemChange(sIdx, iIdx, 'std', parseInt(e.target.value, 10) || 0)}
                          aria-label={`${item.category} standard quantity`}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          className="input-field w-full text-center"
                          style={{ minWidth: '4.5rem' }}
                          value={item.clr}
                          onChange={e => handleItemChange(sIdx, iIdx, 'clr', parseInt(e.target.value, 10) || 0)}
                          aria-label={`${item.category} color quantity`}
                        />
                      </td>
                      <td className="text-right" style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {(item.std || 0) + (item.clr || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })()}

      {/* ── Navigation Buttons ── */}
      <div className="flex justify-between items-center">
        <Button
          onClick={() => setActiveStep(prev => prev - 1)}
          disabled={activeStep === 0}
        >
          Previous
        </Button>

        {activeStep < stepNames.length - 1 ? (
          <Button variant="action" onClick={() => setActiveStep(prev => prev + 1)}>
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ padding: '0.625rem 1.5rem' }}
          >
            <FloppyDisk size={16} />
            {loading ? 'Saving...' : 'Finish & Save'}
          </Button>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { Card } from '../components/UI/Card';
import { Table } from '../components/UI/Table';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { FormModal } from '../components/UI/FormModal';
import { ConfirmModal } from '../components/UI/ConfirmModal';
import { TableSkeleton } from '../components/UI/TableSkeleton';
import { useToast } from '../context/ToastContext';
import { ErrorState } from '../components/UI/ErrorState';
import { formatApiError } from '../utils/apiErrors';
import { Trash, PencilSimple, Buildings, Plus } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissionUtils';

export const CompaniesManagement = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState(null);

  /* ── Create modal ── */
  const [createModal, setCreateModal] = useState(false);
  const [newName, setNewName]         = useState('');
  const newNameRef = useRef(newName);
  newNameRef.current = newName;
  const [creating, setCreating]       = useState(false);

  /* ── Edit modal ── */
  const [editModal, setEditModal] = useState({ isOpen: false, company: null });
  const [editName, setEditName]   = useState('');
  const editNameRef = useRef(editName);
  editNameRef.current = editName;
  const [saving, setSaving]       = useState(false);

  /* ── Delete modal ── */
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const fetchCompanies = useCallback(async () => {
    setFetchError(null);
    try {
      const data = await api.get('/companies');
      setCompanies(data);
    } catch (err) {
      const msg = formatApiError(err);
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  /* ── Create ── */
  const handleCreate = useCallback(
    async (e) => {
      e.preventDefault();
      const name = newNameRef.current.trim();
      if (!name) return;
      setCreating(true);
      try {
        await api.post('/companies', { name });
        setNewName('');
        setCreateModal(false);
        toast.success('Company created');
        fetchCompanies();
      } catch (err) {
        toast.error(formatApiError(err));
      } finally {
        setCreating(false);
      }
    },
    [fetchCompanies, toast],
  );

  /* ── Edit ── */
  const openEdit = useCallback((company) => {
    setEditName(company.name);
    setEditModal({ isOpen: true, company });
  }, []);

  const handleEdit = useCallback(
    async (e) => {
      e.preventDefault();
      const name = editNameRef.current.trim();
      if (!name) {
        toast.error('Name cannot be empty');
        return;
      }
      const company = editModal.company;
      if (!company?.id) return;
      setSaving(true);
      try {
        await api.patch(`/companies/${company.id}`, { name });
        toast.success('Company updated');
        setEditModal({ isOpen: false, company: null });
        fetchCompanies();
      } catch (err) {
        toast.error(formatApiError(err));
      } finally {
        setSaving(false);
      }
    },
    [editModal.company, fetchCompanies, toast],
  );

  /* ── Delete ── */
  const confirmDelete = useCallback(async () => {
    try {
      await api.delete(`/companies/${deleteModal.id}`);
      toast.success('Company deleted');
      fetchCompanies();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  }, [deleteModal.id, fetchCompanies, toast]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-subtitle">Manage client companies</p>
        </div>
        {hasPermission(user, 'Companies', 'Add') && (
          <Button variant="primary" onClick={() => setCreateModal(true)} className="w-full sm:w-fit">
            <Plus size={16} /> Add Company
          </Button>
        )}
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {!loading && fetchError ? (
          <ErrorState
            title="Could not load companies"
            message={fetchError}
            onRetry={fetchCompanies}
            className="error-state--fill"
          />
        ) : loading ? (
          <div style={{ padding: 'var(--spacing-6)' }}>
            <TableSkeleton rows={4} columns={3} />
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <Table headers={['Company Name', 'Created', 'Actions']}>
              {companies.map(company => (
                <tr key={company.id}>
                  <td style={{ fontWeight: 500 }}>{company.name}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {hasPermission(user, 'Companies', 'Edit') && (
                        <button className="icon-btn" onClick={() => openEdit(company)} title="Edit company">
                          <PencilSimple size={15} />
                        </button>
                      )}
                      {hasPermission(user, 'Companies', 'Delete') && (
                        <button
                          className="icon-btn danger"
                          onClick={() => setDeleteModal({ isOpen: true, id: company.id })}
                          title="Delete company"
                        >
                          <Trash size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan="3">
                    <div className="empty-state">
                      <Buildings size={48} weight="thin" />
                      <div>
                        <div className="empty-state-title">No companies yet</div>
                        <div className="empty-state-desc">Add your first company using the button above.</div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <FormModal
        isOpen={createModal}
        onClose={() => { setCreateModal(false); setNewName(''); }}
        title="Add new company"
        subtitle="Enter the name of the client company"
        onSubmit={handleCreate}
        submitText="Create Company"
        isSubmitting={creating}
      >
        <Input
          label="Company name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. Hotel Plaza"
          required
          autoFocus
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, company: null })}
        title="Edit company"
        subtitle={`Editing: ${editModal.company?.name || ''}`}
        onSubmit={handleEdit}
        submitText="Save changes"
        isSubmitting={saving}
      >
        <Input
          label="Company name"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="e.g. Hotel Plaza"
          required
          autoFocus
        />
      </FormModal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete company"
        message="Are you sure you want to delete this company? This will also remove any associated relationships."
        confirmText="Delete"
      />
    </div>
  );
};

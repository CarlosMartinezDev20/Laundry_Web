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
import { Trash, PencilSimple, UsersThree, Plus } from '@phosphor-icons/react';

const EMPTY_CREATE_USER = { name: '', email: '', password: '', initials: '', roleId: '' };

export const EmployeesManagement = () => {
  const toast = useToast();
  const [users, setUsers]     = useState([]);
  const [roles, setRoles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  /* ── Create modal ── */
  const [createModal, setCreateModal] = useState(false);
  const [createData, setCreateData]   = useState(EMPTY_CREATE_USER);
  const createDataRef = useRef(createData);
  createDataRef.current = createData;
  const [creating, setCreating]       = useState(false);

  /* ── Edit modal ── */
  const [editModal, setEditModal] = useState({ isOpen: false, user: null });
  const [editData, setEditData]   = useState({});
  const editDataRef = useRef(editData);
  editDataRef.current = editData;
  const [saving, setSaving]       = useState(false);

  /* ── Delete modal ── */
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const fetchData = useCallback(async () => {
    setFetchError(null);
    try {
      const [usersData, rolesData] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      if (rolesData.length > 0) {
        setCreateData((prev) => ({ ...prev, roleId: rolesData[0].id }));
      }
    } catch (err) {
      const msg = formatApiError(err);
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Create ── */
  const handleCreate = useCallback(
    async (e) => {
      e.preventDefault();
      const data = createDataRef.current;
      if (!data.name || !data.email || !data.password) return;
      setCreating(true);
      try {
        await api.post('/users', data);
        setCreateData({ ...EMPTY_CREATE_USER, roleId: roles[0]?.id || '' });
        setCreateModal(false);
        toast.success('User created');
        fetchData();
      } catch (err) {
        toast.error(formatApiError(err));
      } finally {
        setCreating(false);
      }
    },
    [fetchData, roles, toast],
  );

  /* ── Edit ── */
  const openEdit = useCallback((employee) => {
    setEditData({
      name:     employee.name,
      email:    employee.email,
      initials: employee.initials || '',
      roleId:   employee.role?.id || '',
      password: '',
    });
    setEditModal({ isOpen: true, user: employee });
  }, []);

  const handleEdit = useCallback(
    async (e) => {
      e.preventDefault();
      const data = editDataRef.current;
      const targetUser = editModal.user;
      if (!targetUser?.id) return;
      setSaving(true);
      try {
        const payload = {
          name:     data.name,
          email:    data.email,
          initials: data.initials,
          roleId:   data.roleId,
        };
        if (data.password) payload.password = data.password;
        await api.patch(`/users/${targetUser.id}`, payload);
        toast.success('User updated');
        setEditModal({ isOpen: false, user: null });
        fetchData();
      } catch (err) {
        toast.error(formatApiError(err));
      } finally {
        setSaving(false);
      }
    },
    [editModal.user, fetchData, toast],
  );

  /* ── Delete ── */
  const confirmDelete = useCallback(async () => {
    try {
      await api.delete(`/users/${deleteModal.id}`);
      toast.success('User deleted');
      fetchData();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  }, [deleteModal.id, fetchData, toast]);

  const onCreateChange = useCallback((e) => {
    const { name, value } = e.target;
    setCreateData((prev) => ({ ...prev, [name]: value }));
  }, []);
  const onEditChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage system users and roles</p>
        </div>
        <Button variant="primary" onClick={() => setCreateModal(true)} className="w-full sm:w-fit">
          <Plus size={16} /> Add User
        </Button>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {!loading && fetchError ? (
          <ErrorState
            title="Could not load users"
            message={fetchError}
            onRetry={fetchData}
            className="error-state--fill"
          />
        ) : loading ? (
          <div style={{ padding: 'var(--spacing-6)' }}>
            <TableSkeleton rows={4} columns={5} />
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <Table headers={['Name', 'Email', 'Initials', 'Role', 'Actions']}>
              {users.map(employee => (
                <tr key={employee.id}>
                  <td style={{ fontWeight: 500 }}>{employee.name}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{employee.email}</td>
                  <td>{employee.initials || '—'}</td>
                  <td>
                    <span className="sidebar-role-badge">
                      {(employee.role?.name || '—').toLowerCase()}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="icon-btn" onClick={() => openEdit(employee)} title="Edit user">
                        <PencilSimple size={15} />
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => setDeleteModal({ isOpen: true, id: employee.id })}
                        title="Delete user"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">
                      <UsersThree size={48} weight="thin" />
                      <div>
                        <div className="empty-state-title">No users found</div>
                        <div className="empty-state-desc">Add a user using the button above.</div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Table>
          </div>
        )}
      </Card>

      {/* ── Create Modal ── */}
      <FormModal
        isOpen={createModal}
        onClose={() => { setCreateModal(false); setCreateData({ ...EMPTY_CREATE_USER, roleId: roles[0]?.id || '' }); }}
        title="Add new user"
        subtitle="Create a new system user with role assignment"
        onSubmit={handleCreate}
        submitText="Create User"
        isSubmitting={creating}
        width="520px"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Full name" name="name" value={createData.name} onChange={onCreateChange} placeholder="John Doe" required autoFocus />
          <Input label="Initials" name="initials" value={createData.initials} onChange={onCreateChange} placeholder="e.g. JD" maxLength={3} />
        </div>
        <Input label="Email" type="email" name="email" value={createData.email} onChange={onCreateChange} placeholder="john@example.com" required />
        <Input label="Password" type="password" name="password" value={createData.password} onChange={onCreateChange} placeholder="Create a password" required />
        <div className="input-group">
          <label className="input-label">Role</label>
          <select name="roleId" value={createData.roleId} onChange={onCreateChange} className="input-field">
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </FormModal>

      {/* ── Edit Modal ── */}
      <FormModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, user: null })}
        title="Edit user"
        subtitle={editModal.user?.name}
        onSubmit={handleEdit}
        submitText="Save changes"
        isSubmitting={saving}
        width="520px"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Full name" name="name" value={editData.name || ''} onChange={onEditChange} required autoFocus />
          <Input label="Initials" name="initials" value={editData.initials || ''} onChange={onEditChange} placeholder="e.g. JD" maxLength={3} />
        </div>
        <Input label="Email" type="email" name="email" value={editData.email || ''} onChange={onEditChange} required />
        <div className="input-group">
          <label className="input-label">Role</label>
          <select name="roleId" value={editData.roleId || ''} onChange={onEditChange} className="input-field">
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="divider" style={{ margin: '4px 0' }} />
        <p className="text-xs text-subtle" style={{ marginBottom: '4px' }}>
          Leave the password field empty to keep the current password.
        </p>
        <Input label="New password" type="password" name="password" value={editData.password || ''} onChange={onEditChange} placeholder="Leave blank to keep current" />
      </FormModal>

      {/* ── Delete Modal ── */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete user"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};

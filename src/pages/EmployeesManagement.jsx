import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Card } from '../components/UI/Card';
import { Table } from '../components/UI/Table';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Trash, PencilSimple, Check, X, UsersThree } from '@phosphor-icons/react';
import { TableSkeleton } from '../components/UI/TableSkeleton';
import { ConfirmModal } from '../components/UI/ConfirmModal';
import { useToast } from '../context/ToastContext';

export const EmployeesManagement = () => {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    initials: '',
    roleId: ''
  });

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([
        api.get('/users'),
        api.get('/roles')
      ]);
      setEmployees(usersData);
      setRoles(rolesData);
      if (rolesData.length > 0) {
        setFormData(prev => ({ ...prev, roleId: rolesData[0].id }));
      }
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return;
    try {
      await api.post('/users', formData);
      setFormData({ name: '', email: '', password: '', initials: '', roleId: roles[0]?.id || '' });
      toast.success('Employee created successfully');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to create employee');
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/users/${deleteModal.id}`);
      toast.success('Employee deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete employee');
    }
  };

  const startEdit = (employee) => {
    setEditingId(employee.id);
    setEditData({
      name: employee.name,
      email: employee.email,
      initials: employee.initials || '',
      roleId: employee.role?.id || '',
      password: '' // Only filled if they want to change it
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (id) => {
    try {
      const payload = {
        name: editData.name,
        email: editData.email,
        initials: editData.initials,
        roleId: editData.roleId
      };
      if (editData.password) {
        payload.password = editData.password;
      }
      
      await api.patch(`/users/${id}`, payload);
      setEditingId(null);
      toast.success('Employee updated successfully');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to update employee');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2>Employees Management</h2>
      </div>

      <Card>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start md:items-end">
          <Input label="Name" name="name" value={formData.name} onChange={handleInputChange} required />
          <Input label="Email" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
          <Input label="Password" type="password" name="password" value={formData.password} onChange={handleInputChange} required />
          <Input label="Initials" name="initials" value={formData.initials} onChange={handleInputChange} maxLength={3} />
          
          <div className="input-group">
            <label className="input-label">Role</label>
            <select name="roleId" value={formData.roleId} onChange={handleInputChange} className="input-field cursor-pointer">
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          
          <div>
            <Button type="submit" variant="primary" className="w-full">
              Add Employee
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        {loading ? (
          <TableSkeleton rows={4} columns={6} />
        ) : (
          <div className="table-wrapper">
            <Table headers={['Name', 'Email', 'Initials', 'Role', 'New Password', 'Actions']}>
              {employees.map(employee => {
                const isEditing = editingId === employee.id;

                return (
                  <tr key={employee.id}>
                    <td>
                      {isEditing ? <Input name="name" value={editData.name} onChange={handleEditChange} /> : employee.name}
                    </td>
                    <td>
                      {isEditing ? <Input name="email" type="email" value={editData.email} onChange={handleEditChange} /> : employee.email}
                    </td>
                    <td>
                      {isEditing ? <Input name="initials" maxLength={3} value={editData.initials} onChange={handleEditChange} style={{ width: '80px' }} /> : (employee.initials || '-')}
                    </td>
                    <td>
                      {isEditing ? (
                        <select name="roleId" value={editData.roleId} onChange={handleEditChange} className="input-field cursor-pointer" style={{ width: '130px' }}>
                          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      ) : employee.role?.name}
                    </td>
                    <td>
                      {isEditing ? (
                        <Input name="password" type="password" placeholder="Leave blank to keep" value={editData.password} onChange={handleEditChange} />
                      ) : '••••••••'}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button variant="primary" onClick={() => saveEdit(employee.id)}>
                              <Check size={16} /> Save
                            </Button>
                            <Button onClick={cancelEdit}>
                              <X size={16} /> Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button onClick={() => startEdit(employee)}>
                              <PencilSimple size={16} /> Edit
                            </Button>
                            <Button variant="danger" onClick={() => handleDeleteClick(employee.id)}>
                              <Trash size={16} /> Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted p-8">
                    <div className="flex flex-col items-center gap-2">
                       <UsersThree size={48} weight="thin" />
                       <span style={{ fontSize: '0.9rem' }}>No employees found. Complete the form to add one.</span>
                    </div>
                  </td>
                </tr>
              )}
            </Table>
          </div>
        )}
      </Card>

      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Card } from '../components/UI/Card';
import { Table } from '../components/UI/Table';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Trash, PencilSimple, Check, X, Buildings } from '@phosphor-icons/react';
import { TableSkeleton } from '../components/UI/TableSkeleton';
import { ConfirmModal } from '../components/UI/ConfirmModal';
import { useToast } from '../context/ToastContext';

export const CompaniesManagement = () => {
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const data = await api.get('/companies');
      setCompanies(data);
    } catch (err) {
      toast.error('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    try {
      await api.post('/companies', { name: newCompanyName });
      setNewCompanyName('');
      toast.success('Company created successfully');
      fetchCompanies();
    } catch (err) {
      toast.error('Failed to create company');
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/companies/${deleteModal.id}`);
      toast.success('Company deleted successfully');
      fetchCompanies();
    } catch (err) {
      toast.error('Failed to delete company');
    }
  };

  const startEdit = (company) => {
    setEditingId(company.id);
    setEditName(company.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) {
      toast.error('Company name cannot be empty');
      return;
    }
    try {
      await api.patch(`/companies/${id}`, { name: editName });
      setEditingId(null);
      toast.success('Company updated successfully');
      fetchCompanies();
    } catch (err) {
      toast.error('Failed to update company');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2>Companies Management</h2>
      </div>

      <Card>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start md:items-end">
          <Input 
            label="New Company Name" 
            value={newCompanyName} 
            onChange={(e) => setNewCompanyName(e.target.value)} 
            placeholder="e.g. Hotel Plaza"
            className="flex-1"
          />
          <div>
            <Button type="submit" variant="primary" className="w-full">
              Add Company
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        {loading ? (
          <TableSkeleton rows={4} columns={3} />
        ) : (
          <Table headers={['Company Name', 'Created At', 'Actions']}>
            {companies.map(company => {
              const isEditing = editingId === company.id;
              
              return (
                <tr key={company.id}>
                  <td>
                    {isEditing ? (
                      <Input 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full"
                        autoFocus
                      />
                    ) : (
                      company.name
                    )}
                  </td>
                  <td>{new Date(company.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button variant="primary" onClick={() => saveEdit(company.id)}>
                            <Check size={16} /> Save
                          </Button>
                          <Button onClick={cancelEdit}>
                            <X size={16} /> Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => startEdit(company)}>
                            <PencilSimple size={16} /> Edit
                          </Button>
                          <Button variant="danger" onClick={() => handleDeleteClick(company.id)}>
                            <Trash size={16} /> Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {companies.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center text-muted p-8">
                  <div className="flex flex-col items-center gap-2">
                     <Buildings size={48} weight="thin" />
                     <span style={{ fontSize: '0.9rem' }}>No companies found. Create one above to get started.</span>
                  </div>
                </td>
              </tr>
            )}
          </Table>
        )}
      </Card>

      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Company"
        message="Are you sure you want to delete this company? This will also remove any user relationships."
        confirmText="Delete"
      />
    </div>
  );
};

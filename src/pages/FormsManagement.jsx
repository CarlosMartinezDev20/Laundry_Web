import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/UI/Card';
import { Table } from '../components/UI/Table';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { 
  MagnifyingGlass, Plus, Eye, PencilSimple, Trash, CheckCircle,
  Buildings, User, Tag, CalendarBlank, Calendar, FolderDashed, FileText 
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/UI/TableSkeleton';
import { ConfirmModal } from '../components/UI/ConfirmModal';
import { useToast } from '../context/ToastContext';

export const FormsManagement = () => {
  const toast = useToast();
  const [forms, setForms] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({ today: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [approveModal, setApproveModal] = useState({ isOpen: false, id: null });
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleName = (user?.role?.name || user?.role || '').toString().toUpperCase();
  const isAdminOrManager = roleName === 'ADMIN' || roleName === 'MANAGER';

  const [filters, setFilters] = useState({
    companyId: '',
    status: '',
    employeeId: '',
    startDate: '',
    endDate: '',
    week: ''
  });

  useEffect(() => {
    fetchForms();
    fetchStats();
    
    Promise.all([
      api.get('/companies').catch(() => []),
      api.get('/users').catch(() => [])
    ]).then(([comps, emps]) => {
      setCompanies(comps);
      setEmployees(emps);
    });
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.get('/forms/stats');
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchForms = async () => {
    setLoading(true);
    let query = '?';
    if (filters.companyId) query += `companyId=${filters.companyId}&`;
    if (filters.status) query += `status=${filters.status}&`;
    if (filters.employeeId) query += `employeeId=${filters.employeeId}&`;
    if (filters.startDate) query += `startDate=${filters.startDate}&`;
    if (filters.endDate) query += `endDate=${filters.endDate}&`;
    
    try {
      const data = await api.get(`/forms${query}`);
      setForms(data);
    } catch (err) {
      toast.error('Failed to fetch forms. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // Automatically parse week into startDate / endDate boundaries
    if (name === 'week' && value) {
      const [year, weekStr] = value.split('-W');
      const w = parseInt(weekStr, 10);
      const simple = new Date(year, 0, 1 + (w - 1) * 7);
      const dow = simple.getDay();
      const start = simple;
      if (dow <= 4) {
        start.setDate(simple.getDate() - simple.getDay() + 1);
      } else {
        start.setDate(simple.getDate() + 8 - simple.getDay());
      }
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      const format = d => d.toISOString().split('T')[0];
      setFilters(prev => ({
        ...prev,
        week: value,
        startDate: format(start),
        endDate: format(end)
      }));
      return;
    } else if (name === 'week' && !value) {
      setFilters(prev => ({ ...prev, week: '', startDate: '', endDate: '' }));
      return;
    }

    if (name === 'startDate' || name === 'endDate') {
      setFilters(prev => ({ ...prev, [name]: value, week: '' }));
      return;
    }

    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteClick = (id) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/forms/${deleteModal.id}`);
      toast.success('Form deleted successfully');
      fetchForms();
    } catch (err) {
      toast.error('Failed to delete form');
    }
  };

  const handleApprove = async () => {
    try {
      await api.patch(`/forms/${approveModal.id}/approve`);
      toast.success('Form approved successfully! ✅');
      fetchForms();
      fetchStats();
    } catch (err) {
      toast.error('Failed to approve form');
    }
  };

  const statusBadge = (status) => {
    const classMap = {
      'DRAFT': 'draft',
      'PENDING_APPROVAL': 'pending',
      'APPROVED': 'approved'
    };
    const mappedClass = classMap[status] || 'draft';
    return (
      <span className={`status-badge ${mappedClass}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2>Forms Management</h2>
        <Button variant="primary" onClick={() => navigate('/forms/new')} className="w-full sm:w-fit">
          <Plus size={16} /> New Form
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="flex flex-col gap-2" style={{ borderLeft: '4px solid var(--color-brand)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-brand)' }}>
              <FileText size={24} weight="duotone" />
            </div>
            <span className="text-sm text-muted font-medium">Reports Today</span>
          </div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--color-brand)' }}>{stats.today}</div>
        </Card>

        <Card className="flex flex-col gap-2" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Calendar size={24} weight="duotone" />
            </div>
            <span className="text-sm text-muted font-medium">Pending</span>
          </div>
          <div className="text-3xl font-bold mt-2" style={{ color: '#f59e0b' }}>{stats.pending}</div>
        </Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="input-group">
            <label className="input-label flex items-center gap-1"><Buildings size={16}/> Company</label>
            <select name="companyId" value={filters.companyId} onChange={handleFilterChange} className="input-field">
              <option value="">All Companies</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="input-group">
            <label className="input-label flex items-center gap-1"><User size={16}/> User (Creator)</label>
            <select name="employeeId" value={filters.employeeId} onChange={handleFilterChange} className="input-field">
              <option value="">All Users</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.initials || '-'})</option>)}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label flex items-center gap-1"><Tag size={16}/> Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="input-field">
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label flex items-center gap-1"><Calendar size={16}/> By Week</label>
            <Input 
              type="week" 
              name="week" 
              value={filters.week} 
              onChange={handleFilterChange} 
            />
          </div>

          <div className="input-group">
            <label className="input-label flex items-center gap-1"><CalendarBlank size={16}/> Custom Date Range</label>
            <div className="flex gap-2">
              <Input 
                type="date" 
                name="startDate" 
                value={filters.startDate} 
                onChange={handleFilterChange} 
                className="flex-1"
              />
              <Input 
                type="date" 
                name="endDate" 
                value={filters.endDate} 
                onChange={handleFilterChange} 
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="flex items-start md:items-end">
            <Button variant="action" onClick={fetchForms} className="w-full">
              <MagnifyingGlass size={16} /> Search Forms
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : (
          <div className="table-wrapper">
            <Table headers={['Date', 'Company', 'Status', 'Created By', 'Actions']}>
              {forms.map(form => (
                <tr key={form.id}>
                  <td style={{ minWidth: '100px' }}>{form.date}</td>
                  <td><strong>{form.company?.name || 'Unknown'}</strong></td>
                  <td>{statusBadge(form.status)}</td>
                  <td>{form.createdBy?.name || '-'}</td>
                  <td>
                    <div className="flex gap-2">
                      
                      <Button onClick={() => navigate(`/forms/${form.id}`)} title="View Form">
                        <Eye size={16} />
                      </Button>
                      {form.status === 'PENDING_APPROVAL' && (
                        <Button variant="success" onClick={() => setApproveModal({ isOpen: true, id: form.id })} title="Approve Form">
                          <CheckCircle size={16} />
                        </Button>
                      )}
                      <Button onClick={() => navigate(`/forms/${form.id}/edit`)} disabled={form.status === 'APPROVED'} title="Edit Form">
                        <PencilSimple size={16} />
                      </Button>
                      {isAdminOrManager && (
                        <Button variant="danger" onClick={() => handleDeleteClick(form.id)} title="Delete Form">
                          <Trash size={16} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {forms.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted p-8">
                    <div className="flex flex-col items-center gap-2">
                       <FolderDashed size={48} weight="thin" />
                       <span style={{ fontSize: '0.9rem' }}>No forms match the selected filters.</span>
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
        title="Delete Form"
        message="Warning: Are you sure you want to delete this form entirely? All pieces and details will be lost."
        confirmText="Delete"
      />

      <ConfirmModal 
        isOpen={approveModal.isOpen}
        onClose={() => setApproveModal({ isOpen: false, id: null })}
        onConfirm={handleApprove}
        title="Approve Form ✅"
        message="Are you sure you want to approve this report? This action will mark it as completed and notify the team."
        confirmText="Yes, Approve"
      />
    </div>
  );
};

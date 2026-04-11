import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { CaretLeft, CheckCircle } from '@phosphor-icons/react';
import { Skeleton } from '../components/UI/Skeleton';

export const FormDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if viewing user can approve
  const roleName = (user?.role?.name || user?.role || '').toString().toUpperCase();
  const canApprove = roleName === 'MANAGER' || roleName === 'ADMIN';

  useEffect(() => {
    fetchForm();
  }, [id]);

  const fetchForm = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/forms/${id}`);
      setForm(data);
    } catch (err) {
      alert('Failed to load form');
      navigate('/forms');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this form?')) return;
    try {
      await api.patch(`/forms/${id}/approve`);
      fetchForm();
    } catch (err) {
      alert('Failed to approve form');
    }
  };

  if (loading) return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton height="40px" width="30%" />
      <Card><Skeleton height="150px" /></Card>
      <Card><Skeleton height="200px" /></Card>
    </div>
  );
  if (!form) return <div className="p-6 text-muted">Form not found.</div>;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate('/forms')}><CaretLeft size={16} /> Back</Button>
          <h2>Form Details</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <span style={{ fontWeight: 'bold' }}>Status: {form.status}</span>
          
          {canApprove && form.status !== 'APPROVED' && (
            <Button variant="success" onClick={handleApprove} className="bg-[var(--color-success)] text-white border-none hover:opacity-90">
              <CheckCircle size={16} /> Approve Form
            </Button>
          )}
        </div>
      </div>

      <Card>
        <h3 className="mb-4">General Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 text-sm">
          <div><strong>Company:</strong> {form.company?.name}</div>
          <div><strong>Date:</strong> {form.date}</div>
          <div><strong>Created By:</strong> {form.createdBy?.name}</div>
          <div><strong>Approved By:</strong> {form.approvedBy?.name || 'Pending'}</div>
          <div><strong>Pocket Count:</strong> {form.pocketCount}</div>
          <div><strong>Small/Large Bags:</strong> {form.plasticBagsSmall} / {form.plasticBagsLarge}</div>
          {form.notes && <div className="col-span-2"><strong>Notes:</strong> {form.notes}</div>}
        </div>
      </Card>

      {form.sections?.length > 0 ? form.sections.map((section, idx) => (
        <Card key={idx}>
          <div className="flex justify-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <h3 className="capitalize">{section.sectionName.replace('_', ' ').toLowerCase()}</h3>
            <span className="text-sm text-muted">Initials: {section.filledByInitials || '-'}</span>
          </div>
          
          {section.items?.length > 0 ? (
            <div className="table-wrapper">
              <table className="table w-full">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Colored</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((item, iIdx) => (
                  <tr key={iIdx}>
                    <td>{item.category}</td>
                    <td>{item.isColored ? 'Yes' : 'No'}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted text-sm my-2">No items in this section.</div>
          )}
        </Card>
      )) : (
        <Card><div className="text-muted text-center">Form is empty.</div></Card>
      )}
    </div>
  );
};

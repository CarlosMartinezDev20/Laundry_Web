import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Card } from '../components/UI/Card';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { ChartBar } from '@phosphor-icons/react';
import { Skeleton } from '../components/UI/Skeleton';

export const ReportsView = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/companies').then(setCompanies).catch(() => {});
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedCompanyId) return;
    
    setLoading(true);
    let query = '';
    if (startDate && endDate) {
      query = `?startDate=${startDate}&endDate=${endDate}`;
    }

    try {
      const data = await api.get(`/reports/company/${selectedCompanyId}${query}`);
      setReport(data);
    } catch (err) {
      alert('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const renderItemBreakdown = (items, title) => {
    const entries = Object.entries(items);
    if (entries.length === 0) return <div className="text-sm text-muted">No items.</div>;
    return (
      <div className="mt-2">
        <strong className="text-sm">{title} Breakdown:</strong>
        <ul className="text-sm list-inside list-disc ml-2">
          {entries.map(([category, qty]) => (
            <li key={category}>{category}: {qty}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2>Cumulative Reports</h2>
      </div>

      <Card>
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start md:items-end">
          <div className="input-group flex-1">
            <label className="input-label">Select Company</label>
            <select 
              value={selectedCompanyId} 
              onChange={(e) => setSelectedCompanyId(e.target.value)} 
              required 
              className="input-field"
            >
              <option value="">-- Choose Company --</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Input 
            type="date" 
            label="Start Date (Optional)" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
          <Input 
            type="date" 
            label="End Date (Optional)" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
          <div>
            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              <ChartBar size={16} /> Generate Report
            </Button>
          </div>
        </form>
      </Card>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card><Skeleton height="150px" /></Card>
          <Card><Skeleton height="200px" /></Card>
          <Card><Skeleton height="120px" /></Card>
        </div>
      )}

      {!loading && report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="mb-4" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              Overall Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 text-sm">
              <div><strong>Forms Processed:</strong> {report.totalForms}</div>
              <div><strong>Pocket Count:</strong> {report.totals.pockets}</div>
              <div className="md:col-span-2">
                <strong>Plastic Bags:</strong> {report.totals.plasticBags.total} 
                <span className="text-muted ml-2">({report.totals.plasticBags.small} small / {report.totals.plasticBags.large} large)</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              Item Colors Overview
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm p-2 bg-blue-50" style={{ backgroundColor: 'rgb(59 130 246 / 0.1)', borderRadius: '4px' }}>
                <strong>Standard Items:</strong> <span>{report.totals.standard} units</span>
              </div>
              {renderItemBreakdown(report.totals.standardItems, 'Standard')}
              
              <div className="flex justify-between items-center text-sm p-2 mt-4" style={{ backgroundColor: 'rgb(245 158 11 / 0.1)', borderRadius: '4px' }}>
                <strong style={{ color: 'var(--color-warning)' }}>Colored Items:</strong> <span>{report.totals.colored} units</span>
              </div>
              {renderItemBreakdown(report.totals.coloredItems, 'Colored')}
            </div>
          </Card>

          <Card>
            <h3 className="mb-4" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              Sheet Sizes Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 text-sm">
              <div><strong>Simple:</strong> {report.totals.sheetSizes.SIMPLE}</div>
              <div><strong>Double:</strong> {report.totals.sheetSizes.DOUBLE}</div>
              <div><strong>Queen:</strong> {report.totals.sheetSizes.QUEEN}</div>
              <div><strong>King:</strong> {report.totals.sheetSizes.KING}</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

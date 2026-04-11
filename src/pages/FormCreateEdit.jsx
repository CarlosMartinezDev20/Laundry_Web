import React, { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/UI/Card';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { FloppyDisk, CaretLeft } from '@phosphor-icons/react';
import { Skeleton } from '../components/UI/Skeleton';
import { useToast } from '../context/ToastContext';


export const FormCreateEdit = () => {
  const toast = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);

  const [formData, setFormData] = useState({
    companyId: '',
    date: new Date().toISOString().split('T')[0],
    pocketCount: 0,
    plasticBagsSmall: 0,
    plasticBagsLarge: 0,
    notes: '',
    status: 'DRAFT',
    sections: [
      {
        sectionName: 'TOWELS',
        filledByInitials: '',
        items: []
      },
      {
        sectionName: 'BED_SHEETS',
        filledByInitials: '',
        items: []
      }
    ]
  });

  useEffect(() => {
    // Fetch companies and catalog in parallel
    Promise.all([
      api.get('/companies'),
      api.get('/forms/catalog')
    ]).then(([comps, items]) => {
      setCompanies(comps);
      
      if (!id) {
        // Prepare initial form data from catalog
        const initialSections = [
          { sectionName: 'TOWELS', filledByInitials: '', items: [] },
          { sectionName: 'BED_SHEETS', filledByInitials: '', items: [] },
          { sectionName: 'COVERS', filledByInitials: '', items: [] }
        ];

        // Map catalog items to their sections
        items.forEach(item => {
          const sectionIdx = initialSections.findIndex(s => s.sectionName === item.category);
          if (sectionIdx !== -1) {
            // We'll use a dual-row approach for each item: Standard and Color
            // Or a unified object that we'll split on submit.
            // Let's use the unified object for easier UI:
            initialSections[sectionIdx].items.push({
              category: item.name,
              std: 0,
              clr: 0
            });
          }
        });

        setFormData(prev => ({ ...prev, sections: initialSections }));
      }
    }).catch(() => {});

    if (id) {
      api.get(`/forms/${id}`).then(data => {
        // Group raw items back into unified UI rows (std/clr)
        const parsedSections = (data.sections || []).map(section => {
          const groupedItems = [];
          const itemsMap = {}; // name -> {std, clr}
          
          section.items.forEach(item => {
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
          sections: parsedSections
        });
      }).finally(() => setFetching(false));
    }
  }, [id]);

  const handleChange = useCallback((e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  }, []);

  const handleItemChange = useCallback((sectionIdx, itemIdx, field, value) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIdx] = { ...newSections[sectionIdx] };
      newSections[sectionIdx].items = [...newSections[sectionIdx].items];
      newSections[sectionIdx].items[itemIdx] = { ...newSections[sectionIdx].items[itemIdx], [field]: value };
      return { ...prev, sections: newSections };
    });
  }, []);

  const addItem = useCallback((sectionIdx) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIdx] = { ...newSections[sectionIdx] };
      newSections[sectionIdx].items = [
        ...newSections[sectionIdx].items,
        { category: '', size: null, isColored: false, quantity: 0 }
      ];
      return { ...prev, sections: newSections };
    });
  }, []);

  const removeItem = useCallback((sectionIdx, itemIdx) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIdx] = { ...newSections[sectionIdx] };
      newSections[sectionIdx].items = newSections[sectionIdx].items.filter((_, idx) => idx !== itemIdx);
      return { ...prev, sections: newSections };
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Prepare data for API: split unified rows back into individual Standard/Color items
    const submissionData = {
      ...formData,
      sections: formData.sections.map(section => ({
        ...section,
        items: section.items.flatMap(item => [
          { category: item.category, isColored: false, quantity: item.std || 0 },
          { category: item.category, isColored: true, quantity: item.clr || 0 }
        ]).filter(item => item.quantity > 0) // Only send items with quantity
      }))
    };

    try {
      if (id) {
        await api.patch(`/forms/${id}`, submissionData);
      } else {
        await api.post('/forms', submissionData);
      }
      toast.success('Form saved successfully');
      navigate('/forms');
    } catch (err) {
      toast.error('Error saving form. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton height="40px" width="30%" />
      <Card><Skeleton height="400px" /></Card>
    </div>
  );
  if (formData.status === 'APPROVED') {
    return <div>This form is approved and cannot be edited.</div>;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate(-1)}><CaretLeft size={16} /> Back</Button>
          <h2>{id ? 'Edit Form' : 'New Form'}</h2>
        </div>
        <Button variant="primary" onClick={handleSubmit} disabled={loading} className="w-full sm:w-fit">
          <FloppyDisk size={16} /> {loading ? 'Saving...' : 'Save Form'}
        </Button>
      </div>

      <Card>
        <h3>General Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ marginTop: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Company</label>
            <select name="companyId" value={formData.companyId} onChange={handleChange} required className="input-field">
              <option value="">Select a company</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Input type="date" label="Date" name="date" value={formData.date} onChange={handleChange} required />
          <Input type="number" label="Pocket Count" name="pocketCount" value={formData.pocketCount} onChange={handleChange} />
          <Input type="number" label="Small Plastic Bags" name="plasticBagsSmall" value={formData.plasticBagsSmall} onChange={handleChange} />
          <Input type="number" label="Large Plastic Bags" name="plasticBagsLarge" value={formData.plasticBagsLarge} onChange={handleChange} />
          <div className="input-group">
            <label className="input-label">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="input-field">
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
            </select>
          </div>
        </div>
        <Input label="Notes" name="notes" value={formData.notes} onChange={handleChange} className="mt-4" />
      </Card>

      {/* Sections rendering */}
      {formData.sections.map((section, sIdx) => (
        <Card key={sIdx}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="capitalize">{section.sectionName.replace('_', ' ').toLowerCase()}</h3>
            <Input 
              label="Filled by Initials" 
              value={section.filledByInitials || ''} 
              onChange={(e) => {
                const newSections = [...formData.sections];
                newSections[sIdx].filledByInitials = e.target.value;
                setFormData({ ...formData, sections: newSections });
              }} 
              maxLength={3}
              style={{ width: '100px' }}
            />
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
                  <td className="font-bold">{item.category}</td>
                  <td>
                    <input 
                      type="number" 
                      className="input-field w-full text-center" 
                      value={item.std} 
                      onChange={e => handleItemChange(sIdx, iIdx, 'std', parseInt(e.target.value) || 0)} 
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      className="input-field w-full text-center" 
                      value={item.clr} 
                      onChange={e => handleItemChange(sIdx, iIdx, 'clr', parseInt(e.target.value) || 0)} 
                    />
                  </td>
                  <td className="text-right font-bold">
                    {item.std + item.clr}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </Card>
      ))}
      <Button variant="primary" style={{ padding: '16px' }} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving...' : 'Save Form Changes'}
      </Button>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Card } from '../components/UI/Card';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { useToast } from '../context/ToastContext';
import { User, Key, IdentificationCard, FloppyDisk } from '@phosphor-icons/react';

export const Profile = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    initials: user?.initials || '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        initials: formData.initials,
      };
      
      if (formData.password) {
        payload.password = formData.password;
      }

      await api.patch(`/users/${user.id}`, payload);
      
      toast.success('Profile updated successfully. Please note that some changes might require a re-login to fully reflect.');
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      toast.error('Failed to update profile: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2>My Profile</h2>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-muted uppercase tracking-wider">Public Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Full Name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                icon={<User size={18} />}
                required
              />
              <Input 
                label="Initials" 
                name="initials" 
                value={formData.initials} 
                onChange={handleChange} 
                icon={<IdentificationCard size={18} />}
                maxLength={3}
                placeholder="e.g. AD"
              />
            </div>
            <Input 
              label="Email Address" 
              name="email" 
              value={formData.email} 
              disabled 
              helperText="Email cannot be changed."
            />
          </div>

          <div className="flex flex-col gap-4">
             <h3 className="text-sm font-bold text-muted uppercase tracking-wider">Security</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Input 
                 label="New Password" 
                 type="password" 
                 name="password" 
                 value={formData.password} 
                 onChange={handleChange} 
                 icon={<Key size={18} />}
                 placeholder="Leave blank to keep current"
               />
               <Input 
                 label="Confirm New Password" 
                 type="password" 
                 name="confirmPassword" 
                 value={formData.confirmPassword} 
                 onChange={handleChange} 
                 icon={<Key size={18} />}
                 placeholder="Confirm new password"
               />
             </div>
          </div>

          <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <Button type="submit" variant="primary" disabled={loading} className="w-full md:w-fit py-3 px-8">
              <FloppyDisk size={18} /> {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getPropertyById, updateProperty } from '../services/storage';
import { validateIndianPhone } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

export const EditProperty: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    block: '',
    apartmentNumber: '',
    roomFlatNumber: '',
    tenantName: '',
    phoneNumber: '',
    monthlyRent: '',
    securityDeposit: '',
    moveInDate: '',
    moveOutDate: '',
    status: 'occupied' as 'occupied' | 'vacant',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (id) {
      setIsFetching(true);
      getPropertyById(id)
        .then((prop) => {
          if (prop) {
            setFormData({
              block: prop.block,
              apartmentNumber: prop.apartmentNumber,
              roomFlatNumber: prop.roomFlatNumber,
              tenantName: prop.tenantName || '',
              phoneNumber: prop.phoneNumber || '',
              monthlyRent: prop.monthlyRent.toString(),
              securityDeposit: prop.securityDeposit.toString(),
              moveInDate: prop.moveInDate || '',
              moveOutDate: prop.moveOutDate || '',
              status: prop.status,
              notes: prop.notes || ''
            });
          }
        })
        .catch((err) => console.error('Error fetching property from Neon:', err))
        .finally(() => setIsFetching(false));
    }
  }, [id]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.block.trim()) newErrors.block = 'Block is required.';
    if (!formData.apartmentNumber.trim()) newErrors.apartmentNumber = 'Apartment number is required.';
    if (!formData.roomFlatNumber.trim()) newErrors.roomFlatNumber = 'Room/Flat number is required.';
    
    const rent = Number(formData.monthlyRent);
    if (isNaN(rent) || rent < 0) newErrors.monthlyRent = 'Monthly rent must be >= 0.';

    const deposit = Number(formData.securityDeposit);
    if (isNaN(deposit) || deposit < 0) newErrors.securityDeposit = 'Security deposit must be >= 0.';

    if (formData.status === 'occupied') {
      if (!formData.tenantName.trim()) newErrors.tenantName = 'Tenant name is required for occupied units.';
      if (!validateIndianPhone(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Enter a valid 10-digit Indian phone number (starting with 6-9).';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !id) return;

    setIsLoading(true);
    try {
      await updateProperty(id, {
        block: formData.block.trim(),
        apartmentNumber: formData.apartmentNumber.trim(),
        roomFlatNumber: formData.roomFlatNumber.trim(),
        tenantName: formData.status === 'occupied' ? formData.tenantName.trim() : '',
        phoneNumber: formData.status === 'occupied' ? formData.phoneNumber.trim() : '',
        monthlyRent: Number(formData.monthlyRent),
        securityDeposit: Number(formData.securityDeposit),
        moveInDate: formData.status === 'occupied' ? formData.moveInDate : '',
        moveOutDate: formData.moveOutDate || undefined,
        status: formData.status,
        notes: formData.notes.trim() || undefined
      });
      navigate('/properties');
    } catch (err: any) {
      setErrors(prev => ({ ...prev, submit: err.message || 'Failed to update property in Neon' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/properties" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Property / Tenant</h1>
          <p className="text-sm text-slate-500 mt-0.5">Update apartment or tenant details.</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Block / Building"
              required
              placeholder="e.g. Block A"
              value={formData.block}
              onChange={(e) => setFormData({ ...formData, block: e.target.value })}
              error={errors.block}
            />
            <Input
              label="Apartment Number"
              required
              placeholder="e.g. 101"
              value={formData.apartmentNumber}
              onChange={(e) => setFormData({ ...formData, apartmentNumber: e.target.value })}
              error={errors.apartmentNumber}
            />
            <Input
              label="Room / Flat Number"
              required
              placeholder="e.g. Flat 1A"
              value={formData.roomFlatNumber}
              onChange={(e) => setFormData({ ...formData, roomFlatNumber: e.target.value })}
              error={errors.roomFlatNumber}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Status"
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'occupied' | 'vacant' })}
              options={[
                { value: 'occupied', label: 'Occupied' },
                { value: 'vacant', label: 'Vacant' }
              ]}
            />
            <Input
              label="Monthly Rent (₹)"
              type="number"
              required
              min="0"
              placeholder="15000"
              value={formData.monthlyRent}
              onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
              error={errors.monthlyRent}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Security Deposit (₹)"
              type="number"
              required
              min="0"
              placeholder="30000"
              value={formData.securityDeposit}
              onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
              error={errors.securityDeposit}
            />
            <Input
              label="Move-in Date"
              type="date"
              value={formData.moveInDate}
              onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
            />
          </div>

          {formData.status === 'occupied' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <Input
                label="Tenant Name"
                required={formData.status === 'occupied'}
                placeholder="Rajesh Sharma"
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                error={errors.tenantName}
              />
              <Input
                label="Phone Number"
                placeholder="9876543210"
                maxLength={10}
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                error={errors.phoneNumber}
                helperText="10-digit Indian phone number"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Remarks</label>
            <textarea
              rows={3}
              placeholder="Additional information about the property or tenant..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-slate-100">
            <Link to="/properties">
              <Button variant="secondary" type="button">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={isLoading}>Update Property</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

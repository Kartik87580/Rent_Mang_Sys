import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { getProperties, getPaymentById, updatePayment } from '../services/storage';
import { Property } from '../types/property';
import { MONTH_NAMES } from '../services/calculations';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

export const EditPayment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [month, setMonth] = useState<number>(1);
  const [year, setYear] = useState<number>(2026);
  const [rentAmount, setRentAmount] = useState('');
  const [status, setStatus] = useState<'paid' | 'pending'>('paid');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'other'>('upi');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    setIsFetching(true);
    Promise.all([
      getProperties(),
      id ? getPaymentById(id) : Promise.resolve(undefined)
    ])
      .then(([props, payment]) => {
        setProperties(props);
        if (payment) {
          setPropertyId(payment.propertyId);
          setMonth(payment.month);
          setYear(payment.year);
          setRentAmount(payment.rentAmount.toString());
          setStatus(payment.status);
          setPaymentDate(payment.paymentDate || '');
          setPaymentMethod(payment.paymentMethod || 'upi');
          setNotes(payment.notes || '');
        }
      })
      .catch((err) => {
        console.error('Error fetching payment data from Neon:', err);
        setError('Failed to load payment details from database.');
      })
      .finally(() => setIsFetching(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!id || !propertyId) return;

    const amount = Number(rentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Rent amount must be greater than 0.');
      return;
    }

    setIsLoading(true);
    try {
      await updatePayment(id, {
        propertyId,
        month: Number(month),
        year: Number(year),
        rentAmount: amount,
        status,
        paymentDate: status === 'paid' ? paymentDate : undefined,
        paymentMethod: status === 'paid' ? paymentMethod : undefined,
        notes: notes.trim() || undefined
      });
      navigate('/payments');
    } catch (err: any) {
      setError(err.message || 'Failed to update payment in Neon PostgreSQL.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/payments" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Rent Payment</h1>
          <p className="text-sm text-slate-500 mt-0.5">Update payment record details in Neon PostgreSQL.</p>
        </div>
      </div>

      <Card>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Select
            label="Property / Tenant"
            required
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            options={properties.map(p => ({
              value: p.id,
              label: `${p.block} - ${p.apartmentNumber} (${p.tenantName || 'Vacant'})`
            }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Month"
              required
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              options={MONTH_NAMES.map((m, idx) => ({ value: idx + 1, label: m }))}
            />
            <Select
              label="Year"
              required
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              options={[
                { value: 2024, label: '2024' },
                { value: 2025, label: '2025' },
                { value: 2026, label: '2026' },
                { value: 2027, label: '2027' }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Rent Amount (₹)"
              type="number"
              required
              min="1"
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
            />
            <Select
              label="Payment Status"
              required
              value={status}
              onChange={(e) => setStatus(e.target.value as 'paid' | 'pending')}
              options={[
                { value: 'paid', label: 'Paid' },
                { value: 'pending', label: 'Pending' }
              ]}
            />
          </div>

          {status === 'paid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <Input
                label="Payment Date"
                type="date"
                required={status === 'paid'}
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
              <Select
                label="Payment Method"
                required={status === 'paid'}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                options={[
                  { value: 'upi', label: 'UPI' },
                  { value: 'cash', label: 'Cash' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'other', label: 'Other' }
                ]}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Transaction Reference</label>
            <textarea
              rows={3}
              placeholder="UTR number, transaction ID, or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-slate-100">
            <Link to="/payments">
              <Button variant="secondary" type="button">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={isLoading}>Update Payment</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { getPayments, getProperties, deletePayment } from '../services/storage';
import { Payment } from '../types/payment';
import { Property } from '../types/property';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getMonthName, MONTH_NAMES } from '../services/calculations';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pays, props] = await Promise.all([getPayments(), getProperties()]);
      setPayments(pays);
      setProperties(props);
    } catch (error) {
      console.error('Error fetching payments from Neon:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const propertyMap = new Map(properties.map(p => [p.id, p]));

  const handleDeleteClick = (payment: Payment) => {
    setPaymentToDelete(payment);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (paymentToDelete) {
      setIsDeleting(true);
      try {
        await deletePayment(paymentToDelete.id);
        const updated = await getPayments();
        setPayments(updated);
        setDeleteModalOpen(false);
        setPaymentToDelete(null);
      } catch (error) {
        console.error('Failed to delete payment:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const filteredPayments = payments.filter(pay => {
    const prop = propertyMap.get(pay.propertyId);
    const propName = prop ? `${prop.block} ${prop.apartmentNumber} ${prop.tenantName}`.toLowerCase() : '';
    
    const matchesSearch = propName.includes(searchQuery.toLowerCase()) || 
                          (pay.notes && pay.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || pay.status === statusFilter;
    const matchesMonth = monthFilter === 'all' || pay.month === Number(monthFilter);
    const matchesYear = yearFilter === 'all' || pay.year === Number(yearFilter);

    return matchesSearch && matchesStatus && matchesMonth && matchesYear;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rent Payments</h1>
          <p className="text-sm text-slate-500 mt-1">Track monthly rent collections and payment statuses in Neon PostgreSQL.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            title="Refresh payments"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <Link to="/payments/new">
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tenant, property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Month</label>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full py-2 px-3 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Months</option>
            {MONTH_NAMES.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Year</label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full py-2 px-3 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Years</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>
      </div>

      {/* Payments List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading payments from Neon PostgreSQL...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">No payment records found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or record a new payment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Property / Tenant</th>
                  <th className="py-3 px-4">Billing Period</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPayments.map(pay => {
                  const prop = propertyMap.get(pay.propertyId);
                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {prop ? `${prop.block} - ${prop.apartmentNumber}` : 'Unknown'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {prop?.tenantName || 'No Tenant'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {getMonthName(pay.month)} {pay.year}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatCurrency(pay.rentAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                          pay.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {pay.status === 'paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          <span>{pay.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(pay.paymentDate)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 capitalize">
                        {pay.paymentMethod ? pay.paymentMethod.replace('_', ' ') : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link to={`/payments/${pay.id}/edit`}>
                          <button className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Link>
                        <button 
                          onClick={() => handleDeleteClick(pay)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-amber-600 bg-amber-50 p-4 rounded-xl">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm">
              Are you sure you want to delete this payment record?
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={isDeleting}>
              Delete Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

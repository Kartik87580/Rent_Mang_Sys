import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Phone, 
  User, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { getProperties, deleteProperty } from '../services/storage';
import { Property } from '../types/property';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

export const Properties: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [blockFilter, setBlockFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('block');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const data = await getProperties();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties from Neon:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Unique blocks for filter
  const blocks = Array.from(new Set(properties.map(p => p.block)));

  const handleDeleteClick = (property: Property) => {
    setPropertyToDelete(property);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (propertyToDelete) {
      setIsDeleting(true);
      try {
        await deleteProperty(propertyToDelete.id);
        const updated = await getProperties();
        setProperties(updated);
        setDeleteModalOpen(false);
        setPropertyToDelete(null);
      } catch (error) {
        console.error('Failed to delete property:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Filter and Sort logic
  const filteredProperties = properties.filter(prop => {
    const matchesSearch = 
      (prop.tenantName && prop.tenantName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (prop.phoneNumber && prop.phoneNumber.includes(searchQuery)) ||
      prop.apartmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.roomFlatNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || prop.status === statusFilter;
    const matchesBlock = blockFilter === 'all' || prop.block === blockFilter;

    return matchesSearch && matchesStatus && matchesBlock;
  }).sort((a, b) => {
    if (sortBy === 'block') {
      return a.block.localeCompare(b.block) || a.apartmentNumber.localeCompare(b.apartmentNumber);
    } else if (sortBy === 'rent-asc') {
      return a.monthlyRent - b.monthlyRent;
    } else if (sortBy === 'rent-desc') {
      return b.monthlyRent - a.monthlyRent;
    } else if (sortBy === 'name') {
      return (a.tenantName || '').localeCompare(b.tenantName || '');
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Properties & Tenants</h1>
          <p className="text-sm text-slate-500 mt-1">Manage apartments, rooms, and tenant agreements in Neon PostgreSQL.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchProperties}
            title="Refresh properties"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <Link to="/properties/new">
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Property / Tenant</span>
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
              placeholder="Search tenant, phone, apt..."
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
            <option value="occupied">Occupied</option>
            <option value="vacant">Vacant</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Block</label>
          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="w-full py-2 px-3 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Blocks</option>
            {blocks.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full py-2 px-3 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="block">Block & Apartment</option>
            <option value="rent-desc">Rent: High to Low</option>
            <option value="rent-asc">Rent: Low to High</option>
            <option value="name">Tenant Name</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading properties from Neon PostgreSQL...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">No properties found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map(prop => (
            <div key={prop.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="p-6 space-y-4">
                {/* Header of Card */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold uppercase tracking-wider">
                      {prop.block}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">
                      Apt {prop.apartmentNumber} &bull; {prop.roomFlatNumber}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                    prop.status === 'occupied' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {prop.status}
                  </span>
                </div>

                {/* Tenant Details */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-sm">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="font-medium">{prop.tenantName || 'No Tenant Assigned'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{prop.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-700">
                    <DollarSign className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="font-bold text-indigo-600">{formatCurrency(prop.monthlyRent)}</span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-500 text-xs">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>Move-in: {formatDate(prop.moveInDate)}</span>
                  </div>
                </div>

                {prop.notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg italic">
                    "{prop.notes}"
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Deposit: {formatCurrency(prop.securityDeposit)}</span>
                <div className="flex items-center space-x-2">
                  <Link to={`/properties/${prop.id}/edit`}>
                    <button className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </Link>
                  <button 
                    onClick={() => handleDeleteClick(prop)}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-amber-600 bg-amber-50 p-4 rounded-xl">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm">
              Are you sure you want to delete property <strong>{propertyToDelete?.block} - {propertyToDelete?.apartmentNumber}</strong>? All associated payment records will also be removed.
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={isDeleting}>
              Delete Property
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

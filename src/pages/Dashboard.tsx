import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Home, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ArrowUpRight, 
  Database,
  RefreshCw
} from 'lucide-react';
import { getProperties, getPayments, checkNeonHealth, NeonHealthStatus } from '../services/storage';
import { Property } from '../types/property';
import { Payment } from '../types/payment';
import { calculateDashboardStats, MONTH_NAMES, getMonthName } from '../services/calculations';
import { formatCurrency } from '../utils/formatters';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbHealth, setDbHealth] = useState<NeonHealthStatus | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [props, pays, health] = await Promise.all([
        getProperties(),
        getPayments(),
        checkNeonHealth()
      ]);
      setProperties(props);
      setPayments(pays);
      setDbHealth(health);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = calculateDashboardStats(properties, payments, selectedMonth, selectedYear);

  const monthPayments = payments.filter(p => p.month === selectedMonth && p.year === selectedYear);
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const propertyMap = new Map(properties.map(p => [p.id, p]));
  const years = [2024, 2025, 2026, 2027];

  return (
    <div className="space-y-6">
      {/* Top Header & Month Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            {dbHealth?.status === 'connected' ? (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Database className="w-3.5 h-3.5" />
                <span>Neon PostgreSQL ({dbHealth.latencyMs}ms)</span>
              </span>
            ) : dbHealth?.status === 'error' ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>DB Disconnected</span>
              </span>
            ) : null}
          </div>
          <p className="text-sm text-slate-500 mt-1">Overview of your properties, occupancy, and rent collections.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            title="Refresh data"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <div className="w-36">
            <Select
              aria-label="Filter by month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              options={MONTH_NAMES.map((m, idx) => ({ value: idx + 1, label: m }))}
            />
          </div>
          <div className="w-28">
            <Select
              aria-label="Filter by year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              options={years.map(y => ({ value: y, label: y.toString() }))}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-16 bg-white rounded-2xl border border-slate-200">
          <div className="flex flex-col items-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">Loading data from Neon PostgreSQL...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Properties</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalProperties}</h3>
                <div className="flex items-center space-x-2 mt-2 text-xs text-slate-500">
                  <span className="text-emerald-600 font-medium">{stats.occupiedProperties} Occupied</span>
                  <span>&bull;</span>
                  <span className="text-amber-600 font-medium">{stats.vacantProperties} Vacant</span>
                </div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-xl text-indigo-600">
                <Building2 className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Expected Monthly Rent</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(stats.expectedMonthlyRent)}</h3>
                <p className="text-xs text-slate-500 mt-2">For {getMonthName(selectedMonth)} {selectedYear}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl text-blue-600">
                <DollarSign className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Paid Rent</p>
                <h3 className="text-3xl font-bold text-emerald-600 mt-1">{formatCurrency(stats.totalPaidRent)}</h3>
                <p className="text-xs text-emerald-700 font-medium mt-2">Collected for {getMonthName(selectedMonth)}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pending Rent</p>
                <h3 className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(stats.totalPendingRent)}</h3>
                <p className="text-xs text-red-700 font-medium mt-2">Due for {getMonthName(selectedMonth)}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl text-red-600">
                <Clock className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Occupancy Rate</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">
                  {stats.totalProperties > 0 ? Math.round((stats.occupiedProperties / stats.totalProperties) * 100) : 0}%
                </h3>
                <p className="text-xs text-slate-500 mt-2">{stats.occupiedProperties} of {stats.totalProperties} units filled</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl text-purple-600">
                <Home className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Collection Rate</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">
                  {stats.expectedMonthlyRent > 0 ? Math.min(100, Math.round((stats.totalPaidRent / stats.expectedMonthlyRent) * 100)) : 0}%
                </h3>
                <p className="text-xs text-slate-500 mt-2">Against expected rent</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl text-amber-600">
                <ArrowUpRight className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Two column layout: Recent Payments & Current Month Occupied Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Payments */}
            <Card 
              title="Recent Payment Activity" 
              subtitle="Latest rent payments recorded in the system"
              action={
                <Link to="/payments" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                  View All &rarr;
                </Link>
              }
            >
              {recentPayments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No payment records found.</p>
              ) : (
                <div className="space-y-4">
                  {recentPayments.map(pay => {
                    const prop = propertyMap.get(pay.propertyId);
                    return (
                      <div key={pay.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${pay.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {pay.status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {prop ? `${prop.block} - ${prop.apartmentNumber}` : 'Unknown Property'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {prop?.tenantName || 'No Tenant'} &bull; {getMonthName(pay.month)} {pay.year}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(pay.rentAmount)}</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium uppercase ${
                            pay.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {pay.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Current Month Status per Property */}
            <Card 
              title={`Rent Status for ${getMonthName(selectedMonth)} ${selectedYear}`}
              subtitle="Status across all occupied properties"
              action={
                <Link to="/properties" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                  Manage Properties &rarr;
                </Link>
              }
            >
              {properties.filter(p => p.status === 'occupied').length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No occupied properties found.</p>
              ) : (
                <div className="space-y-4">
                  {properties.filter(p => p.status === 'occupied').map(prop => {
                    const payment = monthPayments.find(p => p.propertyId === prop.id);
                    const isPaid = payment && payment.status === 'paid';
                    return (
                      <div key={prop.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {prop.block} - {prop.apartmentNumber} ({prop.roomFlatNumber})
                          </p>
                          <p className="text-xs text-slate-500">Tenant: {prop.tenantName || 'N/A'}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">{formatCurrency(prop.monthlyRent)}</p>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium uppercase ${
                              isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isPaid ? 'Paid' : 'Pending'}
                            </span>
                          </div>
                          {!isPaid && (
                            <Link 
                              to={`/payments/new?propertyId=${prop.id}&month=${selectedMonth}&year=${selectedYear}`}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                              Record
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

import { Property } from '../types/property';
import { Payment } from '../types/payment';

export interface DashboardStats {
  totalProperties: number;
  occupiedProperties: number;
  vacantProperties: number;
  expectedMonthlyRent: number;
  totalPaidRent: number;
  totalPendingRent: number;
}

export const calculateDashboardStats = (properties: Property[], payments: Payment[], month: number, year: number): DashboardStats => {
  const totalProperties = properties.length;
  const occupiedProperties = properties.filter(p => p.status === 'occupied').length;
  const vacantProperties = properties.filter(p => p.status === 'vacant').length;

  // Expected monthly rent from all occupied properties
  const expectedMonthlyRent = properties
    .filter(p => p.status === 'occupied')
    .reduce((sum, p) => sum + p.monthlyRent, 0);

  // Filter payments for specified month and year
  const monthPayments = payments.filter(p => p.month === month && p.year === year);

  const totalPaidRent = monthPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.rentAmount, 0);

  // Total pending rent: For occupied properties in this month, if no paid payment exists, add monthlyRent (or pending payment amount)
  // Alternatively, sum pending payments or calculate based on occupied properties missing payments.
  // Let's calculate: For each occupied property, check if a paid payment exists for this month/year. If not, add its monthlyRent.
  let totalPendingRent = 0;
  properties.filter(p => p.status === 'occupied').forEach(prop => {
    const payment = monthPayments.find(p => p.propertyId === prop.id);
    if (!payment || payment.status === 'pending') {
      totalPendingRent += prop.monthlyRent;
    }
  });

  return {
    totalProperties,
    occupiedProperties,
    vacantProperties,
    expectedMonthlyRent,
    totalPaidRent,
    totalPendingRent
  };
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const getMonthName = (month: number): string => {
  return MONTH_NAMES[month - 1] || 'Unknown';
};

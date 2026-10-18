import { Property } from '../types/property';
import { Payment } from '../types/payment';
import { getMonthName } from '../services/calculations';

export const exportPropertiesToCSV = (properties: Property[]) => {
  const headers = ['ID', 'Block', 'Apartment', 'Flat/Room', 'Tenant Name', 'Phone', 'Monthly Rent', 'Security Deposit', 'Move-in Date', 'Status', 'Notes'];
  
  const rows = properties.map(p => [
    p.id,
    `"${p.block}"`,
    `"${p.apartmentNumber}"`,
    `"${p.roomFlatNumber}"`,
    `"${p.tenantName || ''}"`,
    `"${p.phoneNumber || ''}"`,
    p.monthlyRent,
    p.securityDeposit,
    `"${p.moveInDate || ''}"`,
    p.status,
    `"${(p.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return csvContent;
};

export const exportPaymentsToCSV = (payments: Payment[], properties: Property[]) => {
  const propMap = new Map(properties.map(p => [p.id, p]));
  const headers = ['ID', 'Property/Tenant', 'Month', 'Year', 'Rent Amount', 'Status', 'Payment Date', 'Method', 'Notes'];

  const rows = payments.map(pay => {
    const prop = propMap.get(pay.propertyId);
    const propName = prop ? `${prop.block} - ${prop.apartmentNumber} (${prop.tenantName || 'Vacant'})` : 'Unknown';
    
    return [
      pay.id,
      `"${propName}"`,
      `"${getMonthName(pay.month)}"`,
      pay.year,
      pay.rentAmount,
      pay.status,
      `"${pay.paymentDate || ''}"`,
      `"${pay.paymentMethod || ''}"`,
      `"${(pay.notes || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return csvContent;
};

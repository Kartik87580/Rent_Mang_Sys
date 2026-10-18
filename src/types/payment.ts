export interface Payment {
  id: string;
  propertyId: string;
  month: number; // 1 to 12
  year: number;
  rentAmount: number;
  status: 'paid' | 'pending';
  paymentDate?: string;
  paymentMethod?: 'cash' | 'upi' | 'bank_transfer' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

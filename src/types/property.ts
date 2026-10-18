export interface Property {
  id: string;
  block: string;
  apartmentNumber: string;
  roomFlatNumber: string;
  tenantName: string;
  phoneNumber: string;
  monthlyRent: number;
  securityDeposit: number;
  moveInDate: string;
  moveOutDate?: string;
  status: 'occupied' | 'vacant';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

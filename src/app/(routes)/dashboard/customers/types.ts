export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CarDetails {
  brand: string;
  model: string;
  numberPlate: string;
}

export type CustomerType = 'walk-in' | 'online';
export type CustomerSource = 'facebook' | 'tiktok' | 'instagram' | 'word-of-mouth' | '';

export interface Customer {
  _id: string;
  customerCode?: string;
  customerType?: CustomerType;
  source?: CustomerSource;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: Address;
  carDetails: CarDetails | CarDetails[];
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RawCustomer {
  _id: string | number;
  customerCode?: string;
  customerType?: CustomerType;
  source?: CustomerSource;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  address?: Partial<Address>;
  carDetails?: Partial<CarDetails> | Partial<CarDetails>[];
  notes?: string;
  isActive?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateCustomerData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: Partial<Address>;
  carDetails: CarDetails | CarDetails[];
  notes?: string;
  customerType?: CustomerType;
  source?: CustomerSource;
}

export interface UpdateCustomerData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: Partial<Address>;
  carDetails?: CarDetails | CarDetails[];
  notes?: string;
  isActive?: boolean;
  customerType?: CustomerType;
  source?: CustomerSource;
}

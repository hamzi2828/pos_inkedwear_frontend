'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Customer, CreateCustomerData } from '../types';
import { carBrandService, type CarBrand } from '../service/carBrandService';
import Combobox from './Combobox';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customerData: CreateCustomerData) => Promise<void>;
  editingCustomer?: Customer | null;
}

export default function CustomerModal({ isOpen, onClose, onSubmit, editingCustomer }: CustomerModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Car brands data
  const [carBrands, setCarBrands] = useState<CarBrand[]>([]);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);

  // Fetch car brands on mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const brands = await carBrandService.getAllBrands();
        setCarBrands(brands);
        setBrandOptions(brands.map((b) => b.name));
      } catch (err) {
        console.error('Error fetching car brands:', err);
      }
    };
    fetchBrands();
  }, []);

  // Update model options when brand changes
  useEffect(() => {
    if (brand && carBrands.length > 0) {
      const selectedBrand = carBrands.find(
        (b) => b.name.toLowerCase() === brand.toLowerCase()
      );
      if (selectedBrand) {
        setModelOptions(selectedBrand.models);
      } else {
        setModelOptions([]);
      }
    } else {
      setModelOptions([]);
    }
  }, [brand, carBrands]);

  // Populate form when editing
  useEffect(() => {
    if (editingCustomer) {
      setFirstName(editingCustomer.firstName || '');
      setLastName(editingCustomer.lastName || '');
      setEmail(editingCustomer.email || '');
      setPhone(editingCustomer.phone || '');
      // Handle carDetails being either an object or array
      const carDetails = Array.isArray(editingCustomer.carDetails)
        ? editingCustomer.carDetails[0]
        : editingCustomer.carDetails;
      setBrand(carDetails?.brand || '');
      setModel(carDetails?.model || '');
      setNumberPlate(carDetails?.numberPlate || '');
      setStreet(editingCustomer.address?.street || '');
      setCity(editingCustomer.address?.city || '');
      setState(editingCustomer.address?.state || '');
      setZipCode(editingCustomer.address?.zipCode || '');
      setCountry(editingCustomer.address?.country || '');
      setNotes(editingCustomer.notes || '');
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setBrand('');
      setModel('');
      setNumberPlate('');
      setStreet('');
      setCity('');
      setState('');
      setZipCode('');
      setCountry('');
      setNotes('');
    }
    setError(null);
  }, [editingCustomer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!brand.trim()) {
      setError('Car brand is required');
      return;
    }
    if (!model.trim()) {
      setError('Car model is required');
      return;
    }
    if (!numberPlate.trim()) {
      setError('Number plate is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        address: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim(),
          country: country.trim(),
        },
        carDetails: {
          brand: brand.trim(),
          model: model.trim(),
          numberPlate: numberPlate.trim(),
        },
        notes: notes.trim() || undefined,
      });
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setBrand('');
      setModel('');
      setNumberPlate('');
      setStreet('');
      setCity('');
      setState('');
      setZipCode('');
      setCountry('');
      setNotes('');
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save customer';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {editingCustomer ? 'Edit Customer' : 'Create New Customer'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                placeholder="John"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                placeholder="Doe"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
              placeholder="john@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
              placeholder="+1 (555) 123-4567"
              disabled={loading}
            />
          </div>

          {/* Car Details Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Car Details</h3>

            <div className="space-y-3">
              <Combobox
                label="Brand"
                required
                value={brand}
                onChange={setBrand}
                options={brandOptions}
                placeholder="Select or type brand..."
                disabled={loading}
              />

              <Combobox
                label="Model"
                required
                value={model}
                onChange={setModel}
                options={modelOptions}
                placeholder={brand ? 'Select or type model...' : 'Select brand first...'}
                disabled={loading || !brand}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number Plate *
                </label>
                <input
                  type="text"
                  value={numberPlate}
                  onChange={(e) => setNumberPlate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                  placeholder="ABC-1234"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Address</h3>

            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                  placeholder="Street address"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                  placeholder="City"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                  placeholder="State"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                  placeholder="ZIP Code"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                  placeholder="Country"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
              placeholder="Additional notes about this customer"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {editingCustomer ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingCustomer ? 'Update Customer' : 'Create Customer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

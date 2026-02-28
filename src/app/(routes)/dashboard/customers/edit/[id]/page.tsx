'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Car, User, MapPin, FileText, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { customerService } from '../../service/customerService';
import { carBrandService, type CarBrand } from '../../service/carBrandService';
import type { UpdateCustomerData, Customer, CarDetails, CustomerType, CustomerSource } from '../../types';
import Combobox from '../../components/Combobox';

interface CarFormData {
  id: string;
  brand: string;
  model: string;
  numberPlate: string;
}

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  // Loading state for fetching customer
  const [fetchingCustomer, setFetchingCustomer] = useState(true);
  const [customerNotFound, setCustomerNotFound] = useState(false);

  // Customer Type & Code
  const [customerType, setCustomerType] = useState<CustomerType>('walk-in');
  const [source, setSource] = useState<CustomerSource>('');
  const [customerCode, setCustomerCode] = useState('');

  // Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Car Details - now an array
  const [cars, setCars] = useState<CarFormData[]>([
    { id: crypto.randomUUID(), brand: '', model: '', numberPlate: '' }
  ]);

  // Car brands data
  const [carBrands, setCarBrands] = useState<CarBrand[]>([]);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);

  // Address
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');

  // Notes
  const [notes, setNotes] = useState('');

  // Status
  const [isActive, setIsActive] = useState(true);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch customer data on mount
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setFetchingCustomer(true);
        const customer: Customer = await customerService.getCustomer(customerId);

        if (!customer) {
          setCustomerNotFound(true);
          return;
        }

        // Populate form fields
        setCustomerType(customer.customerType || 'walk-in');
        setSource(customer.source || '');
        setCustomerCode(customer.customerCode || '');
        setFirstName(customer.firstName || '');
        setLastName(customer.lastName || '');
        setEmail(customer.email || '');
        setPhone(customer.phone || '');

        // Car details - handle both single car and array of cars
        if (customer.carDetails) {
          if (Array.isArray(customer.carDetails)) {
            // Multiple cars
            const carsData: CarFormData[] = customer.carDetails.map((car: CarDetails) => ({
              id: crypto.randomUUID(),
              brand: car.brand || '',
              model: car.model || '',
              numberPlate: car.numberPlate || '',
            }));
            setCars(carsData.length > 0 ? carsData : [{ id: crypto.randomUUID(), brand: '', model: '', numberPlate: '' }]);
          } else {
            // Single car (legacy format)
            setCars([{
              id: crypto.randomUUID(),
              brand: customer.carDetails.brand || '',
              model: customer.carDetails.model || '',
              numberPlate: customer.carDetails.numberPlate || '',
            }]);
          }
        }

        // Address
        setStreet(customer.address?.street || '');
        setCity(customer.address?.city || '');
        setState(customer.address?.state || '');
        setZipCode(customer.address?.zipCode || '');
        setCountry(customer.address?.country || '');

        // Notes & Status
        setNotes(customer.notes || '');
        setIsActive(customer.isActive ?? true);
      } catch (err) {
        console.error('Error fetching customer:', err);
        setCustomerNotFound(true);
      } finally {
        setFetchingCustomer(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  // Get model options for a specific brand
  const getModelOptions = (brand: string): string[] => {
    if (!brand) return [];
    const selectedBrand = carBrands.find(
      (b) => b.name.toLowerCase() === brand.toLowerCase()
    );
    return selectedBrand ? selectedBrand.models : [];
  };

  // Handle car field changes
  const handleCarChange = (carId: string, field: keyof CarFormData, value: string) => {
    setCars(prevCars =>
      prevCars.map(car => {
        if (car.id !== carId) return car;

        // If brand changes, reset model
        if (field === 'brand') {
          return { ...car, brand: value, model: '' };
        }

        return { ...car, [field]: value };
      })
    );
  };

  // Add new car
  const addCar = () => {
    setCars(prevCars => [
      ...prevCars,
      { id: crypto.randomUUID(), brand: '', model: '', numberPlate: '' }
    ]);
  };

  // Remove car
  const removeCar = (carId: string) => {
    if (cars.length <= 1) return; // Keep at least one car
    setCars(prevCars => prevCars.filter(car => car.id !== carId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }
    if (customerType === 'online' && !source) {
      setError('Please select a source for online customer');
      return;
    }

    // Validate all cars
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      if (!car.brand.trim()) {
        setError(`Car ${i + 1}: Brand is required`);
        return;
      }
      if (!car.model.trim()) {
        setError(`Car ${i + 1}: Model is required`);
        return;
      }
      if (!car.numberPlate.trim()) {
        setError(`Car ${i + 1}: Number plate is required`);
        return;
      }
    }

    setLoading(true);
    try {
      // Prepare car details array
      const carDetailsArray: CarDetails[] = cars.map(car => ({
        brand: car.brand.trim(),
        model: car.model.trim(),
        numberPlate: car.numberPlate.trim(),
      }));

      const customerData: UpdateCustomerData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim(),
          country: country.trim(),
        },
        carDetails: carDetailsArray,
        notes: notes.trim() || undefined,
        isActive,
        customerType,
        source: customerType === 'online' ? source : undefined,
      };

      await customerService.updateCustomer(customerId, customerData);
      router.push('/dashboard/customers');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update customer';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (fetchingCustomer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#dc2626]" />
          <span className="text-gray-600">Loading customer...</span>
        </div>
      </div>
    );
  }

  // Not found state
  if (customerNotFound) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/customers"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Not Found</h1>
            <p className="mt-1 text-sm text-gray-500">The customer you are looking for does not exist.</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 mb-4">The customer with ID "{customerId}" could not be found.</p>
          <Link
            href="/dashboard/customers"
            className="inline-block px-6 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/customers"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
          <p className="mt-1 text-sm text-gray-500">Update customer information and vehicle details</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Customer Type & Code */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-[#dc2626]" />
            <h2 className="text-lg font-semibold text-gray-900">Customer Type</h2>
          </div>

          {customerCode && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-500">Customer Code: </span>
              <span className="text-sm font-semibold text-gray-900">{customerCode}</span>
            </div>
          )}

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="customerType"
                value="walk-in"
                checked={customerType === 'walk-in'}
                onChange={(e) => {
                  setCustomerType(e.target.value as CustomerType);
                  setSource('');
                }}
                className="w-4 h-4 text-[#dc2626] border-gray-300 focus:ring-[#dc2626]"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-700">Walk-in Customer</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="customerType"
                value="online"
                checked={customerType === 'online'}
                onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                className="w-4 h-4 text-[#dc2626] border-gray-300 focus:ring-[#dc2626]"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-700">Online Customer (Social Media / Leads)</span>
            </label>
          </div>

          {/* Source dropdown - only shown for online customers */}
          {customerType === 'online' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source <span className="text-red-500">*</span>
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as CustomerSource)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                disabled={loading}
              >
                <option value="">Select source...</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="word-of-mouth">Word of Mouth</option>
              </select>
            </div>
          )}
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-[#dc2626]" />
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
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
                Last Name <span className="text-red-500">*</span>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
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
          </div>
        </div>

        {/* Car Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-[#dc2626]" />
              <h2 className="text-lg font-semibold text-gray-900">Car Details</h2>
              <span className="text-sm text-gray-500">({cars.length} {cars.length === 1 ? 'vehicle' : 'vehicles'})</span>
            </div>
            <button
              type="button"
              onClick={addCar}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#dc2626] bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Car
            </button>
          </div>

          <div className="space-y-4">
            {cars.map((car, index) => (
              <div
                key={car.id}
                className={`p-4 rounded-lg border ${cars.length > 1 ? 'border-gray-200 bg-gray-50' : 'border-transparent'}`}
              >
                {cars.length > 1 && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Car {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeCar(car.id)}
                      disabled={loading}
                      className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Combobox
                    label="Brand"
                    required
                    value={car.brand}
                    onChange={(value) => handleCarChange(car.id, 'brand', value)}
                    options={brandOptions}
                    placeholder="Select or type brand..."
                    disabled={loading}
                  />
                  <Combobox
                    label="Model"
                    required
                    value={car.model}
                    onChange={(value) => handleCarChange(car.id, 'model', value)}
                    options={getModelOptions(car.brand)}
                    placeholder={car.brand ? 'Select or type model...' : 'Select brand first...'}
                    disabled={loading || !car.brand}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number Plate <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={car.numberPlate}
                      onChange={(e) => handleCarChange(car.id, 'numberPlate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                      placeholder="ABC-1234"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-[#dc2626]" />
            <h2 className="text-lg font-semibold text-gray-900">Address</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                placeholder="123 Main Street"
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                  placeholder="New York"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                  placeholder="NY"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP / Postal Code
                </label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                  placeholder="10001"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
                  placeholder="United States"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-[#dc2626]" />
            <h2 className="text-lg font-semibold text-gray-900">Additional Notes</h2>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
            placeholder="Any additional information about this customer..."
            rows={4}
            disabled={loading}
          />
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Customer Status</h2>
              <p className="text-sm text-gray-500">Enable or disable this customer account</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#dc2626]"></div>
              <span className="ms-3 text-sm font-medium text-gray-700">
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/dashboard/customers"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

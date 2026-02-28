import React from 'react';
import type { FormData, Errors } from './types';

interface EmailFieldProps {
  formData: FormData;
  errors?: Errors;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const EmailField: React.FC<EmailFieldProps> = ({ formData, errors, handleInputChange }) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
      <input
        name="email"
        type="email"
        required
        value={formData.email}
        onChange={handleInputChange}
        className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/20 transition-all outline-none text-gray-900 font-medium placeholder-gray-400"
        placeholder="john@example.com"
      />
      {errors?.email && (
        <p className="text-sm text-red-500 mt-1">{errors.email}</p>
      )}
    </div>
  );
};

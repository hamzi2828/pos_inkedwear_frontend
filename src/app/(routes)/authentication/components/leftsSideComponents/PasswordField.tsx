import React from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

interface PasswordFieldProps {
  label: string;
  name?: string;
  placeholder: string;
  value: string;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  error?: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  name = 'password',
  placeholder,
  value,
  showPassword,
  setShowPassword,
  error,
  handleInputChange,
}) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input
          name={name}
          type={showPassword ? 'text' : 'password'}
          required
          value={value}
          onChange={handleInputChange}
          className="w-full pl-4 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/20 transition-all outline-none text-gray-900 font-medium placeholder-gray-400"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#dc2626] transition-colors"
        >
          {showPassword ? (
            <FiEyeOff className="h-5 w-5" />
          ) : (
            <FiEye className="h-5 w-5" />
          )}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

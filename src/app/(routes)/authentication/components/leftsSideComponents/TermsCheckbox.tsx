import React from 'react';
import Link from 'next/link';

interface TermsCheckboxProps {
  isSignUp: boolean;
  acceptTerms: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  termsError?: string | null;
}

export const TermsCheckbox: React.FC<TermsCheckboxProps> = ({ isSignUp, acceptTerms, handleInputChange, termsError }) => {
  if (!isSignUp) return null;
  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-start space-x-3">
        <input
          name="acceptTerms"
          type="checkbox"
          checked={acceptTerms}
          onChange={handleInputChange}
          className="h-5 w-5 rounded border-gray-300 bg-white text-[#dc2626] focus:ring-[#dc2626] focus:ring-offset-0 mt-0.5 cursor-pointer"
        />
        <label className="text-sm text-gray-500 font-medium leading-relaxed">
          I agree to the{' '}
          <Link
            href="/privacy-policy"
            className="text-[#dc2626] hover:text-[#b91c1c] font-semibold transition-colors"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy-policy"
            className="text-[#dc2626] hover:text-[#b91c1c] font-semibold transition-colors"
          >
            Privacy Policy
          </Link>
        </label>
      </div>
      {termsError && (
        <p className="text-sm text-red-500 mt-2">{termsError}</p>
      )}
    </div>
  );
};

import React from 'react';
import type { Mode } from './types';

interface SignInUtilitiesProps {
  isSignUp: boolean;
  isForgot: boolean;
  rememberMe: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateMode: (mode: Mode) => void;
}

export const SignInUtilities: React.FC<SignInUtilitiesProps> = ({
  isSignUp,
  isForgot,
  rememberMe,
  handleInputChange,
  updateMode,
}) => {
  if (isSignUp || isForgot) return null;
  return (
    <div className="flex items-center justify-between">
      <label className="flex items-center space-x-3 cursor-pointer group">
        <input
          name="rememberMe"
          type="checkbox"
          checked={rememberMe}
          onChange={handleInputChange}
          className="h-5 w-5 rounded border-gray-300 bg-white text-[#dc2626] focus:ring-[#dc2626] focus:ring-offset-0 cursor-pointer"
        />
        <span className="text-sm text-gray-500 font-medium group-hover:text-gray-700 transition-colors">Remember me</span>
      </label>
      <button
        type="button"
        onClick={() => updateMode('forgot')}
        className="text-sm text-[#dc2626] hover:text-[#b91c1c] font-semibold transition-colors"
      >
        Forgot password?
      </button>
    </div>
  );
};

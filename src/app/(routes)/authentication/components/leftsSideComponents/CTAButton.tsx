import React from 'react';
import { FiArrowRight, FiUserPlus, FiLock, FiLoader } from 'react-icons/fi';

interface CTAButtonProps {
  isLoading: boolean;
  isSignUp: boolean;
  isForgot: boolean;
  handleSubmit: () => void;
}

export const CTAButton: React.FC<CTAButtonProps> = ({ isLoading, isSignUp, isForgot, handleSubmit }) => {
  return (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={isLoading}
      className="w-full bg-[#dc2626] text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg shadow-[#dc2626]/20 hover:bg-[#b91c1c] hover:shadow-[#dc2626]/30 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
    >
      {isLoading ? (
        <>
          <FiLoader className="h-5 w-5 animate-spin" />
          {isSignUp ? 'Creating Account...' : isForgot ? 'Resetting...' : 'Signing In...'}
        </>
      ) : (
        <>
          {isSignUp ? (
            <FiUserPlus className="h-5 w-5" />
          ) : isForgot ? (
            <FiLock className="h-5 w-5" />
          ) : (
            <FiArrowRight className="h-5 w-5" />
          )}
          {isSignUp ? 'Create Account' : isForgot ? 'Reset Password' : 'Sign In'}
        </>
      )}
    </button>
  );
};

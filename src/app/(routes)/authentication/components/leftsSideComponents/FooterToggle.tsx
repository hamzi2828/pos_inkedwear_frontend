import React from 'react';
import type { Mode } from './types';

interface FooterToggleProps {
  isSignUp: boolean;
  isForgot: boolean;
  toggleAuthMode: () => void;
  updateMode: (mode: Mode) => void;
}

export const FooterToggle: React.FC<FooterToggleProps> = ({ isSignUp, isForgot, toggleAuthMode, updateMode }) => {
  return (
    <div className="text-center pt-4">
      <p className="text-sm text-gray-500 font-medium">
        {isForgot ? (
          <>
            Remembered your password?{' '}
            <button
              type="button"
              onClick={() => updateMode('signin')}
              className="text-[#dc2626] hover:text-[#b91c1c] font-bold transition-colors"
            >
              Sign In
            </button>
          </>
        ) : isSignUp ? (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-[#dc2626] hover:text-[#b91c1c] font-bold transition-colors"
            >
              Sign In
            </button>
          </>
        ) : (
          <>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-[#dc2626] hover:text-[#b91c1c] font-bold transition-colors"
            >
              Sign Up
            </button>
          </>
        )}
      </p>
    </div>
  );
};

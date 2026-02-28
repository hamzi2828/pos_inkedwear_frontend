import React from 'react';
import { FiUserPlus, FiLock, FiLogIn } from 'react-icons/fi';
import { FaTshirt } from 'react-icons/fa';

interface HeaderProps {
  isSignUp: boolean;
  isForgot: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isSignUp, isForgot }) => {
  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-20 h-20 rounded-2xl bg-[#dc2626] flex items-center justify-center mx-auto shadow-2xl shadow-[#dc2626]/20 hover:scale-105 transition-transform duration-300">
          {isForgot ? (
            <FiLock className="w-10 h-10 text-white" />
          ) : isSignUp ? (
            <FiUserPlus className="w-10 h-10 text-white" />
          ) : (
            <FaTshirt className="w-10 h-10 text-white" />
          )}
        </div>
      </div>
      <h1 className="text-4xl font-black text-gray-900 leading-tight tracking-tight mb-3 font-sans">
        {isForgot ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
      </h1>
      <p className="text-gray-500 text-base font-medium leading-relaxed">
        {isForgot
          ? 'Set a new password for your account'
          : isSignUp
          ? 'Join Inked Wear today'
          : 'Sign in to your Inked Wear account'}
      </p>
    </div>
  );
};

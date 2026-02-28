'use client';

import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
}

export default function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <p className="text-red-700">{message}</p>
      </div>
    </div>
  );
}

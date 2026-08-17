import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Access Denied</h1>
      <p className="text-slate-500 mb-6 text-center">You don't have permission to access this page.</p>
      <Link to="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
        Go Home
      </Link>
    </div>
  );
};

export default Unauthorized;

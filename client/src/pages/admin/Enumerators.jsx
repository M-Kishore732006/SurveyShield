import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus } from 'lucide-react';

const Enumerators = () => {
  const [enumerators, setEnumerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchEnumerators();
  }, []);

  const fetchEnumerators = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/enumerators', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEnumerators(res.data);
    } catch (err) {
      console.error('Failed to fetch enumerators', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enumerators</h1>
          <p className="text-slate-500 mt-1">Manage survey enumerators</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          <span>Add Enumerator</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search enumerators..." 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Village</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Records</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Reliability</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading...</td>
                </tr>
              ) : enumerators.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No enumerators found.</td>
                </tr>
              ) : (
                enumerators.map((enumr) => (
                  <tr key={enumr._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{enumr.name}</div>
                      <div className="text-sm text-slate-500">{enumr.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{enumr.villageId?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4 text-slate-600">{enumr.totalRecords}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-slate-200 rounded-full h-2 max-w-[100px]">
                          <div 
                            className={`h-2 rounded-full ${enumr.reliabilityScore > 80 ? 'bg-green-500' : enumr.reliabilityScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                            style={{ width: `${enumr.reliabilityScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{enumr.reliabilityScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        enumr.status === 'Active' ? 'bg-green-100 text-green-700' : 
                        enumr.status === 'Review' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {enumr.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Enumerators;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, MapPin, Download } from 'lucide-react';

const Villages = () => {
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchVillages();
  }, []);

  const fetchVillages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/villages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVillages(res.data);
    } catch (err) {
      console.error('Failed to fetch villages', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (villageId, villageName) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/reports/village/${villageId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Village_Report_${villageName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download report', err);
      alert('Failed to generate report.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Villages</h1>
          <p className="text-slate-500 mt-1">Manage survey locations and data quality</p>
        </div>
        <button className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus className="w-5 h-5" />
          <span>Add Village</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search villages..." 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Village Details</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Enumerators</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Records</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Quality Score</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading...</td>
                </tr>
              ) : villages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No villages found.</td>
                </tr>
              ) : (
                villages.map((village) => (
                  <tr key={village._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                        <span>{village.name}</span>
                      </div>
                      <div className="text-sm text-slate-500 mt-1">{village.district}, {village.state}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{village.enumerators?.length || 0} assigned</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">Total: {village.totalRecords}</div>
                      <div className="text-xs text-rose-500 mt-1">{village.highRiskRecords} high risk</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{village.qualityScore}</span>
                        <span className="text-xs text-slate-500">/ 100</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        village.status === 'Good' ? 'bg-green-100 text-green-700' : 
                        village.status === 'Needs Monitoring' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {village.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-3">
                        <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Manage</button>
                        <button 
                          onClick={() => handleDownloadReport(village._id, village.name)}
                          className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                        >
                          <Download className="w-4 h-4" />
                          <span>Report</span>
                        </button>
                      </div>
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

export default Villages;

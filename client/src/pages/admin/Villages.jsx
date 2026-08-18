import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, MapPin, Download, X } from 'lucide-react';

const Villages = () => {
  const [villages, setVillages] = useState([]);
  const [enumerators, setEnumerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    villageId: '',
    name: '',
    district: '',
    state: '',
    enumerator: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchVillages();
    fetchEnumerators();
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

  const fetchEnumerators = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/enumerators', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEnumerators(res.data);
    } catch (err) {
      console.error('Failed to fetch enumerators', err);
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

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const submitData = { ...formData };
      if (!submitData.enumerator) {
        delete submitData.enumerator;
      }
      await axios.post('http://localhost:5000/api/admin/villages', submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      setFormData({ villageId: '', name: '', district: '', state: '', enumerator: '' });
      fetchVillages();
      fetchEnumerators();
    } catch (err) {
      console.error('Failed to create village', err);
      alert('Failed to create village: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Villages</h1>
          <p className="text-slate-500 mt-1">Manage survey locations and data quality</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
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
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Assigned Enumerator</th>
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
                    <td className="px-6 py-4 text-slate-600">{village.enumerator?.name || 'Unassigned'}</td>
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

      {/* Add Village Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Add New Village</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Village ID</label>
                <input 
                  type="text" required placeholder="e.g. V1011"
                  value={formData.villageId} onChange={e => setFormData({...formData, villageId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Village Name</label>
                <input 
                  type="text" required placeholder="e.g. Rampur"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input 
                    type="text" required placeholder="e.g. State X"
                    value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                  <input 
                    type="text" required placeholder="e.g. District A"
                    value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Enumerator (Optional - 1 to 1)</label>
                <select
                  value={formData.enumerator}
                  onChange={e => setFormData({ ...formData, enumerator: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Unassigned</option>
                  {enumerators
                    .filter(enumr => !enumr.villageId)
                    .map(enumr => (
                      <option key={enumr._id} value={enumr._id}>
                        {enumr.name} ({enumr.email})
                      </option>
                    ))
                  }
                </select>
              </div>
              <div className="pt-4 flex space-x-3">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={isSubmitting}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Village'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Villages;

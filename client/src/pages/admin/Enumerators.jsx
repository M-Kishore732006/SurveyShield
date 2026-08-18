import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Trash2, X } from 'lucide-react';

const Enumerators = () => {
  const [enumerators, setEnumerators] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    state: '',
    district: '',
    villageId: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchEnumerators();
    fetchVillages();
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

  const fetchVillages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/villages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVillages(res.data);
    } catch (err) {
      console.error('Failed to fetch villages', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enumerator?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/enumerators/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEnumerators(enumerators.filter(e => e._id !== id));
      fetchVillages(); // Refetch to update village assignment availability
    } catch (err) {
      console.error('Failed to delete enumerator', err);
      alert('Failed to delete enumerator');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      // Only send non-empty villageId
      const submitData = { ...formData };
      if (!submitData.villageId) {
        delete submitData.villageId;
      }
      await axios.post('http://localhost:5000/api/admin/enumerators', submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', phone: '', state: '', district: '', villageId: '' });
      fetchEnumerators();
      fetchVillages();
    } catch (err) {
      console.error('Failed to create enumerator', err);
      alert('Failed to create enumerator: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enumerators</h1>
          <p className="text-slate-500 mt-1">Manage survey enumerators</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
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
                    <td className="px-6 py-4 flex space-x-3 items-center">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                      <button 
                        onClick={() => handleDelete(enumr._id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Delete Enumerator"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Enumerator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Add New Enumerator</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" required 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" required 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password" required 
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input 
                    type="text" required 
                    value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                  <input 
                    type="text" required 
                    value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Village (Optional - 1 to 1)</label>
                <select
                  value={formData.villageId}
                  onChange={e => setFormData({ ...formData, villageId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Unassigned</option>
                  {villages
                    .filter(v => !v.enumerator)
                    .map(v => (
                      <option key={v._id} value={v._id}>
                        {v.name} ({v.district})
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
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Enumerator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enumerators;

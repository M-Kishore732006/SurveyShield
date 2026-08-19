import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FileText, Eye, User, Calendar, Database, ShieldAlert, AlertTriangle, CheckCircle, Search, Trash2 } from 'lucide-react';

const Surveys = () => {
  const [enumerators, setEnumerators] = useState([]);
  const [selectedEnumerator, setSelectedEnumerator] = useState('');
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEnumerators();
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [selectedEnumerator]);

  const fetchEnumerators = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/enumerators', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEnumerators(res.data);
    } catch (err) {
      console.error('Error fetching enumerators:', err);
    }
  };

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {};
      if (selectedEnumerator) {
        params.enumeratorId = selectedEnumerator;
      }
      const res = await axios.get('http://localhost:5000/api/surveys/uploads', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setDatasets(res.data);
    } catch (err) {
      console.error('Error fetching datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (datasetId) => {
    if (!window.confirm("Are you sure you want to delete this dataset? All associated survey records will also be permanently deleted.")) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/surveys/uploads/${datasetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDatasets(prev => prev.filter(d => d._id !== datasetId));
    } catch (err) {
      console.error('Error deleting dataset:', err);
      alert('Failed to delete dataset. ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredDatasets = datasets.filter(d => 
    d.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Survey Data Uploads</h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor and review survey CSV datasets uploaded by field enumerators.
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <User className="w-5 h-5 text-slate-400" />
          <div className="flex-1 md:w-72">
            <select
              value={selectedEnumerator}
              onChange={(e) => setSelectedEnumerator(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium text-slate-700"
            >
              <option value="">All Enumerators</option>
              {enumerators.map(e => (
                <option key={e._id} value={e._id}>
                  {e.name} ({e.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by file name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Datasets Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Uploaded By</th>
                <th className="px-6 py-4">Upload Date</th>
                <th className="px-6 py-4">Total Records</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Anomalies Stats</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="text-sm font-medium">Loading datasets...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDatasets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center space-y-3">
                      <Database className="w-12 h-12 text-slate-300" />
                      <span className="text-sm font-medium">No CSV datasets found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDatasets.map(dataset => (
                  <tr key={dataset._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span>{dataset.fileName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {dataset.enumeratorId?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(dataset.uploadDate).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {dataset.numberOfRecords}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        dataset.processingStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        dataset.processingStatus === 'Processing' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {dataset.processingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-xs font-semibold text-emerald-600" title="Valid Records">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          <span>{dataset.anomalyStats?.valid || 0}</span>
                        </div>
                        <div className="flex items-center text-xs font-semibold text-amber-600" title="Warnings">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                          <span>{dataset.anomalyStats?.warnings || 0}</span>
                        </div>
                        <div className="flex items-center text-xs font-semibold text-red-600" title="Critical Anomalies">
                          <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                          <span>{dataset.anomalyStats?.critical || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Link
                          to={`/admin/uploads/${dataset._id}`}
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-bold"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(dataset._id)}
                          className="inline-flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm font-bold ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
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

export default Surveys;

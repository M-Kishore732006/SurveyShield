import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, ShieldAlert, Search } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center space-x-4">
    <div className={`p-3 rounded-full ${color} shadow-sm`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

const UploadDetails = () => {
  const { id } = useParams();
  const [upload, setUpload] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filter State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('All');

  useEffect(() => {
    fetchDetails();
  }, [id]);

  useEffect(() => {
    fetchRecords();
  }, [id, page, search, riskLevel]);

  const fetchDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/surveys/uploads/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUpload(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/surveys/uploads/${id}/records`, {
        params: { page, limit: 10, search, riskLevel },
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(res.data.records);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!upload) return <div className="p-8 text-center text-slate-500">Loading dataset details...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-12">
      <nav className="bg-white border-b border-slate-200 py-4 px-8 flex items-center sticky top-0 z-10 shadow-sm">
        <Link to="/enumerator/dashboard" className="text-slate-500 hover:text-blue-600 mr-4 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-lg font-bold text-slate-800 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-500" />
          {upload.fileName}
        </div>
        <div className="ml-auto flex space-x-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            upload.processingStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {upload.processingStatus}
          </span>
        </div>
      </nav>

      <div className="p-8 max-w-7xl mx-auto w-full">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Records" value={upload.numberOfRecords} icon={FileText} color="bg-blue-500" />
          <StatCard title="Valid Records" value={upload.anomalyStats?.valid || 0} icon={CheckCircle} color="bg-emerald-500" />
          <StatCard title="Warnings" value={upload.anomalyStats?.warnings || 0} icon={AlertTriangle} color="bg-amber-500" />
          <StatCard title="Critical Anomalies" value={upload.anomalyStats?.critical || 0} icon={ShieldAlert} color="bg-red-500" />
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Survey Records</h2>
              <p className="text-sm text-slate-500 mt-1">Review the data collected in this batch</p>
            </div>
            <div className="flex space-x-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search Household ID..." 
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select 
                value={riskLevel}
                onChange={(e) => { setRiskLevel(e.target.value); setPage(1); }}
                className="px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="All">All Risks</option>
                <option value="Normal">Normal</option>
                <option value="Low Risk">Low Risk</option>
                <option value="Medium Risk">Medium Risk</option>
                <option value="High Risk">High Risk</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Household ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Demographics</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Validation</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading records...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No records found matching criteria.</td></tr>
                ) : (
                  records.map(record => (
                    <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">{record.household_id}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(record.survey_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        Age {record.age}, {record.gender}
                        {record.dynamicData && Object.keys(record.dynamicData).length > 0 && (
                          <div className="text-xs text-slate-400 mt-1 truncate max-w-[200px]">
                            + {Object.keys(record.dynamicData).length} dynamic fields
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          record.validationStatus === 'Validated' ? 'bg-emerald-100 text-emerald-700' :
                          record.validationStatus === 'Flagged' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {record.validationStatus}
                        </span>
                        {record.anomalyReasons && record.anomalyReasons.length > 0 && (
                          <div className="mt-2 space-y-1 bg-red-50 p-2 rounded border border-red-100">
                            <p className="text-xs font-bold text-red-700 mb-1">ML Anomalies:</p>
                            {record.anomalyReasons.map((reason, idx) => (
                              <p key={idx} className="text-xs text-red-600 flex items-start leading-tight">
                                <span className="mr-1 mt-0.5 text-[10px]">●</span>
                                <span>{reason}</span>
                              </p>
                            ))}
                          </div>
                        )}
                        {record.ruleMessages && record.ruleMessages.length > 0 && (
                          <div className="mt-2 space-y-1 bg-amber-50 p-2 rounded border border-amber-100">
                            <p className="text-xs font-bold text-amber-700 mb-1">Rule Violations:</p>
                            {record.ruleMessages.map((msg, idx) => (
                              <p key={idx} className="text-xs text-amber-600 flex items-start leading-tight">
                                <span className="mr-1 mt-0.5 text-[10px]">●</span>
                                <span>{msg}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          record.riskLevel === 'High Risk' ? 'bg-red-100 text-red-700' :
                          record.riskLevel === 'Medium Risk' ? 'bg-amber-100 text-amber-700' :
                          record.riskLevel === 'Low Risk' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {record.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600 font-medium">Page {page} of {totalPages || 1}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadDetails;

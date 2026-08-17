import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Upload, FileText, CheckCircle, AlertTriangle, LogOut, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center space-x-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-default">
    <div className={`p-3 rounded-full ${color} shadow-sm`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

const EnumeratorDashboard = () => {
  const { user, logout } = useAuth();
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [surveys, setSurveys] = useState([]);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/surveys', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSurveys(res.data);
    } catch (err) {
      console.error('Error fetching surveys', err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/surveys/upload', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadStatus(res.data);
      setFile(null);
      fetchSurveys();
    } catch (err) {
      console.error(err);
      setUploadStatus({ error: 'Upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  // Prepare data for the chart
  const validatedCount = surveys.filter(s => s.validationStatus === 'Validated').length;
  const flaggedCount = surveys.filter(s => s.validationStatus === 'Flagged').length;
  const pendingCount = surveys.length - validatedCount - flaggedCount;

  const chartData = [
    { name: 'Validated', value: validatedCount, color: '#10b981' },
    { name: 'Flagged', value: flaggedCount, color: '#f59e0b' },
    { name: 'Pending', value: pendingCount, color: '#64748b' }
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 py-4 px-8 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-2 text-blue-700 font-bold text-xl">
          <CheckCircle className="w-6 h-6" />
          <span>SurveyShield</span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex flex-col text-right">
             <span className="text-slate-800 font-semibold text-sm">Hello, {user?.name}</span>
             <span className="text-slate-500 text-xs">Enumerator ID: {user?.id?.substring(0, 8)}</span>
          </div>
          <button 
            onClick={logout} 
            className="text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign out</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back!</h1>
            <p className="text-slate-500 mt-1">Here is a quick overview of your field data collection.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Records" value={surveys.length} icon={FileText} color="bg-blue-500" />
          <StatCard title="Validated" value={validatedCount} icon={CheckCircle} color="bg-emerald-500" />
          <StatCard title="Flagged" value={flaggedCount} icon={AlertTriangle} color="bg-amber-500" />
          <StatCard title="Reliability Score" value="100%" icon={BarChart2} color="bg-indigo-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Upload & Charts */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Upload Box */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-shadow hover:shadow-md">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-blue-600" /> Upload Survey Data
              </h2>
              <form onSubmit={handleUpload}>
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/50 rounded-xl p-8 flex flex-col items-center justify-center mb-4 transition-colors cursor-pointer group-hover:bg-blue-50">
                    <Upload className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                    <p className="text-sm text-slate-600 mb-3 text-center font-medium">Drag and drop your CSV file here, or click to browse</p>
                    <input 
                        type="file" 
                        accept=".csv" 
                        onChange={(e) => setFile(e.target.files[0])}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                    </div>
                </div>
                <button 
                  type="submit" 
                  disabled={!file || isUploading}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow active:scale-95"
                >
                  {isUploading ? (
                      <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing Records...
                      </span>
                  ) : 'Upload & Validate'}
                </button>
              </form>

              {uploadStatus && !uploadStatus.error && (
                <div className="mt-6 p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm mb-1">Upload Complete</p>
                    <div className="text-xs space-y-1 opacity-90">
                        <p>{uploadStatus.processed} of {uploadStatus.totalReceived} records processed</p>
                        {uploadStatus.flagged > 0 && (
                            <p className="text-amber-600 font-semibold mt-1">⚠️ {uploadStatus.flagged} records flagged for review by admin.</p>
                        )}
                    </div>
                  </div>
                </div>
              )}
              {uploadStatus && uploadStatus.error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{uploadStatus.error}</span>
                </div>
              )}
            </div>

            {/* Quality Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Validation Status</h2>
                {chartData.length > 0 ? (
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                        No data to display
                    </div>
                )}
            </div>

          </div>

          {/* Right Column: Submissions Table */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                      <h2 className="text-lg font-bold text-slate-800">All Submissions</h2>
                      <p className="text-sm text-slate-500 mt-1">Scroll to view all your uploaded records</p>
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                      {surveys.length} Records
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto max-h-[700px] p-0 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Household ID</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Validation Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {surveys.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                <div className="flex flex-col items-center justify-center">
                                    <FileText className="w-12 h-12 text-slate-300 mb-3" />
                                    <p className="text-lg font-medium text-slate-900">No records found</p>
                                    <p className="text-sm">Upload your first CSV to get started.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        surveys.map(record => (
                        <tr key={record._id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 text-sm font-semibold text-slate-800">{record.household_id}</td>
                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">{new Date(record.survey_date).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                record.validationStatus === 'Validated' ? 'bg-emerald-100 text-emerald-700' :
                                record.validationStatus === 'Flagged' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-700'
                            }`}>
                                {record.validationStatus === 'Validated' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {record.validationStatus === 'Flagged' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                {record.validationStatus}
                            </span>
                            </td>
                            <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                record.riskLevel === 'High Risk' ? 'bg-red-100 text-red-700' :
                                record.riskLevel === 'Medium Risk' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnumeratorDashboard;

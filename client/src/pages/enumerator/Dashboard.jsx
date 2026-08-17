import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Upload, FileText, CheckCircle, AlertTriangle, LogOut, BarChart2, Eye } from 'lucide-react';
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
  const [datasets, setDatasets] = useState([]);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/surveys/uploads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDatasets(res.data);
    } catch (err) {
      console.error('Error fetching datasets', err);
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
      // Wait a moment for background processing before fetching
      setTimeout(fetchDatasets, 1000);
    } catch (err) {
      console.error(err);
      setUploadStatus({ error: 'Upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  // Aggregate stats
  let totalRecords = 0;
  let totalValid = 0;
  let totalFlagged = 0;
  datasets.forEach(d => {
    totalRecords += d.numberOfRecords || 0;
    if (d.anomalyStats) {
      totalValid += d.anomalyStats.valid;
      totalFlagged += d.anomalyStats.warnings + d.anomalyStats.critical;
    }
  });

  const chartData = [
    { name: 'Validated', value: totalValid, color: '#10b981' },
    { name: 'Flagged', value: totalFlagged, color: '#f59e0b' }
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
          <StatCard title="Total Records" value={totalRecords} icon={FileText} color="bg-blue-500" />
          <StatCard title="Validated" value={totalValid} icon={CheckCircle} color="bg-emerald-500" />
          <StatCard title="Flagged" value={totalFlagged} icon={AlertTriangle} color="bg-amber-500" />
          <StatCard title="Total Datasets" value={datasets.length} icon={BarChart2} color="bg-indigo-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Upload & Charts */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Upload Box */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-shadow hover:shadow-md">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-blue-600" /> Upload Survey CSV
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
                          Uploading...
                      </span>
                  ) : 'Upload & Validate'}
                </button>
              </form>

              {uploadStatus && !uploadStatus.error && (
                <div className="mt-6 p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm mb-1">Upload Started!</p>
                    <p className="text-xs">Your dataset has been queued for validation. Check the table for progress.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quality Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Overall Data Quality</h2>
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

          {/* Right Column: Uploaded Datasets Table */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                      <h2 className="text-lg font-bold text-slate-800">Uploaded Datasets</h2>
                      <p className="text-sm text-slate-500 mt-1">History of all your CSV uploads</p>
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                      {datasets.length} Batches
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto max-h-[700px] p-0 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">File Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Upload Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Records</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {datasets.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                <div className="flex flex-col items-center justify-center">
                                    <FileText className="w-12 h-12 text-slate-300 mb-3" />
                                    <p className="text-lg font-medium text-slate-900">No datasets found</p>
                                    <p className="text-sm">Upload your first CSV to get started.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        datasets.map(dataset => (
                        <tr key={dataset._id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="font-semibold text-slate-800 flex items-center space-x-2">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                    <span>{dataset.fileName}</span>
                                </div>
                                {dataset.villages && dataset.villages.length > 0 && (
                                    <div className="text-xs text-slate-500 mt-1">
                                        Villages: {dataset.villages.length}
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                {new Date(dataset.uploadDate).toLocaleDateString()}
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
                                <Link 
                                    to={`/enumerator/uploads/${dataset._id}`}
                                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-bold"
                                >
                                    <Eye className="w-4 h-4" />
                                    <span>View Details</span>
                                </Link>
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

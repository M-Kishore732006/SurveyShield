import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Upload, FileText, CheckCircle, AlertTriangle, LogOut } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center space-x-4">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 py-4 px-8 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-blue-700 font-bold text-xl">
          <CheckCircle className="w-6 h-6" />
          <span>SurveyShield</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-slate-600 font-medium">Hello, {user?.name}</span>
          <button onClick={logout} className="text-slate-500 hover:text-slate-900 flex items-center space-x-1">
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Enumerator Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Records" value={surveys.length} icon={FileText} color="bg-blue-500" />
          <StatCard title="Validated" value={surveys.filter(s => s.validationStatus !== 'Pending').length} icon={CheckCircle} color="bg-emerald-500" />
          <StatCard title="Flagged" value={surveys.filter(s => s.validationStatus === 'Flagged').length} icon={AlertTriangle} color="bg-amber-500" />
          <StatCard title="Reliability" value="100" icon={CheckCircle} color="bg-indigo-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold mb-4">Upload Survey Data</h2>
              <form onSubmit={handleUpload}>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500 mb-2 text-center">Drag and drop your CSV file here, or click to browse</p>
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={(e) => setFile(e.target.files[0])}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!file || isUploading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isUploading ? 'Uploading...' : 'Upload CSV'}
                </button>
              </form>

              {uploadStatus && !uploadStatus.error && (
                <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">
                  <p className="font-semibold mb-1">Upload Complete</p>
                  <p>{uploadStatus.totalReceived} records received</p>
                  <p>{uploadStatus.processed} processed</p>
                  <p>{uploadStatus.flagged} flagged ({uploadStatus.highRisk} high risk)</p>
                </div>
              )}
              {uploadStatus && uploadStatus.error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                  {uploadStatus.error}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold mb-4">Recent Submissions</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">Household ID</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">Date</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {surveys.slice(0, 5).map(record => (
                      <tr key={record._id}>
                        <td className="px-4 py-3 text-sm font-medium">{record.household_id}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{new Date(record.survey_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.validationStatus === 'Validated' ? 'bg-green-100 text-green-700' :
                            record.validationStatus === 'Flagged' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {record.validationStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.riskLevel === 'High Risk' ? 'bg-red-100 text-red-700' :
                            record.riskLevel === 'Medium Risk' ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {record.riskLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
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

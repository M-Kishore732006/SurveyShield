import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Users, MapPin, FileText, CheckCircle, AlertTriangle, AlertOctagon, Activity } from 'lucide-react';

const DashboardCard = ({ title, value, icon: Icon, color }) => (
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

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [mlMessage, setMlMessage] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p className="text-sm font-semibold text-slate-500">Loading dashboard...</p>
    </div>
  );

  if (!stats) return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-slate-550">
      <AlertOctagon className="w-12 h-12 text-rose-500 mb-3" />
      <p className="font-semibold">Error loading dashboard data.</p>
    </div>
  );

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      setMlMessage('');
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/admin/ml/train', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMlMessage(res.data.message || 'Model retrained successfully');
      setTimeout(() => setMlMessage(''), 5000);
    } catch (err) {
      console.error(err);
      setMlMessage(err.response?.data?.error || err.response?.data?.message || 'Failed to retrain model');
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-550 text-sm mt-0.5">Welcome back, {user?.name}</p>
        </div>
        <div className="flex flex-col items-end w-full md:w-auto">
          <button 
            onClick={handleRetrain}
            disabled={retraining}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Activity className="w-4 h-4" />
            <span>{retraining ? 'Retraining Model...' : 'Retrain ML Model'}</span>
          </button>
          {mlMessage && (
            <p className={`text-xs font-semibold mt-2 ${mlMessage.includes('Failed') || mlMessage.includes('Not enough') ? 'text-rose-650' : 'text-emerald-650'}`}>
              {mlMessage}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Total Enumerators" value={stats.totalEnumerators} icon={Users} color="bg-blue-500" />
        <DashboardCard title="Total Villages" value={stats.totalVillages} icon={MapPin} color="bg-indigo-500" />
        <DashboardCard title="Survey Records" value={stats.totalSurveyRecords} icon={FileText} color="bg-emerald-500" />
        <DashboardCard title="Records Validated" value={stats.recordsValidated} icon={CheckCircle} color="bg-teal-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Records Flagged" value={stats.recordsFlagged} icon={AlertTriangle} color="bg-amber-500" />
        <DashboardCard title="High-Risk Records" value={stats.highRiskRecords} icon={AlertOctagon} color="bg-rose-500" />
        <DashboardCard title="Avg Quality Score" value={`${stats.averageDataQualityScore}/100`} icon={Activity} color="bg-violet-500" />
      </div>

      {/* Placeholders for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-150/80 shadow-xs">
          <h3 className="text-base font-semibold mb-4 text-slate-800">Survey Processing Trend</h3>
          <div className="h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100 text-slate-400">
            <Activity className="w-8 h-8 text-slate-300 mb-2" />
            <span className="text-sm font-semibold text-slate-400">Processing trends will appear here</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-150/80 shadow-xs">
          <h3 className="text-base font-semibold mb-4 text-slate-800">Anomaly Distribution</h3>
          <div className="h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100 text-slate-400">
            <AlertTriangle className="w-8 h-8 text-slate-300 mb-2" />
            <span className="text-sm font-semibold text-slate-400">Anomaly charts will appear here</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

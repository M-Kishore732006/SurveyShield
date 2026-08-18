import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, BarChart3, BookOpen, Briefcase, Clock, Home, DollarSign, HelpCircle, Activity } from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const Statistics = () => {
  const [trends, setTrends] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('income');

  useEffect(() => {
    fetchTrends();
  }, [selectedDistrict]);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/statistics/trends', {
        params: { district: selectedDistrict || undefined },
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrends(res.data.trends || []);
      setDistricts(res.data.districts || []);
    } catch (err) {
      console.error('Failed to fetch statistics trends:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && trends.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-sm font-semibold text-slate-500">Aggregating historical trends...</p>
      </div>
    );
  }

  // Helper to transform nested counts (education/employment) for chart rendering
  const getNestedChartData = (field) => {
    return trends.map(t => {
      const dataPoint = { year: String(t.year) };
      const categories = t[field] || {};
      Object.keys(categories).forEach(cat => {
        dataPoint[cat] = categories[cat];
      });
      return dataPoint;
    });
  };

  // Get unique categories for keys in stacked bar charts
  const getUniqueKeys = (field) => {
    const keys = new Set();
    trends.forEach(t => {
      Object.keys(t[field] || {}).forEach(k => keys.add(k));
    });
    return Array.from(keys);
  };

  const eduKeys = getUniqueKeys('education');
  const empKeys = getUniqueKeys('employment');

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header and District Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span>Historical Demographics & Trends</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Year-by-year statistical insight into education, employment, income, and working parameters of surveyed households.
          </p>
        </div>
        <div className="w-full md:w-64 flex items-center space-x-2">
          <label className="text-sm font-semibold text-slate-500 whitespace-nowrap">Filter District:</label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700"
          >
            <option value="">Full State</option>
            {districts.map((d, index) => (
              <option key={index} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {trends.length === 0 ? (
        <div className="p-8 text-center py-16 bg-white rounded-xl border border-slate-200/60 shadow-xs">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No survey statistics available</h3>
          <p className="text-slate-500 text-sm mt-1">
            {selectedDistrict 
              ? `There are no survey records uploaded for district "${selectedDistrict}".`
              : "Please make sure some survey records are uploaded in the system first."}
          </p>
        </div>
      ) : (
        <>
          {/* Tabs / Metric Selectors */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-px">
            <button
              onClick={() => setActiveTab('income')}
              className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all ${
                activeTab === 'income' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Monthly Income</span>
            </button>
            <button
              onClick={() => setActiveTab('education')}
              className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all ${
                activeTab === 'education' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Education Levels</span>
            </button>
            <button
              onClick={() => setActiveTab('employment')}
              className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all ${
                activeTab === 'employment' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Employment Status</span>
            </button>
            <button
              onClick={() => setActiveTab('hours')}
              className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all ${
                activeTab === 'hours' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Hours Worked</span>
            </button>
            <button
              onClick={() => setActiveTab('household')}
              className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all ${
                activeTab === 'household' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Household Size</span>
            </button>
          </div>

          {/* Main Chart Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-xs">
            {activeTab === 'income' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Average Monthly Income Trend</h3>
                  <p className="text-slate-500 text-sm mt-0.5">Average estimated household monthly earnings (in ₹) recorded over time.</p>
                </div>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v.toLocaleString()}`} />
                      <Tooltip formatter={(v) => [`₹${parseFloat(v).toLocaleString()}`, 'Avg Income']} labelStyle={{ fontWeight: 'bold' }} />
                      <Legend />
                      <Line type="monotone" dataKey="averageIncome" name="Average Income (₹)" stroke="#2563eb" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'education' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Education Levels Distribution</h3>
                  <p className="text-slate-500 text-sm mt-0.5">Proportion of survey respondents holding different literacy levels year-by-year.</p>
                </div>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getNestedChartData('education')} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <Tooltip labelStyle={{ fontWeight: 'bold' }} />
                      <Legend />
                      {eduKeys.map((key, index) => (
                        <Bar key={key} dataKey={key} stackId="a" fill={COLORS[index % COLORS.length]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'employment' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Employment Status Composition</h3>
                  <p className="text-slate-500 text-sm mt-0.5">Yearly division of labor status among surveyed individuals.</p>
                </div>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getNestedChartData('employment')} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <Tooltip labelStyle={{ fontWeight: 'bold' }} />
                      <Legend />
                      {empKeys.map((key, index) => (
                        <Bar key={key} dataKey={key} stackId="a" fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'hours' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Weekly Working Hours Trend</h3>
                  <p className="text-slate-500 text-sm mt-0.5">Average self-reported weekly hours worked by active laborers.</p>
                </div>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <Tooltip formatter={(v) => [`${v} hrs/week`, 'Avg Hours']} labelStyle={{ fontWeight: 'bold' }} />
                      <Legend />
                      <Line type="monotone" dataKey="averageHoursWorked" name="Average Hours Worked" stroke="#f59e0b" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'household' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Average Household Size</h3>
                  <p className="text-slate-500 text-sm mt-0.5">Average count of co-habitant family members recorded per survey sheet.</p>
                </div>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <Tooltip formatter={(v) => [`${v} members`, 'Avg Size']} labelStyle={{ fontWeight: 'bold' }} />
                      <Legend />
                      <Line type="monotone" dataKey="averageHouseholdSize" name="Average Size" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Grid of Yearly Summary Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trends.map(t => (
              <div key={t.year} className="bg-white rounded-xl border border-slate-200/60 p-5 space-y-4 shadow-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-lg font-bold text-slate-900">Year {t.year}</h4>
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    {t.totalRecords} Records
                  </span>
                </div>
                <div className="space-y-2 text-sm font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Avg Monthly Income:</span>
                    <span className="text-slate-800 font-semibold">₹{t.averageIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Avg Hours Worked:</span>
                    <span className="text-slate-800 font-semibold">{t.averageHoursWorked} hrs/wk</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Avg Household Size:</span>
                    <span className="text-slate-800 font-semibold">{t.averageHouseholdSize} members</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Statistics;

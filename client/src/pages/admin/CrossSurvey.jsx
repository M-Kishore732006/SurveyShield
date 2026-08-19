import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { ShieldAlert, AlertTriangle, CheckCircle, Database } from 'lucide-react';

const CrossSurvey = () => {
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);

  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [resRes, sumRes] = await Promise.all([
        axios.get('http://localhost:5000/api/cross-survey/results', config),
        axios.get('http://localhost:5000/api/cross-survey/summary', config)
      ]);
      
      setResults(resRes.data.results || []);
      setSummary(sumRes.data || null);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/cross-survey/analyze', {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchData();
    } catch (error) {
      console.error("Error analyzing data:", error);
      alert('Analysis failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading && !analyzing) return <div className="p-8">Loading cross-survey intelligence...</div>;

  const chartData = (results || []).map(r => ({
    name: r.indicator,
    Current: r.currentValue,
    Historical: r.historicalValue,
    Related: r.relatedValue
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Cross-Survey Consistency Intelligence</h1>
          <p className="text-slate-600">Detect anomalies by comparing current data with historical and related surveys.</p>
        </div>
        <button 
          onClick={runAnalysis}
          disabled={analyzing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm disabled:opacity-50 flex items-center space-x-2"
        >
          {analyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Database className="w-4 h-4" />
              <span>Run Analysis</span>
            </>
          )}
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-sm font-medium">Total Analyzed</h3>
            <p className="text-3xl font-bold text-slate-900 mt-2">{summary.totalIndicators}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-sm font-medium">Consistent</h3>
            <p className="text-3xl font-bold text-green-600 mt-2 flex items-center"><CheckCircle className="w-6 h-6 mr-2"/> {summary.consistent}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-sm font-medium">Warnings</h3>
            <p className="text-3xl font-bold text-orange-500 mt-2 flex items-center"><AlertTriangle className="w-6 h-6 mr-2"/> {summary.warnings}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
            <h3 className="text-slate-500 text-sm font-medium">High Inconsistencies</h3>
            <p className="text-3xl font-bold text-red-600 mt-2 flex items-center"><ShieldAlert className="w-6 h-6 mr-2"/> {summary.highInconsistencies}</p>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-lg font-semibold mb-6">Comparison Chart</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0"/>
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{fill: '#F1F5F9'}} />
              <Legend iconType="circle" />
              <Bar dataKey="Historical" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Related" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Current" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold">Inconsistency Table</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Indicator</th>
                <th className="px-6 py-4">Geography</th>
                <th className="px-6 py-4">Current</th>
                <th className="px-6 py-4">Historical</th>
                <th className="px-6 py-4">Related</th>
                <th className="px-6 py-4">Deviation</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(results || []).map((item) => (
                <tr 
                  key={item._id} 
                  onClick={() => setSelectedResult(item)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">{item.indicator}</td>
                  <td className="px-6 py-4 text-slate-600">{item.geography}</td>
                  <td className="px-6 py-4 font-semibold">{item.currentValue}</td>
                  <td className="px-6 py-4 text-slate-500">{item.historicalValue}</td>
                  <td className="px-6 py-4 text-slate-500">{item.relatedValue}</td>
                  <td className="px-6 py-4 font-medium text-red-500">{item.deviation}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-800 py-1 px-2 rounded font-medium">{item.crossSurveyScore}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`py-1 px-2 text-xs font-semibold rounded-full ${
                      item.severity === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {item.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">Inconsistency Details</h2>
              <button onClick={() => setSelectedResult(null)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">Why was this flagged?</h4>
                  <p className="text-sm mt-1">{selectedResult.explanation}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Indicator</p>
                  <p className="font-medium text-slate-900">{selectedResult.indicator}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Geography</p>
                  <p className="font-medium text-slate-900">{selectedResult.geography}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-100">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Current Value</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedResult.currentValue}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Historical Baseline</p>
                  <p className="text-2xl font-bold text-slate-600">{selectedResult.historicalValue}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Related Survey</p>
                  <p className="text-2xl font-bold text-slate-600">{selectedResult.relatedValue}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">Cross-Survey Score</p>
                  <p className="text-xl font-bold text-slate-900">{selectedResult.crossSurveyScore}/100</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">ML Anomaly Score</p>
                  <p className="text-xl font-bold text-slate-900">{selectedResult.mlScore}/100</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CrossSurvey;

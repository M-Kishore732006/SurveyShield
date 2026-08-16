import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Search, AlertTriangle, ChevronDown, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

const FlaggedRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/validation/flagged', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to fetch records', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/admin/validation/${selectedRecord._id}/review`, {
        action,
        comment: reviewComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedRecord(null);
      setReviewComment('');
      fetchRecords(); // Refresh list
    } catch (err) {
      console.error('Failed to review record', err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex h-[calc(100vh-2rem)] gap-6">
      {/* Left side: List */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Flagged Records</h1>
            <p className="text-slate-500 text-sm mt-1">{records.length} records require review</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ID..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No flagged records found.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {records.map(record => (
                <li 
                  key={record._id} 
                  className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${selectedRecord?._id === record._id ? 'bg-amber-50 border-l-4 border-amber-500' : ''}`}
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-slate-900">{record.household_id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      record.riskLevel === 'High Risk' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {record.riskLevel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex justify-between">
                    <span>Enum: {record.enumerator_id?.name || 'Unknown'}</span>
                    <span>Score: {Math.round(record.combinedRiskScore)}/100</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right side: Details */}
      <div className="flex-[2] bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        {selectedRecord ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Record #{selectedRecord.household_id}</h2>
                <p className="text-slate-500 mt-1">Village: {selectedRecord.village_id?.name} | District: {selectedRecord.district}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedRecord.riskLevel === 'High Risk' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {selectedRecord.riskLevel} (Score: {Math.round(selectedRecord.combinedRiskScore)})
              </span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800">Why was this flagged?</h3>
                <p className="text-amber-700 text-sm mt-1">{selectedRecord.flagReason}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 border-b pb-2">Survey Data</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-slate-500">Age:</dt><dd className="font-medium text-slate-900">{selectedRecord.age}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Occupation:</dt><dd className="font-medium text-slate-900">{selectedRecord.occupation}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Employment:</dt><dd className="font-medium text-slate-900">{selectedRecord.employment_status}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Income:</dt><dd className="font-medium text-slate-900">₹{selectedRecord.income}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Hours Worked:</dt><dd className="font-medium text-slate-900">{selectedRecord.hours_worked}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Household Size:</dt><dd className="font-medium text-slate-900">{selectedRecord.household_size}</dd></div>
                </dl>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 border-b pb-2">ML Analytics</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-slate-500">Isolation Forest Score:</dt><dd className="font-medium text-slate-900">{Math.round(selectedRecord.isolationForestScore)} / 100</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Local Outlier Factor (LOF):</dt><dd className="font-medium text-slate-900">{Math.round(selectedRecord.lofScore)} / 100</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Rule Validation Risk:</dt><dd className="font-medium text-slate-900">{100 - selectedRecord.ruleValidationScore} / 100</dd></div>
                </dl>
                <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-100">
                  <p className="text-xs text-slate-600">
                    <strong>Explanation:</strong> This record significantly differs from learned historical patterns. 
                    The combination of income, age, and working hours appears highly unusual compared to local and global baselines.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-slate-900 mb-3">Admin Review Action</h3>
              <textarea 
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
                placeholder="Add review comments..."
                rows="3"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              ></textarea>
              <div className="flex space-x-3">
                <button 
                  onClick={() => handleReview('Approved')}
                  className="flex-1 flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve (False Alarm)</span>
                </button>
                <button 
                  onClick={() => handleReview('Confirmed Anomaly')}
                  className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Confirm Anomaly</span>
                </button>
                <button 
                  onClick={() => handleReview('Re-verification Requested')}
                  className="flex-1 flex items-center justify-center space-x-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Request Re-verification</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col text-slate-400">
            <AlertTriangle className="w-16 h-16 mb-4 opacity-50" />
            <p>Select a flagged record to view details and investigate.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlaggedRecords;

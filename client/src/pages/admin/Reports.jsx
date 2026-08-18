import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, BarChart2, CheckCircle, AlertTriangle, ShieldAlert, Users, Home, TrendingUp, Search } from 'lucide-react';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('village'); // 'village' or 'enumerator'
  const [villages, setVillages] = useState([]);
  const [enumerators, setEnumerators] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected report details
  const [selectedId, setSelectedId] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [downloadingId, setDownloadingId] = useState('');

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);
      const token = localStorage.getItem('token');
      
      const res = await axios.get('http://localhost:5000/api/admin/reports/targets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVillages(res.data.villages);
      setEnumerators(res.data.enumerators);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setReportData(null);
    setSelectedId('');
    setSelectedName('');
  };

  const handleViewReport = async (id, name) => {
    try {
      setLoadingReport(true);
      setSelectedId(id);
      setSelectedName(name);
      
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/reports/data', {
        params: { filterType: activeTab, filterId: id },
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(res.data);
      
      // Smooth scroll to the preview section
      setTimeout(() => {
        document.getElementById('report-preview-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Failed to generate report.');
    } finally {
      setLoadingReport(false);
    }
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadDirect = async (id, name) => {
    try {
      setDownloadingId(id);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/reports/data', {
        params: { filterType: activeTab, filterId: id },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { records } = res.data;
      if (records.length === 0) {
        alert('No survey records found for this target.');
        return;
      }

      const headers = [
        'Household ID',
        'Survey ID',
        'Survey Date',
        'Age',
        'Gender',
        'Education',
        'Occupation',
        'Employment Status',
        'Income',
        'Hours Worked',
        'Household Size',
        'Interview Duration',
        'Validation Status',
        'Risk Level',
        'Rule Messages',
        'ML Anomaly Reasons'
      ];

      const rows = records.map(r => {
        const rules = r.ruleMessages ? r.ruleMessages.join('; ').replace(/"/g, '""') : '';
        const anomalies = r.anomalyReasons ? r.anomalyReasons.join('; ').replace(/"/g, '""') : '';
        
        return [
          r.household_id,
          r.survey_id,
          r.survey_date,
          r.age,
          r.gender,
          r.education,
          r.occupation,
          r.employment_status,
          r.income,
          r.hours_worked,
          r.household_size,
          r.interview_duration,
          r.validationStatus,
          r.riskLevel,
          `"${rules}"`,
          `"${anomalies}"`
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const cleanName = name.replace(/\s+/g, '_').toLowerCase();
      downloadCSV(csvContent, `${activeTab}_raw_records_${cleanName}.csv`);
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to download report.');
    } finally {
      setDownloadingId('');
    }
  };

  const handleDownloadSummary = () => {
    if (!reportData) return;
    const { summary } = reportData;

    const csvContent = [
      ['Metric', 'Value'],
      ['Report Target Type', activeTab.toUpperCase()],
      ['Target Name', selectedName || 'N/A'],
      ['Generated At', new Date().toLocaleString()],
      [],
      ['Total Records Analyzed', summary.totalRecords],
      ['Validated (Normal)', summary.normalCount],
      ['Low Risk Flagged', summary.lowRiskCount],
      ['Medium Risk Flagged', summary.mediumRiskCount],
      ['High Risk Flagged', summary.highRiskCount],
      ['Average Respondent Age', `${summary.averageAge} years`],
      ['Average Monthly Household Income', `INR ${summary.averageIncome}`],
      ['Average Weekly Hours Worked', `${summary.averageHoursWorked} hours`],
    ].map(row => row.join(',')).join('\n');

    const cleanName = selectedName.replace(/\s+/g, '_').toLowerCase();
    downloadCSV(csvContent, `${activeTab}_summary_${cleanName}.csv`);
  };

  const filteredVillages = villages.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.villageId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEnumerators = enumerators.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Survey Data Reports</h1>
        <p className="text-slate-500 text-sm mt-1">
          Generate, visualize, and download data audits. Select a village or enumerator to view their metrics.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex justify-between items-center gap-4 flex-col sm:flex-row bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex bg-slate-100 p-1.5 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => handleTabChange('village')}
            className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'village'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Village Reports</span>
          </button>
          <button
            onClick={() => handleTabChange('enumerator')}
            className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'enumerator'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Enumerator Reports</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'village' ? "Search by village name, ID, or district..." : "Search by name or email..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Tables Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loadingOptions ? (
          <div className="px-6 py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium">Loading target list...</span>
          </div>
        ) : activeTab === 'village' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Village ID</th>
                  <th className="px-6 py-4">Village Name</th>
                  <th className="px-6 py-4">District</th>
                  <th className="px-6 py-4">State</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVillages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">
                      No villages found.
                    </td>
                  </tr>
                ) : (
                  filteredVillages.map(v => (
                    <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{v.villageId}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">{v.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{v.district}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{v.state}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => handleViewReport(v._id, v.name)}
                            className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                            <span>View Report</span>
                          </button>
                          <button
                            disabled={downloadingId === v._id}
                            onClick={() => handleDownloadDirect(v._id, v.name)}
                            className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors disabled:opacity-50"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{downloadingId === v._id ? 'Downloading...' : 'Download CSV'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Assigned Village</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnumerators.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">
                      No enumerators found.
                    </td>
                  </tr>
                ) : (
                  filteredEnumerators.map(e => (
                    <tr key={e._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">{e.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{e.email}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                        {e.villageId?.name ? `${e.villageId.name} (${e.villageId.district})` : 'Not Assigned'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => handleViewReport(e._id, e.name)}
                            className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                            <span>View Report</span>
                          </button>
                          <button
                            disabled={downloadingId === e._id}
                            onClick={() => handleDownloadDirect(e._id, e.name)}
                            className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors disabled:opacity-50"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{downloadingId === e._id ? 'Downloading...' : 'Download CSV'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generated Report Output Section */}
      <div id="report-preview-section">
        {loadingReport ? (
          <div className="bg-white p-16 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <span className="text-sm font-semibold text-slate-500">Loading audit data for {selectedName}...</span>
          </div>
        ) : reportData ? (
          <div className="space-y-6 bg-slate-50 border border-slate-150 p-6 rounded-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center">
                  <BarChart2 className="w-5 h-5 mr-2 text-blue-500" />
                  <span>Report Preview: {selectedName}</span>
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Showing statistics for the selected {activeTab}.
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Surveys</p>
                    <h3 className="text-2xl font-bold text-slate-900">{reportData.summary.totalRecords}</h3>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clean / Valid</p>
                    <h3 className="text-2xl font-bold text-emerald-600">{reportData.summary.normalCount}</h3>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Warnings</p>
                    <h3 className="text-2xl font-bold text-amber-600">{reportData.summary.mediumRiskCount}</h3>
                  </div>
                  <div className="bg-amber-50 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Critical Anomalies</p>
                    <h3 className="text-2xl font-bold text-red-600">{reportData.summary.highRiskCount}</h3>
                  </div>
                  <div className="bg-red-50 p-2 rounded-lg">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Average Stats Card & Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-indigo-500" />
                  <span>Demographics Averages</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-sm text-slate-500">Average Age</span>
                    <span className="text-sm font-bold text-slate-800">{reportData.summary.averageAge} years</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-sm text-slate-500">Average Income</span>
                    <span className="text-sm font-bold text-slate-800">INR {reportData.summary.averageIncome}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-500">Average Working Hours</span>
                    <span className="text-sm font-bold text-slate-800">{reportData.summary.averageHoursWorked} hrs / week</span>
                  </div>
                </div>
              </div>

              {/* Download Options */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-xl text-white flex flex-col justify-between shadow-xl">
                <div>
                  <h3 className="text-base font-bold mb-1.5 flex items-center">
                    <Download className="w-4.5 h-4.5 mr-2 text-indigo-400" />
                    <span>Export Validation Reports</span>
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Download the generated data audits. You can download either the summary statistics or the entire raw list of survey records matching your selected query.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={handleDownloadSummary}
                    className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Summary CSV</span>
                  </button>
                  <button
                    onClick={() => handleDownloadDirect(selectedId, selectedName)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/10"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Raw Data CSV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Reports;

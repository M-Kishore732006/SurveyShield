import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import Enumerators from './pages/admin/Enumerators';
import Villages from './pages/admin/Villages';
import FlaggedRecords from './pages/admin/FlaggedRecords';
import Surveys from './pages/admin/Surveys';
import Reports from './pages/admin/Reports';
import Statistics from './pages/admin/Statistics';
import CrossSurvey from './pages/admin/CrossSurvey';
import EnumeratorDashboard from './pages/enumerator/Dashboard';
import UploadDetails from './pages/enumerator/UploadDetails';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              } 
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="enumerators" element={<Enumerators />} />
              <Route path="villages" element={<Villages />} />
              <Route path="flagged" element={<FlaggedRecords />} />
              <Route path="surveys" element={<Surveys />} />
              <Route path="uploads/:id" element={<UploadDetails />} />
              <Route path="reports" element={<Reports />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="cross-survey" element={<CrossSurvey />} />
              {/* Add more admin routes here */}
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>

            {/* Enumerator Routes */}
            <Route 
              path="/enumerator/*" 
              element={
                <ProtectedRoute roles={['enumerator']}>
                  <Routes>
                    <Route path="dashboard" element={<EnumeratorDashboard />} />
                    <Route path="uploads/:id" element={<UploadDetails />} />
                    {/* Add more enumerator routes here */}
                    <Route path="*" element={<Navigate to="/enumerator/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              } 
            />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

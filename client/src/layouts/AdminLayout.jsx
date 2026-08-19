import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Map, FileText, AlertTriangle, FileBarChart, LogOut, ShieldCheck, TrendingUp } from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg mb-1 transition-all duration-150 ${
      active 
        ? 'bg-blue-50/70 text-blue-700 font-semibold shadow-xs' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 font-medium'
    }`}
  >
    <Icon className={`w-4.5 h-4.5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
    <span className="text-sm">{label}</span>
  </Link>
);

const AdminLayout = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-blue-700 flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6" />
            <span>SurveyShield</span>
          </h2>
        </div>
        
        <div className="flex-1 px-4 overflow-y-auto">
          <SidebarItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/admin/dashboard'} />
          <SidebarItem to="/admin/enumerators" icon={Users} label="Enumerators" active={location.pathname === '/admin/enumerators'} />
          <SidebarItem to="/admin/villages" icon={Map} label="Villages" active={location.pathname === '/admin/villages'} />
          <SidebarItem to="/admin/surveys" icon={FileText} label="Survey Data" active={location.pathname === '/admin/surveys'} />
          <SidebarItem to="/admin/flagged" icon={AlertTriangle} label="Flagged Records" active={location.pathname === '/admin/flagged'} />
          <SidebarItem to="/admin/reports" icon={FileBarChart} label="Reports" active={location.pathname === '/admin/reports'} />
          <SidebarItem to="/admin/statistics" icon={TrendingUp} label="Statistics" active={location.pathname === '/admin/statistics'} />
          <SidebarItem to="/admin/cross-survey" icon={TrendingUp} label="Cross-Survey Intel" active={location.pathname === '/admin/cross-survey'} />
        </div>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center space-x-3 mb-4 px-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">Admin</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;

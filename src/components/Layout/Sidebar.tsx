import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Settings, 
  CreditCard,
  BarChart,
  UserCheck,
  Activity,
  TrendingUp,
  CalendarDays,
  CheckSquare,
  FileText,
  ClipboardList,
  FileSignature,
  HardHat,
  FolderKanban,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { UserRole } from '../../../types';

export const Sidebar = () => {
  const { user } = useAuth();
  
  if (!user) return null;

  const getLinksForRole = () => {
    switch (user.role) {
      case UserRole.MASTER_ADMIN:
        return [
          { to: '/master-dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
          { to: '/leads', icon: <Briefcase className="w-5 h-5" />, label: 'All Leads' },
          { to: '/sales-team', icon: <Users className="w-5 h-5" />, label: 'Sales Team' },
          { to: '/customers', icon: <Briefcase className="w-5 h-5" />, label: 'Operations' },
          { to: '/plans', icon: <CreditCard className="w-5 h-5" />, label: 'Plans' },
          { to: '/analytics', icon: <BarChart className="w-5 h-5" />, label: 'Analytics' },
          { to: '/user-approvals', icon: <UserCheck className="w-5 h-5" />, label: 'User Approvals' },
          { to: '/settings', icon: <Settings className="w-5 h-5" />, label: 'System Settings' },
        ];
      case UserRole.SALES_ADMIN:
        return [
          { to: '/sales-admin-dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
          { to: '/team-leads', icon: <Briefcase className="w-5 h-5" />, label: 'Team Leads' },
          { to: '/sales-team', icon: <Users className="w-5 h-5" />, label: 'Sales Team' },
          { to: '/activities', icon: <Activity className="w-5 h-5" />, label: 'Activities' },
          { to: '/performance', icon: <TrendingUp className="w-5 h-5" />, label: 'Performance' },
          { to: '/plans', icon: <CreditCard className="w-5 h-5" />, label: 'Plans' },
        ];
      case UserRole.SALES_USER:
        return [
          { to: '/sales-dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
          { to: '/my-leads', icon: <Briefcase className="w-5 h-5" />, label: 'My Leads' },
          { to: '/follow-ups', icon: <CalendarDays className="w-5 h-5" />, label: 'Follow Ups' },
          { to: '/tasks', icon: <CheckSquare className="w-5 h-5" />, label: 'Tasks' },
          { to: '/activities', icon: <Activity className="w-5 h-5" />, label: 'Activities' },
          { to: '/notes', icon: <FileText className="w-5 h-5" />, label: 'Notes' },
        ];
      case UserRole.OPS_USER:
        return [
          { to: '/ops-dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
          { to: '/ops/site-visits', icon: <ClipboardList className="w-5 h-5" />, label: 'Site Visits' },
          { to: '/ops/proposals', icon: <FileSignature className="w-5 h-5" />, label: 'Proposals' },
          { to: '/ops/installations', icon: <HardHat className="w-5 h-5" />, label: 'Installations' },
          { to: '/ops/projects', icon: <FolderKanban className="w-5 h-5" />, label: 'Projects' },
          { to: '/ops/completed-projects', icon: <BadgeCheck className="w-5 h-5" />, label: 'Completed Projects' },
        ];
      default:
        return [];
    }
  };

  const links = getLinksForRole();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full sticky left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 mr-3">
          S
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">Synckraft</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-indigo-500/10 text-indigo-400' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-xs font-semibold text-slate-300 mb-1">Synckraft Pro</p>
          <p className="text-[10px] text-slate-500 mb-3">Your workspace is on the Pro plan.</p>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

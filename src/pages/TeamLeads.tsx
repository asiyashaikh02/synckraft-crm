import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Lead, LeadStatus, UserRole } from '../../types';
import { updateLeadAssignment } from '../../services/leadService';
import { Search, Filter, MapPin, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export const TeamLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesUsers, setSalesUsers] = useState<any[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [aiCategoryFilter, setAiCategoryFilter] = useState<'ALL' | 'HOT' | 'WARM' | 'COLD'>('ALL');
  const [sortByScore, setSortByScore] = useState<'NONE' | 'DESC' | 'ASC'>('DESC');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Fetch Leads
    const fetchLeads = onSnapshot(collection(db, 'leads'), (snapshot) => {
      const data: Lead[] = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() } as Lead));
      // Sort by descending created date broadly
      data.sort((a,b) => b.createdAt - a.createdAt);
      setLeads(data);
    });

    // Fetch Sales Users for dropdown
    const fetchSalesUsers = onSnapshot(collection(db, 'sales_users'), (snapshot) => {
      const users: any[] = [];
      snapshot.forEach(doc => {
        const u = { id: doc.id, ...doc.data() } as any;
        if (u.role === UserRole.SALES_USER) {
          users.push(u);
        }
      });
      setSalesUsers(users);
    });

    return () => {
      fetchLeads();
      fetchSalesUsers();
    };
  }, []);

  // Compute unique cities
  const uniqueCities = Array.from(new Set(leads.map(l => l.city).filter(Boolean))) as string[];

  // Filter Logic
  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = lead.companyName.toLowerCase().includes(searchLower) || 
                        lead.contactPerson.toLowerCase().includes(searchLower) ||
                        lead.phone.toLowerCase().includes(searchLower);
    const matchStatus = statusFilter === 'ALL' || lead.status === statusFilter;
    const matchCity = cityFilter === 'ALL' || lead.city === cityFilter;
    const matchAi = aiCategoryFilter === 'ALL' || lead.aiCategory === aiCategoryFilter;
    return matchSearch && matchStatus && matchCity && matchAi;
  });

  // Pagination Logic
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (sortByScore === 'NONE') return 0;
    const aScore = a.aiScore ?? 0;
    const bScore = b.aiScore ?? 0;
    return sortByScore === 'DESC' ? bScore - aScore : aScore - bScore;
  });

  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);
  const paginatedLeads = sortedLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAssignmentChange = async (leadId: string, newSalesUserId: string) => {
    if (!newSalesUserId) return;
    try {
      await updateLeadAssignment(leadId, newSalesUserId);
      // In a real app we might toast a success message here
    } catch (err) {
      console.error("Failed to assign lead", err);
    }
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW: return 'bg-indigo-100 text-indigo-700';
      case LeadStatus.NEGOTIATION: return 'bg-amber-100 text-amber-700';
      case LeadStatus.APPROVED: return 'bg-emerald-100 text-emerald-700';
      case LeadStatus.REJECTED: return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Team Leads</h1>
          <p className="text-slate-500 mt-1">Manage and assign leads across the sales team.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search name, company or phone..." 
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm appearance-none bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[140px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              {Object.values(LeadStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm appearance-none bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[140px]"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="ALL">All Cities</option>
              {uniqueCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm appearance-none bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[140px]"
              value={aiCategoryFilter}
              onChange={(e) => {
                setAiCategoryFilter(e.target.value as any);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Priorities</option>
              <option value="HOT">HOT</option>
              <option value="WARM">WARM</option>
              <option value="COLD">COLD</option>
            </select>
          </div>

          <div className="relative">
            <select
              className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm appearance-none bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[140px]"
              value={sortByScore}
              onChange={(e) => {
                setSortByScore(e.target.value as any);
                setCurrentPage(1);
              }}
            >
              <option value="DESC">Score: High → Low</option>
              <option value="ASC">Score: Low → High</option>
              <option value="NONE">Score: None</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white border text-left border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Lead Name</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">AI Score</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                    <p>No leads found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{lead.companyName}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{lead.contactPerson}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">{lead.phone}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{lead.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center text-slate-600 bg-slate-100 px-2 py-1 rounded-md text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {lead.city || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          (lead.aiScore || 0) >= 80 ? 'bg-emerald-100 text-emerald-700' : 
                          (lead.aiScore || 0) >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {lead.aiScore || 0}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
                        value={lead.salesUserId || ''}
                        onChange={(e) => handleAssignmentChange(lead.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {salesUsers.map(user => (
                          <option key={user.id} value={user.id}>{user.displayName || user.email}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredLeads.length)}</span> of <span className="font-medium">{filteredLeads.length}</span> results
            </span>
            <div className="flex space-x-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

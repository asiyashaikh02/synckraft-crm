import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Lead, LeadStatus } from '../../types';
import { Search, Filter, MapPin, AlertCircle, ChevronLeft, ChevronRight, Eye, Flame } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const MyLeads = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters and Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [aiCategoryFilter, setAiCategoryFilter] = useState<'ALL' | 'HOT' | 'WARM' | 'COLD'>('ALL');
  const [sortByScore, setSortByScore] = useState<'NONE' | 'DESC' | 'ASC'>('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!user) return;

    // Fetch leads assigned to this user
    const q = query(
      collection(db, 'leads'),
      where('salesUserId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLeads: Lead[] = [];
      snapshot.forEach(doc => {
        fetchedLeads.push({ id: doc.id, ...doc.data() } as Lead);
      });
      console.log('Fetched My Leads:', fetchedLeads);
      // Sort in memory (workaround for composite index requirement if missing)
      fetchedLeads.sort((a,b) => b.createdAt - a.createdAt);
      
      setLeads(fetchedLeads);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Derived filtered leads
  const filteredLeads = leads.filter(lead => {
    const searchMatch = 
      lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
      
    const statusMatch = statusFilter === 'ALL' || lead.status === statusFilter;
    const categoryMatch = aiCategoryFilter === 'ALL' || lead.aiCategory === aiCategoryFilter;
    
    return searchMatch && statusMatch && categoryMatch;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (sortByScore === 'NONE') return 0;
    const aScore = a.aiScore ?? 0;
    const bScore = b.aiScore ?? 0;
    return sortByScore === 'DESC' ? bScore - aScore : aScore - bScore;
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);
  const paginatedLeads = sortedLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW: return 'bg-blue-100 text-blue-800 border-blue-200';
      case LeadStatus.CONTACTED: return 'bg-purple-100 text-purple-800 border-purple-200';
      case LeadStatus.NEGOTIATION: return 'bg-orange-100 text-orange-800 border-orange-200';
      case LeadStatus.CONTRACTED: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case LeadStatus.APPROVED: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case LeadStatus.CONVERTED: return 'bg-green-100 text-green-800 border-green-200';
      case LeadStatus.REJECTED: return 'bg-red-100 text-red-800 border-red-200';
      case LeadStatus.LOST: return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getAiPill = (lead: Lead) => {
    const score = lead.aiScore ?? 0;
    const category = lead.aiCategory;
    if (!category) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-500">
          <Flame className="w-3 h-3 mr-1" />
          Not scored
        </span>
      );
    }
    const base = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold';
    if (category === 'HOT') {
      return (
        <span className={`${base} bg-rose-100 text-rose-700`}>
          <Flame className="w-3 h-3 mr-1" />
          HOT · {score}
        </span>
      );
    }
    if (category === 'WARM') {
      return (
        <span className={`${base} bg-amber-100 text-amber-700`}>
          WARM · {score}
        </span>
      );
    }
    return (
      <span className={`${base} bg-sky-100 text-sky-700`}>
        COLD · {score}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Leads</h1>
          <p className="text-slate-500 mt-2">Manage and track the leads assigned to you.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company, name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-3">
             <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                }}
                className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                {Object.values(LeadStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={aiCategoryFilter}
                onChange={(e) => {
                  setAiCategoryFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium text-slate-700"
              >
                <option value="ALL">All Priorities</option>
                <option value="HOT">HOT</option>
                <option value="WARM">WARM</option>
                <option value="COLD">COLD</option>
              </select>
            </div>

            <div className="relative">
              <select
                value={sortByScore}
                onChange={(e) => {
                  setSortByScore(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium text-slate-700"
              >
                <option value="DESC">Score: High → Low</option>
                <option value="ASC">Score: Low → High</option>
                <option value="NONE">Score: None</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4">Lead Info</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">AI Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center space-x-2">
                       <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                       <span>Loading your leads...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <AlertCircle className="w-8 h-8 mb-3 text-slate-400" />
                      <p className="text-base font-medium text-slate-900">No leads found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{lead.companyName}</div>
                      <div className="text-sm text-slate-500 flex items-center mt-0.5">
                        <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 mr-2">
                          #{lead.clientCode || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 font-medium">{lead.contactPerson}</div>
                      <div className="text-sm text-slate-500">{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-slate-600">
                        <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />
                        {lead.city || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getAiPill(lead)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button 
                         onClick={() => navigate(`/leads/${lead.id}`)}
                         className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center"
                         title="View Lead Details"
                       >
                         <Eye className="w-5 h-5" />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredLeads.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium text-slate-900">
                {Math.min(currentPage * itemsPerPage, filteredLeads.length)}
              </span>{' '}
              of <span className="font-medium text-slate-900">{filteredLeads.length}</span> leads
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

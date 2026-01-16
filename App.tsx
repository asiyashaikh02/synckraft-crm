
import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { UserRole, UserStatus, CustomerStatus, LeadStatus, ExecutionStage } from './types';
import { Icons } from './constants';
import { registerUser, loginUser, logoutUser } from './lib/auth';
import { createLead, updateLeadStatus, deleteLead } from './services/leadService';
import { convertLeadToCustomer, activateCustomer, updateOpsMetrics } from './services/customerService';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { getSalesAdvice } from './services/geminiService';

const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

export default function App() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'login' | 'register' | 'dashboard'>('login');
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [aiTip, setAiTip] = useState<string | null>(null);

  // Sync Data
  useEffect(() => {
    if (!user || user.status !== UserStatus.APPROVED) return;
    
    const unsubLeads = onSnapshot(collection(db, "leads"), (s) => setLeads(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubCust = onSnapshot(collection(db, "customers"), (s) => setCustomers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    
    let unsubUsers = () => {};
    if (user.role === UserRole.MASTER_ADMIN) {
      unsubUsers = onSnapshot(collection(db, "users"), (s) => setAllUsers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }

    return () => { unsubLeads(); unsubCust(); unsubUsers(); };
  }, [user]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Initializing Synckraft...</div>;

  // Unapproved Guard
  if (user && user.status === UserStatus.PENDING) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 p-8 text-center">
        <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
           <Icons.Users />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Account Pending Approval</h1>
        <p className="text-slate-400 max-w-md mb-8">Hello {user.displayName}, a Master Admin needs to verify your role before you can access the CRM tools.</p>
        <button onClick={logoutUser} className="text-indigo-400 font-bold hover:underline">Sign Out</button>
      </div>
    );
  }

  // --- PAGES ---

  const LoginView = () => {
    const [form, setForm] = useState({email: '', pass: ''});
    const handle = async (e: any) => {
      e.preventDefault();
      try { await loginUser(form.email, form.pass); } catch (e: any) { alert(e.message); }
    };
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={handle} className="bg-slate-900 p-10 rounded-3xl border border-slate-800 w-full max-w-md shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-8 text-center uppercase tracking-widest">Synckraft Login</h2>
          <input type="email" placeholder="Email" className="w-full bg-slate-800 border-none rounded-xl p-4 mb-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input type="password" placeholder="Password" className="w-full bg-slate-800 border-none rounded-xl p-4 mb-8 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all" value={form.pass} onChange={e => setForm({...form, pass: e.target.value})} required />
          <button className="w-full bg-indigo-600 p-4 rounded-xl font-bold text-white uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">Sign In</button>
          <p className="mt-6 text-center text-slate-500 text-sm">No account? <button type="button" onClick={() => setView('register')} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Register</button></p>
        </form>
      </div>
    );
  };

  const RegisterView = () => {
    const [form, setForm] = useState({name: '', email: '', pass: '', role: UserRole.SALES});
    const handle = async (e: any) => {
      e.preventDefault();
      try { await registerUser(form.email, form.pass, form.name, form.role); } catch (e: any) { alert(e.message); }
    };
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={handle} className="bg-slate-900 p-10 rounded-3xl border border-slate-800 w-full max-w-md shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-8 text-center uppercase tracking-widest">Join Synckraft</h2>
          <input type="text" placeholder="Full Name" className="w-full bg-slate-800 border-none rounded-xl p-4 mb-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <input type="email" placeholder="Email" className="w-full bg-slate-800 border-none rounded-xl p-4 mb-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input type="password" placeholder="Password" className="w-full bg-slate-800 border-none rounded-xl p-4 mb-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all" value={form.pass} onChange={e => setForm({...form, pass: e.target.value})} required />
          <select className="w-full bg-slate-800 border-none rounded-xl p-4 mb-8 text-white focus:ring-2 focus:ring-indigo-500 transition-all" value={form.role} onChange={e => setForm({...form, role: e.target.value as UserRole})}>
            <option value={UserRole.SALES}>Sales Team</option>
            <option value={UserRole.OPERATIONS}>Operations Team</option>
          </select>
          <button className="w-full bg-indigo-600 p-4 rounded-xl font-bold text-white uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">Request Access</button>
          <p className="mt-6 text-center text-slate-500 text-sm">Already have account? <button type="button" onClick={() => setView('login')} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Login</button></p>
        </form>
      </div>
    );
  };

  if (!user) return view === 'login' ? <LoginView /> : <RegisterView />;

  const [activeTab, setActiveTab] = useState<'leads' | 'customers' | 'users' | 'billing'>(user.role === UserRole.SALES ? 'leads' : user.role === UserRole.OPERATIONS ? 'customers' : 'users');

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 flex flex-col p-6 shadow-2xl relative z-20">
        <div className="flex items-center space-x-3 mb-10 px-2">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg border border-white/10">S</div>
           <h1 className="text-xl font-bold text-white tracking-tight">Synckraft</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {user.role === UserRole.MASTER_ADMIN && (
            <SidebarLink icon={<Icons.Users />} label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          )}
          {user.role !== UserRole.OPERATIONS && (
            <SidebarLink icon={<Icons.Leads />} label="Sales Hub" active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} />
          )}
          <SidebarLink icon={<Icons.Operations />} label="Portfolio" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
          {user.role === UserRole.MASTER_ADMIN && (
            <SidebarLink icon={<Icons.Dashboard />} label="Financials" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
          )}
        </nav>

        <div className="mt-auto border-t border-slate-800 pt-6">
           <div className="flex items-center space-x-3 mb-6 px-2">
             <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold border-2 border-slate-700">{user.displayName.charAt(0)}</div>
             <div className="flex-1 min-w-0">
               <p className="text-white text-sm font-bold truncate">{user.displayName}</p>
               <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{user.role.replace('_', ' ')}</p>
             </div>
           </div>
           <button onClick={logoutUser} className="w-full p-3 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-700 hover:text-white transition-all uppercase tracking-widest border border-slate-700/50">Sign Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-10">
        <header className="flex items-center justify-between mb-10">
           <div>
             <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{activeTab}</h2>
             <p className="text-slate-500 text-sm font-medium">Manage your Synckraft {activeTab} workspace.</p>
           </div>
           {activeTab === 'leads' && user.role === UserRole.SALES && (
             <button onClick={() => {
               const name = prompt("Company Name?");
               const value = Number(prompt("Contract Value?"));
               if(name && value) createLead({ companyName: name, potentialValue: value }, user.uid);
             }} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all">
               + New Lead
             </button>
           )}
        </header>

        {/* AI Insight Bar */}
        <div className="mb-10 bg-white border border-indigo-100 rounded-3xl p-6 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
           <div className="flex items-center space-x-4">
             <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform"><Icons.Sparkles /></div>
             <div>
               <h4 className="font-bold text-slate-900 text-sm">Synckraft AI Assistant</h4>
               <p className="text-slate-500 text-xs italic">{aiTip || "Ready to analyze your portfolio strategy."}</p>
             </div>
           </div>
           <button onClick={async () => {
             setAiTip("Processing context...");
             const tip = await getSalesAdvice("Portfolio Analysis", 0);
             setAiTip(tip);
           }} className="text-[10px] font-black uppercase text-indigo-600 tracking-widest hover:text-indigo-800 hover:underline transition-colors">Generate Advice</button>
        </div>

        {/* Dynamic Table Views */}
        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          {activeTab === 'users' && (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-slate-400 text-[10px] uppercase font-black tracking-widest">
                  <th className="px-8 py-5">Name / Email</th>
                  <th className="px-8 py-5">Role</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 font-bold text-slate-900">{u.displayName}<br/><span className="text-slate-400 text-xs font-medium">{u.email}</span></td>
                    <td className="px-8 py-6 font-mono text-xs">{u.role}</td>
                    <td className="px-8 py-6"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{u.status}</span></td>
                    <td className="px-8 py-6 text-center">
                      {u.status === 'PENDING' && (
                        <button onClick={() => updateDoc(doc(db, "users", u.id), {status: 'APPROVED'})} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-md active:scale-95 transition-all">Approve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'leads' && (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-slate-400 text-[10px] uppercase font-black tracking-widest">
                  <th className="px-8 py-5">Company</th>
                  <th className="px-8 py-5 text-right">Value</th>
                  <th className="px-8 py-5">Stage</th>
                  <th className="px-8 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 font-bold text-slate-900">{l.companyName}</td>
                    <td className="px-8 py-6 text-right font-mono font-bold text-indigo-600">${l.potentialValue.toLocaleString()}</td>
                    <td className="px-8 py-6"><span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">{l.status}</span></td>
                    <td className="px-8 py-6 text-center space-x-6">
                      <button onClick={() => convertLeadToCustomer(l)} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:text-indigo-800 transition-colors">Convert</button>
                      <button onClick={() => deleteLead(l.id)} className="text-rose-500 font-black text-[10px] uppercase tracking-widest hover:text-rose-700 transition-colors">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'customers' && (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-slate-400 text-[10px] uppercase font-black tracking-widest">
                  <th className="px-8 py-5">Company / Reference</th>
                  <th className="px-8 py-5">Activation Status</th>
                  <th className="px-8 py-5">Execution workflow</th>
                  <th className="px-8 py-5 text-right">Financials</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map(c => {
                   const isInactive = c.status === CustomerStatus.INACTIVE;
                   const elapsedMs = Date.now() - c.createdAt;
                   const progressPercent = Math.min(100, (elapsedMs / SEVENTY_TWO_HOURS_MS) * 100);
                   const hoursAgo = elapsedMs / 3600000;
                   const isReady = hoursAgo >= 72;
                   const remainingHours = Math.max(0, 72 - hoursAgo);
                   
                   // Access filter: Ops see only Active
                   if (user.role === UserRole.OPERATIONS && c.status !== CustomerStatus.ACTIVE) return null;

                   return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6 font-bold text-slate-900">
                        {c.companyName}
                        <div className="flex items-center space-x-2 mt-1">
                           <span className="text-[10px] text-slate-400 font-medium font-mono">ID: {c.id.slice(-6).toUpperCase()}</span>
                           {c.isLocked && <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Locked</span>}
                        </div>
                      </td>
                      <td className="px-8 py-6 min-w-[200px]">
                        {isInactive ? (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                              <span>72h Warm-up</span>
                              {isReady ? (
                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Ready</span>
                              ) : (
                                <span className="text-amber-600">{Math.ceil(remainingHours)}h Left</span>
                              )}
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                               <div 
                                 className={`h-full transition-all duration-1000 ${isReady ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                                 style={{ width: `${progressPercent}%` }}
                               />
                            </div>
                            {isReady && (
                              <button 
                                onClick={() => activateCustomer(c.id)} 
                                className="w-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg shadow-md shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                              >
                                Finalize Activation
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                             <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">ACTIVE</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        {user.role === UserRole.OPERATIONS ? (
                          <div className="relative">
                            <select 
                              value={c.executionStage} 
                              onChange={e => updateOpsMetrics(c.id, e.target.value as ExecutionStage, c.internalCost)}
                              className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl text-xs font-bold uppercase p-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
                            >
                              <option value={ExecutionStage.PLANNING}>Planning</option>
                              <option value={ExecutionStage.EXECUTION}>Execution</option>
                              <option value={ExecutionStage.DELIVERED}>Delivered</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                             <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{c.executionStage}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right font-mono">
                        {user.role === UserRole.OPERATIONS ? (
                          <div className="flex items-center justify-end space-x-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Internal Cost</span>
                            <div className="relative">
                               <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                               <input type="number" className="w-24 bg-white border border-slate-200 p-2 pl-5 rounded-lg font-bold text-xs focus:ring-2 focus:ring-indigo-500" value={c.internalCost} onChange={e => updateOpsMetrics(c.id, c.executionStage, Number(e.target.value))} />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-slate-900 font-bold text-base block">${c.billingAmount.toLocaleString()}</span>
                            <div className="flex items-center justify-end space-x-1">
                               <span className="text-[9px] font-bold text-slate-400 uppercase">Margin</span>
                               <span className={`text-[10px] font-black uppercase ${c.billingAmount - c.internalCost > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                 {(((c.billingAmount - c.internalCost) / c.billingAmount) * 100).toFixed(1)}%
                               </span>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'billing' && (
             <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-slate-400 text-[10px] uppercase font-black tracking-widest">
                    <th className="px-8 py-5">Customer Entity</th>
                    <th className="px-8 py-5 text-right">Invoiced Amount</th>
                    <th className="px-8 py-5 text-right">Operational Cost</th>
                    <th className="px-8 py-5 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {customers.filter(c => c.status === CustomerStatus.ACTIVE).map(c => (
                     <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="px-8 py-6 font-bold text-slate-900">{c.companyName}</td>
                        <td className="px-8 py-6 text-right font-mono font-bold text-indigo-600">${c.billingAmount.toLocaleString()}</td>
                        <td className="px-8 py-6 text-right font-mono text-rose-500">-${c.internalCost.toLocaleString()}</td>
                        <td className="px-8 py-6 text-right font-mono font-black text-emerald-600 bg-emerald-50/30">${(c.billingAmount - c.internalCost).toLocaleString()}</td>
                     </tr>
                   ))}
                   {customers.filter(c => c.status === CustomerStatus.ACTIVE).length === 0 && <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 italic">No active billing data available for finalized accounts.</td></tr>}
                </tbody>
             </table>
          )}
        </div>
      </main>
    </div>
  );
}

// Sub-components

const SidebarLink = ({icon, label, active, onClick}: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center space-x-3 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 ring-1 ring-white/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

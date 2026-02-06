import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Search, RefreshCw, Lock, Globe, Activity, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import ThreatMap from '../components/watchdog/ThreatMap';

interface AuditLog {
  id: string;
  action: string;
  user_email: string;
  details: string;
  ip_address: string;
  created_at: string;
  country_code: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

export default function Watchdog() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    // Don't set loading to true on refresh to avoid flicker
    try {
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/system/logs?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Fast refresh for "Live" feel
    return () => clearInterval(interval);
  }, [token]);

  const getActionColor = (action: string) => {
    if (action.includes('failed') || action.includes('rejected') || action.includes('deleted')) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (action.includes('success') || action.includes('approved') || action.includes('created')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.user_email?.toLowerCase().includes(filter.toLowerCase()) ||
    log.details?.toLowerCase().includes(filter.toLowerCase())
  );

  const failedLogins = logs.filter(l => l.action === 'login_failed').length;
  
  // Calculate stats
  const topCountries = logs.reduce((acc, log) => {
    if (log.country_code) {
      acc[log.country_code] = (acc[log.country_code] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 -m-6"> {/* Full screen dark mode override */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center gap-3">
              <Shield className="w-10 h-10 text-indigo-500" />
              WATCHDOG 2.0
            </h1>
            <p className="text-slate-400 mt-2 font-mono text-sm tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              SYSTEM SECURE • LIVE MONITORING ACTIVE
            </p>
          </div>
          <button 
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            REFRESH
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-mono text-sm">ERROR: {error}</span>
          </div>
        )}

        {/* Top Section: Map & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map takes 2 columns */}
          <div className="lg:col-span-2">
            <ThreatMap logs={logs} />
          </div>

          {/* Key Metrics */}
          <div className="space-y-6">
            <GlassCard variant="dark" className="relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 bg-red-500/20 w-32 h-32 rounded-full blur-3xl group-hover:bg-red-500/30 transition-all"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Threats Blocked</p>
                  <p className="text-4xl font-black text-white mt-2">{failedLogins}</p>
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Last 100 events
                  </p>
                </div>
                <div className="p-4 bg-red-500/20 rounded-2xl border border-red-500/20">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </GlassCard>

            <GlassCard variant="dark" className="relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 bg-emerald-500/20 w-32 h-32 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Health</p>
                  <p className="text-4xl font-black text-white mt-2">100%</p>
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    All systems operational
                  </p>
                </div>
                <div className="p-4 bg-emerald-500/20 rounded-2xl border border-emerald-500/20">
                  <Zap className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
            </GlassCard>

            <GlassCard variant="dark">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Top Source Countries</p>
              <div className="space-y-3">
                {Object.entries(topCountries).slice(0, 3).map(([code, count]) => (
                  <div key={code} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-500" />
                      <span className="font-mono text-sm">{code || 'UNKNOWN'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${(count / logs.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold">{count}</span>
                    </div>
                  </div>
                ))}
                {Object.keys(topCountries).length === 0 && (
                  <p className="text-xs text-slate-500 italic">No location data available</p>
                )}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Logs Table */}
        <GlassCard variant="dark" className="overflow-hidden p-0">
          <div className="p-4 border-b border-slate-800 flex items-center gap-4 bg-slate-900/50">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search logs..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm text-slate-200 placeholder:text-slate-600"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-slate-400 font-medium uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {log.user_email || 'System'}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-300">{log.country_code || 'Unknown'}</span>
                        <span className="font-mono text-[10px]">{log.ip_address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Sprout, ShoppingCart, Store, ShieldCheck, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface Stats {
  users: number;
  farmers: number;
  buyers: number;
  suppliers: number;
  harvests: number;
  records: number;
  orders: number;
  volume: number;
  pendingVerif: number;
  disputes: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    farmers: 0,
    buyers: 0,
    suppliers: 0,
    harvests: 0,
    records: 0,
    orders: 0,
    volume: 0,
    pendingVerif: 0,
    disputes: 0,
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const { data: profiles } = await supabase.from('profiles').select('role');
        let farmers = 0, buyers = 0, suppliers = 0;
        profiles?.forEach((p) => {
          if (p.role === 'farmer') farmers++;
          if (p.role === 'buyer') buyers++;
          if (p.role === 'supplier') suppliers++;
        });

        const { count: harvests } = await supabase.from('harvests').select('*', { count: 'exact', head: true });
        const { count: records } = await supabase.from('cultivation_records').select('*', { count: 'exact', head: true });
        const { data: orders } = await supabase.from('orders').select('total_price, status');
        let volume = 0;
        orders?.forEach((o) => {
          if (o.status !== 'declined' && o.status !== 'cancelled') {
            volume += Number(o.total_price) || 0;
          }
        });

        const { count: pendingVerif } = await supabase
          .from('verification_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        const { count: disputes } = await supabase
          .from('disputes')
          .select('*', { count: 'exact', head: true })
          .in('status', ['open', 'under_investigation']);

        const { data: logs } = await supabase
          .from('admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8);

        setStats({
          users: profiles?.length || 0,
          farmers,
          buyers,
          suppliers,
          harvests: harvests || 0,
          records: records || 0,
          orders: orders?.length || 0,
          volume,
          pendingVerif: pendingVerif || 0,
          disputes: disputes || 0,
        });
        setAuditLogs(logs || []);
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const kpis = [
    { label: 'Total Registered Users', value: stats.users, icon: Users, color: '#4ade80' },
    { label: 'Verified Farmers', value: stats.farmers, icon: Sprout, color: '#22c55e' },
    { label: 'Active Buyers', value: stats.buyers, icon: ShoppingCart, color: '#60a5fa' },
    { label: 'Certified Suppliers', value: stats.suppliers, icon: Store, color: '#fbbf24' },
    { label: 'Immutable Ledger Records', value: stats.records, icon: ShieldCheck, color: '#10b981' },
    {
      label: 'Gross Marketplace Volume',
      value: `Rs. ${(stats.volume / 1000).toFixed(0)}k`,
      icon: ArrowUpRight,
      color: '#34d399',
    },
  ];

  if (loading) {
    return <div style={{ padding: 40, color: '#8da693' }}>Loading governance telemetry...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f5f1' }}>Executive Overview</h1>
        <p style={{ color: '#8da693', fontSize: 13, marginTop: 4 }}>
          Live platform health, verified participants, and cryptographic traceability audits.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              style={{
                background: '#131e15',
                border: '1px solid #1f3223',
                borderRadius: 12,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#8da693', fontWeight: 600 }}>{kpi.label}</span>
                <div style={{ background: '#1c2e21', padding: 6, borderRadius: 8 }}>
                  <Icon size={18} color={kpi.color} />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#f0f5f1', marginTop: 12 }}>{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Action Banners */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <div style={{ background: '#261f0e', border: '1px solid #453518', borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={20} color="#fbbf24" />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fde68a' }}>
              Pending Verifications: {stats.pendingVerif}
            </h3>
          </div>
          <p style={{ color: '#d1b882', fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
            Farmers and suppliers awaiting official business registration & land deed approvals.
          </p>
        </div>

        <div style={{ background: '#1a1824', border: '1px solid #322b46', borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={20} color="#a78bfa" />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ddd6fe' }}>Active Disputes: {stats.disputes}</h3>
          </div>
          <p style={{ color: '#b5a9cc', fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
            Delivery discrepancies, contract obligations, and buyer-farmer fulfillment claims.
          </p>
        </div>
      </div>

      {/* Audit Log Activity Feed */}
      <div style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f0f5f1', marginBottom: 12 }}>
          Recent Governance Activity
        </h2>
        <div style={{ background: '#131e15', border: '1px solid #1f3223', borderRadius: 12, overflow: 'hidden' }}>
          {auditLogs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#8da693' }}>No admin actions recorded yet.</div>
          ) : (
            auditLogs.map((log, i) => (
              <div
                key={log.id || i}
                style={{
                  padding: '12px 18px',
                  borderBottom: i === auditLogs.length - 1 ? 'none' : '1px solid #192a1e',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#e5ede7', fontSize: 13 }}>
                    {log.action?.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: 11, color: '#8da693', marginTop: 2 }}>
                    Entity: {log.target_entity} • Target: {log.target_id || 'System'}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#7a9a81' }}>{new Date(log.created_at).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


"use client";
// Business overview at the top of /admin: six numbers, the latest paid orders and the latest
// projects. All data comes from GET /api/admin/overview; the rules for what is counted live in
// lib/adminMetrics.ts. Orders written by the demo seed are badged so they are never mistaken
// for bank transfers.
import { useEffect, useState } from "react";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, fmt, formatNumber } from "@/lib/i18n";
import { formatVnd } from "@/lib/billing/planPrice";
import { DEMO_PROVIDER, type AdminKpis } from "@/lib/adminMetrics";

type Transaction = { orderCode: string; email: string; plan: string; amount: number; provider: string; paidAt: string | null };
type ProjectRow = { id: string; name: string; email: string; updatedAt: string };
type Overview = { kpis: AdminKpis; transactions: Transaction[]; projects: ProjectRow[] };

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—");

function Kpi({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", minWidth: 0 }}>
      <div style={{ fontSize: 12, color: C.textMuted }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: C.text }}>{value}</div>
      {note && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{note}</div>}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontSize: 12, fontWeight: 600, color: C.textMuted, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "9px 12px", fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, overflowWrap: "anywhere" };

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", minWidth: 0 }}>
      <h2 style={{ margin: 0, padding: "10px 14px", fontSize: 14, fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>{title}</h2>
      <div style={{ overflowX: "auto" }}>{children}</div>
    </section>
  );
}

export default function AdminOverview() {
  const { t, locale } = useI18n();
  const A = t.admin;
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/overview")
      .then((r) => (r.ok ? (r.json() as Promise<Overview>) : null))
      .then((json) => { if (alive) setData(json); })
      .catch(() => { if (alive) setData(null); });
    return () => { alive = false; };
  }, []);

  if (!data) return null;
  const k = data.kpis;
  const n = (v: number) => formatNumber(v, locale);

  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>{A.overviewTitle}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <Kpi label={A.kpiUsers} value={n(k.users)} note={fmt(A.kpiUsersNew, { count: k.newUsers7d })} />
        <Kpi label={A.kpiPaidUsers} value={n(k.paidUsers)} note={fmt(A.kpiPaidShare, { percent: k.paidPercent })} />
        <Kpi label={A.kpiProjects} value={n(k.projects)} />
        <Kpi label={A.kpiRevenue} value={formatVnd(k.revenue, locale)} note={k.demoOrders > 0 ? fmt(A.kpiRevenueDemo, { count: k.demoOrders }) : undefined} />
        <Kpi label={A.kpiOrders} value={n(k.paidOrders)} />
        <Kpi label={A.kpiAverage} value={formatVnd(k.averageOrder, locale)} />
      </div>
      <p style={{ margin: "8px 0 18px", fontSize: 12, color: C.textMuted }}>{A.overviewScope}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 14 }}>
        <Panel title={A.transactionsTitle}>
          {data.transactions.length === 0 ? (
            <div style={{ padding: 14, fontSize: 13, color: C.textMuted }}>{A.transactionsEmpty}</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr><th style={th}>{A.colOrder}</th><th style={th}>{A.colUser}</th><th style={th}>{A.colPlan}</th><th style={th}>{A.colAmount}</th><th style={th}>{A.colPaidAt}</th></tr>
              </thead>
              <tbody>
                {data.transactions.map((o) => (
                  <tr key={o.orderCode}>
                    <td style={{ ...td, fontFamily: "ui-monospace, Consolas, monospace", fontSize: 12, whiteSpace: "nowrap" }}>
                      {o.orderCode}
                      {o.provider === DEMO_PROVIDER && (
                        <span style={{ marginLeft: 6, padding: "1px 6px", whiteSpace: "nowrap", borderRadius: 4, fontSize: 11, fontWeight: 600, color: "#fbbf24", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>{A.demoBadge}</span>
                      )}
                    </td>
                    <td style={td}>{o.email}</td>
                    <td style={{ ...td, textTransform: "capitalize", whiteSpace: "nowrap" }}>{o.plan}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{formatVnd(o.amount, locale)}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{date(o.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title={A.projectsTitle}>
          {data.projects.length === 0 ? (
            <div style={{ padding: 14, fontSize: 13, color: C.textMuted }}>{A.projectsEmpty}</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr><th style={th}>{A.colProject}</th><th style={th}>{A.colOwner}</th><th style={th}>{A.colUpdated}</th></tr>
              </thead>
              <tbody>
                {data.projects.map((p) => (
                  <tr key={p.id}>
                    <td style={td}>{p.name}</td>
                    <td style={td}>{p.email}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{date(p.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  );
}

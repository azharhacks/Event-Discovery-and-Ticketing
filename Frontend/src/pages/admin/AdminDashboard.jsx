import { useState, useEffect } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import EventDetailModal from "../../components/event/EventDetailModal";
import {
  getAdminEvents,
  getAllUsers,
  updateEventStatus,
  getAdminTransactions,
  getOrganizerSalesReport,
  updateUserStatus,
  removeUser,
  getPaymentLedger,
  releaseEventPayout,
  refundOrder,
} from "../../lib/api";

const STATUS_STYLES = {
  APPROVED:  { bg: "transparent", color: "#0E7257", border: "transparent" },
  PENDING:   { bg: "#fff",        color: "#4F46E5", border: "#c7d2fe" },
  REJECTED:  { bg: "transparent", color: "#b91c1c", border: "transparent" },
  CANCELLED: { bg: "transparent", color: "#4A5950", border: "transparent" },
};

const ROLE_STYLES = {
  ADMIN:     { bg: "transparent", color: "#dc2626", border: "transparent" },
  ORGANIZER: { bg: "transparent", color: "#9C6B1F", border: "transparent" },
  ATTENDEE:  { bg: "transparent", color: "#128C6B", border: "transparent" },
};

const USER_STATUS_STYLES = {
  ACTIVE:    { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
  SUSPENDED: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  BANNED:    { bg: "#fef2f2", color: "#b91c1c", border: "#fca5a5" },
};

const ESCROW_STYLES = {
  HELD:     { bg: "#fffbeb", color: "#b45309" },
  RELEASED: { bg: "#ecfdf5", color: "#047857" },
  REFUNDED: { bg: "#f1f5f9", color: "#64748b" },
};

const StatCard = ({ label, value, color }) => (
  <div style={{ background: "#fff", border: "1px solid #E3DFD2", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)" }}>
    <span style={{ fontSize: 13, color: "#66766C", fontWeight: 500, display: "block", marginBottom: 4 }}>{label}</span>
    <span style={{ fontSize: 24, fontWeight: 800, color: color || "#0B3D2E" }}>{value}</span>
  </div>
);

const btnSm = (bg, color) => ({
  padding: "4px 10px", borderRadius: 6, border: "none", background: bg, color,
  cursor: "pointer", fontWeight: 600, fontSize: 11, fontFamily: "inherit",
});

export default function AdminDashboard() {
  const [activeTab,     setActiveTab]     = useState("Events");
  const [events,        setEvents]        = useState([]);
  const [users,         setUsers]         = useState([]);
  const [transactions,  setTransactions]  = useState([]);
  const [ledger,        setLedger]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [updating,      setUpdating]      = useState(null);
  const [userFilter,    setUserFilter]    = useState("ALL");
  const [report,        setReport]        = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const loadData = async () => {
    try {
      const [evRes, userRes, txRes, ledgerRes] = await Promise.all([
        getAdminEvents(), getAllUsers(), getAdminTransactions(), getPaymentLedger(),
      ]);
      setEvents(evRes.data || []);
      setUsers(userRes.data || []);
      setTransactions(txRes.data || []);
      setLedger(ledgerRes.data || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (activeTab !== "Reports" || report || reportLoading) return;
    setReportLoading(true);
    getOrganizerSalesReport()
      .then((res) => setReport(res.data))
      .catch((e) => console.error(e))
      .finally(() => setReportLoading(false));
  }, [activeTab, report, reportLoading]);

  const downloadReportCSV = () => {
    if (!report) return;
    const rows = [["Organizer", "Email", "Event", "Category", "Status", "Tickets Sold", "Sales Generated (KES)"]];
    report.organizers.forEach((org) => {
      org.events.forEach((ev) => {
        rows.push([org.fullName, org.email, ev.title, ev.category || "", ev.status, ev.ticketsSold, ev.salesGenerated]);
      });
    });
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `hafla-organizer-sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const fmtDate  = (ds) => ds ? new Date(ds).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const fmtPrice = (p)  => Number(p) === 0 ? "FREE" : "KES " + Number(p).toLocaleString();

  const handleStatusChange = async (eventId, status) => {
    setUpdating(eventId);
    try {
      await updateEventStatus(eventId, status);
      setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, status } : e));
    } catch (e) { alert(e.message || "Failed to update event status."); }
    finally { setUpdating(null); }
  };

  const handleUserAction = async (userId, action) => {
    const reason = action !== "ACTIVE" ? prompt(`Reason for ${action.toLowerCase()}? (optional)`) : null;
    if (action === "REMOVE") {
      if (!confirm("Remove this user? Their data will be kept for records.")) return;
      setUpdating(userId);
      try {
        await removeUser(userId);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } catch (e) { alert(e.message); }
      finally { setUpdating(null); }
      return;
    }
    setUpdating(userId);
    try {
      const res = await updateUserStatus(userId, { status: action, reason });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...res.data } : u));
    } catch (e) { alert(e.message); }
    finally { setUpdating(null); }
  };

  const handleReleasePayout = async (eventId, eventTitle) => {
    if (!confirm(`Release held funds to organizer for "${eventTitle}"?`)) return;
    setUpdating(eventId);
    try {
      const res = await releaseEventPayout({ eventId });
      alert(res.message);
      await loadData();
    } catch (e) { alert(e.message); }
    finally { setUpdating(null); }
  };

  const handleRefund = async (orderId, amount) => {
    const reason = prompt(`Refund KES ${Number(amount).toLocaleString()} — reason?`);
    if (!reason) return;
    setUpdating(orderId);
    try {
      const res = await refundOrder({ orderId, reason });
      alert(res.message);
      await loadData();
    } catch (e) { alert(e.message); }
    finally { setUpdating(null); }
  };

  const filteredUsers = userFilter === "ALL"
    ? users
    : users.filter((u) => u.status === userFilter);

  const heldByEvent = {};
  (ledger?.payments || []).filter((p) => p.escrowStatus === "HELD").forEach((p) => {
    const ev = p.order?.ticket?.event;
    if (!ev) return;
    if (!heldByEvent[ev.id]) heldByEvent[ev.id] = { event: ev, total: 0, count: 0 };
    heldByEvent[ev.id].total += Number(p.organizerShare);
    heldByEvent[ev.id].count += 1;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#FAF8F3" }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <div style={{ background: "linear-gradient(135deg, #0B3D2E 0%, #0E5A43 100%)", padding: "40px 0" }}>
          <div className="container">
            <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>Admin Control Panel</h1>
            <p style={{ color: "#8A968D", marginTop: 6, margin: 0, fontSize: 14 }}>Moderate events, manage users, and control payments</p>
          </div>
        </div>

        <div className="container" style={{ padding: "36px 20px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
            <StatCard label="Total Events"   value={events.length} color="#0B3D2E" />
            <StatCard label="Pending Review" value={events.filter((e) => e.status === "PENDING").length} color="#B38A36" />
            <StatCard label="Total Users"    value={users.length} color="#128C6B" />
            <StatCard label="Held Funds"     value={fmtPrice(ledger?.summary?.totalHeld || 0)} color="#B38A36" />
            <StatCard label="Released"       value={fmtPrice(ledger?.summary?.totalReleased || 0)} color="#128C6B" />
            <StatCard label="Platform Fees"  value={fmtPrice(ledger?.summary?.platformFees || 0)} color="#0B3D2E" />
          </div>

          <div style={{ display: "flex", gap: 4, background: "#F1EFE4", borderRadius: 8, padding: 4, marginBottom: 24, width: "fit-content", flexWrap: "wrap" }}>
            {["Events", "Users", "Payments", "Transactions", "Reports"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: "8px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
                  background: activeTab === tab ? "#fff" : "transparent", color: activeTab === tab ? "#0B3D2E" : "#66766C",
                  boxShadow: activeTab === tab ? "0 1px 2px rgb(0 0 0 / 0.05)" : "none", transition: "all 0.15s ease" }}>
                {tab}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />)}
            </div>
          ) : activeTab === "Events" ? (
            <div style={{ background: "#fff", border: "1px solid #E3DFD2", borderRadius: 12, boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #E3DFD2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0B3D2E", margin: 0 }}>All Events</h3>
                <span style={{ fontSize: 13, color: "#66766C" }}>{events.length} total</span>
              </div>
              {events.length === 0 ? (
                <div style={{ padding: "60px 24px", textAlign: "center", color: "#66766C" }}>No events found.</div>
              ) : events.map((ev) => {
                const ss = STATUS_STYLES[ev.status] || STATUS_STYLES.CANCELLED;
                const organiserName = ev.organiser?.fullName || ev.organizer?.fullName || ev.organizer?.email || "—";
                return (
                  <div key={ev.id} style={{ padding: "14px 24px", borderBottom: "1px solid #F1EFE4", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0B3D2E", marginBottom: 3 }}>{ev.title}</div>
                      <div style={{ fontSize: 12, color: "#66766C" }}>{fmtDate(ev.eventDate)} · {ev.venue}</div>
                      <div style={{ fontSize: 11, color: "#8A968D", marginTop: 2 }}>By: {organiserName}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>
                        {ev.status}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#128C6B", minWidth: 80, textAlign: "right" }}>{fmtPrice(ev.ticketPrice)}</span>
                      <button onClick={() => setSelectedEvent(ev)}
                        style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #E3DFD2", background: "#fff", color: "#0B3D2E", cursor: "pointer", fontWeight: 600, fontSize: 12, fontFamily: "inherit" }}>
                        View
                      </button>
                      {ev.status === "PENDING" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => handleStatusChange(ev.id, "APPROVED")} disabled={updating === ev.id}
                            style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "#128C6B", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 12, fontFamily: "inherit" }}>
                            Approve
                          </button>
                          <button onClick={() => handleStatusChange(ev.id, "REJECTED")} disabled={updating === ev.id}
                            style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 12, fontFamily: "inherit" }}>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeTab === "Users" ? (
            <div style={{ background: "#fff", border: "1px solid #E3DFD2", borderRadius: 12, boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #E3DFD2", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0B3D2E", margin: 0 }}>Registered Users</h3>
                <div style={{ display: "flex", gap: 6 }}>
                  {["ALL", "ACTIVE", "SUSPENDED", "BANNED"].map((f) => (
                    <button key={f} onClick={() => setUserFilter(f)}
                      style={{ ...btnSm(userFilter === f ? "#0B3D2E" : "#F1EFE4", userFilter === f ? "#fff" : "#66766C"), fontSize: 10 }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              {filteredUsers.length === 0 ? (
                <div style={{ padding: "60px 24px", textAlign: "center", color: "#66766C" }}>No users match this filter.</div>
              ) : filteredUsers.map((u) => {
                const rs = ROLE_STYLES[u.role] || ROLE_STYLES.ATTENDEE;
                const us = USER_STATUS_STYLES[u.status] || USER_STATUS_STYLES.ACTIVE;
                const initials = (u.fullName || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <div key={u.id} style={{ padding: "14px 24px", borderBottom: "1px solid #F1EFE4", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #0E5A43, #0B3D2E)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0B3D2E" }}>{u.fullName || "Unnamed"}</div>
                      <div style={{ fontSize: 12, color: "#66766C" }}>{u.email}</div>
                      {u.statusReason && <div style={{ fontSize: 11, color: "#8A968D", marginTop: 2 }}>{u.statusReason}</div>}
                    </div>
                    <span style={{ padding: "4px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>{u.role}</span>
                    <span style={{ padding: "4px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: us.bg, color: us.color, border: `1px solid ${us.border}` }}>{u.status || "ACTIVE"}</span>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {u.status !== "SUSPENDED" && u.status !== "BANNED" && (
                        <button onClick={() => handleUserAction(u.id, "SUSPENDED")} disabled={updating === u.id} style={btnSm("#fffbeb", "#b45309")}>Suspend</button>
                      )}
                      {u.status !== "BANNED" && (
                        <button onClick={() => handleUserAction(u.id, "BANNED")} disabled={updating === u.id} style={btnSm("#fef2f2", "#b91c1c")}>Ban</button>
                      )}
                      {u.status !== "ACTIVE" && (
                        <button onClick={() => handleUserAction(u.id, "ACTIVE")} disabled={updating === u.id} style={btnSm("#ecfdf5", "#047857")}>Reactivate</button>
                      )}
                      <button onClick={() => handleUserAction(u.id, "REMOVE")} disabled={updating === u.id} style={btnSm("#F1EFE4", "#66766C")}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeTab === "Payments" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ background: "#fff", border: "1px solid #E3DFD2", borderRadius: 12, boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)", overflow: "hidden" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid #E3DFD2" }}>
                  <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0B3D2E", margin: 0 }}>Held Funds — Release to Organizers</h3>
                  <p style={{ fontSize: 13, color: "#66766C", margin: "6px 0 0" }}>Payments are held by the platform (10% fee deducted). Release organizer share after event.</p>
                </div>
                {Object.keys(heldByEvent).length === 0 ? (
                  <div style={{ padding: "40px 24px", textAlign: "center", color: "#66766C" }}>No held funds awaiting release.</div>
                ) : Object.values(heldByEvent).map(({ event, total, count }) => (
                  <div key={event.id} style={{ padding: "14px 24px", borderBottom: "1px solid #F1EFE4", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0B3D2E" }}>{event.title}</div>
                      <div style={{ fontSize: 12, color: "#66766C" }}>{event.organiser?.fullName || event.organizer?.fullName || "—"} · {count} payment(s)</div>
                    </div>
                    <span style={{ fontWeight: 700, color: "#B38A36" }}>{fmtPrice(total)}</span>
                    <button onClick={() => handleReleasePayout(event.id, event.title)} disabled={updating === event.id} style={btnSm("#128C6B", "#fff")}>
                      Release Payout
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ background: "#fff", border: "1px solid #E3DFD2", borderRadius: 12, boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)", overflow: "hidden" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid #E3DFD2" }}>
                  <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0B3D2E", margin: 0 }}>Payout History</h3>
                </div>
                {(ledger?.payouts || []).length === 0 ? (
                  <div style={{ padding: "40px 24px", textAlign: "center", color: "#66766C" }}>No payouts yet.</div>
                ) : (ledger?.payouts || []).map((p) => (
                  <div key={p.id} style={{ padding: "14px 24px", borderBottom: "1px solid #F1EFE4", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#0B3D2E" }}>{p.organizer?.fullName}</div>
                      <div style={{ fontSize: 12, color: "#66766C" }}>{p.event?.title || "—"} · {fmtDate(p.paidAt || p.createdAt)}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: "#128C6B" }}>{fmtPrice(p.amount)}</span>
                    <span style={{ fontSize: 11, color: "#8A968D", fontFamily: "monospace" }}>{p.mpesaReceiptNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === "Transactions" ? (
            <div style={{ background: "#fff", border: "1px solid #E3DFD2", borderRadius: 12, boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #E3DFD2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0B3D2E", margin: 0 }}>All Transactions</h3>
                <span style={{ fontSize: 13, color: "#66766C" }}>{transactions.length} total</span>
              </div>
              {transactions.length === 0 ? (
                <div style={{ padding: "60px 24px", textAlign: "center", color: "#66766C" }}>No transactions yet.</div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr auto", gap: 8, padding: "10px 24px", background: "#FAF8F3", borderBottom: "1px solid #E3DFD2" }}>
                    {["Attendee", "Event", "Type", "Amount", "M-Pesa Receipt", "Escrow", ""].map((h) => (
                      <div key={h || "actions"} style={{ fontSize: 11, fontWeight: 700, color: "#66766C", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
                    ))}
                  </div>
                  {transactions.map((tx) => {
                    const escrow = tx.payment?.escrowStatus;
                    const es = ESCROW_STYLES[escrow] || ESCROW_STYLES.HELD;
                    const canRefund = tx.status === "CONFIRMED" && escrow === "HELD";
                    return (
                      <div key={tx.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr auto", gap: 8, padding: "13px 24px", borderBottom: "1px solid #F1EFE4", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#0B3D2E" }}>{tx.attendee?.fullName || "—"}</div>
                          <div style={{ fontSize: 11, color: "#8A968D" }}>{tx.attendee?.email}</div>
                        </div>
                        <div style={{ fontSize: 13, color: "#4A5950", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {tx.ticket?.event?.title || "—"}
                        </div>
                        <div style={{ fontSize: 12, color: "#66766C" }}>{tx.ticket?.ticketType || "—"}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#128C6B" }}>{fmtPrice(tx.totalAmount)}</div>
                        <div style={{ fontSize: 11, color: "#66766C", fontFamily: "monospace" }}>
                          {tx.payment?.mpesaReceiptNumber || "—"}
                        </div>
                        <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: es.bg, color: es.color, whiteSpace: "nowrap", width: "fit-content" }}>
                          {escrow || tx.status}
                        </span>
                        {canRefund ? (
                          <button onClick={() => handleRefund(tx.id, tx.totalAmount)} disabled={updating === tx.id} style={btnSm("#fef2f2", "#b91c1c")}>Refund</button>
                        ) : <span />}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 16, color: "#0B3D2E", margin: 0 }}>Organizer Sales Report</h3>
                  <p style={{ fontSize: 13, color: "#66766C", margin: "4px 0 0" }}>Events, tickets sold, and revenue generated per organizer</p>
                </div>
                <button
                  onClick={downloadReportCSV}
                  disabled={!report}
                  style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: report ? "#0B3D2E" : "#C9C2AC", color: "#fff", cursor: report ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}
                >
                  ↓ Download CSV
                </button>
              </div>

              {reportLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
                </div>
              ) : !report || report.organizers.length === 0 ? (
                <div style={{ background: "#fff", border: "1px solid #E3DFD2", borderRadius: 12, padding: "60px 24px", textAlign: "center", color: "#66766C" }}>
                  No organizer sales data available yet.
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
                    <StatCard label="Organizers"   value={report.summary.totalOrganizers} color="#0B3D2E" />
                    <StatCard label="Events"       value={report.summary.totalEvents} color="#128C6B" />
                    <StatCard label="Tickets Sold" value={report.summary.totalTicketsSold} color="#0B3D2E" />
                    <StatCard label="Total Sales"  value={"KES " + report.summary.totalSales.toLocaleString()} color="#B38A36" />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {report.organizers.map((org) => (
                      <div key={org.organizerId} style={{ background: "#fff", border: "1px solid #E3DFD2", borderRadius: 12, boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)", overflow: "hidden" }}>
                        <div style={{ padding: "16px 24px", borderBottom: "1px solid #E3DFD2", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, background: "#FAF8F3" }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#0B3D2E" }}>{org.fullName}</div>
                            <div style={{ fontSize: 12, color: "#66766C" }}>{org.email}</div>
                          </div>
                          <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#66766C" }}>
                            <span><strong style={{ color: "#0B3D2E" }}>{org.totalEvents}</strong> event(s)</span>
                            <span><strong style={{ color: "#0B3D2E" }}>{org.totalTicketsSold}</strong> sold</span>
                            <span><strong style={{ color: "#B38A36" }}>KES {org.totalSales.toLocaleString()}</strong> revenue</span>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr", gap: 8, padding: "10px 24px", background: "#fff", borderBottom: "1px solid #F1EFE4" }}>
                          {["Event", "Category", "Status", "Tickets Sold", "Sales (KES)"].map((h) => (
                            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#66766C", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
                          ))}
                        </div>
                        {org.events.map((ev) => {
                          const ss = STATUS_STYLES[ev.status] || STATUS_STYLES.CANCELLED;
                          return (
                            <div key={ev.id} style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr", gap: 8, padding: "12px 24px", borderBottom: "1px solid #F1EFE4", alignItems: "center" }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#0B3D2E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                              <div style={{ fontSize: 12, color: "#66766C" }}>{ev.category || "—"}</div>
                              <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, width: "fit-content" }}>
                                {ev.status}
                              </span>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F7A75" }}>{ev.ticketsSold}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#128C6B" }}>{fmtPrice(ev.salesGenerated)}</div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        actions={selectedEvent && (
          <>
            {selectedEvent.status === "PENDING" && (
              <>
                <button onClick={() => { handleStatusChange(selectedEvent.id, "APPROVED"); setSelectedEvent(null); }} disabled={updating === selectedEvent.id}
                  style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#128C6B", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>
                  Approve Event
                </button>
                <button onClick={() => { handleStatusChange(selectedEvent.id, "REJECTED"); setSelectedEvent(null); }} disabled={updating === selectedEvent.id}
                  style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>
                  Reject Event
                </button>
              </>
            )}
          </>
        )}
      />

      <Footer />
    </div>
  );
}

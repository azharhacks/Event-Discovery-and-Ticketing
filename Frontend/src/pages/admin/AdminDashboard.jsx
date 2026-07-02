import { useState, useEffect } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import {
  getAdminEvents, getAllUsers, updateEventStatus, getAdminTransactions,
  updateUserStatus, removeUser, getPaymentLedger, releaseEventPayout, refundOrder,
} from "../../lib/api";

const STATUS_STYLES = {
  APPROVED:  { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
  PENDING:   { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  REJECTED:  { bg: "#fef2f2", color: "#b91c1c", border: "#fca5a5" },
  CANCELLED: { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
};

const ROLE_STYLES = {
  ADMIN:     { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" },
  ORGANIZER: { bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff" },
  ATTENDEE:  { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
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
  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)" }}>
    <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block", marginBottom: 4 }}>{label}</span>
    <span style={{ fontSize: 24, fontWeight: 800, color: color || "#0f172a" }}>{value}</span>
  </div>
);

const btnSm = (bg, color) => ({
  padding: "4px 10px", borderRadius: 6, border: "none", background: bg, color,
  cursor: "pointer", fontWeight: 600, fontSize: 11, fontFamily: "inherit",
});

export default function AdminDashboard() {
  const [activeTab,    setActiveTab]    = useState("Events");
  const [events,       setEvents]       = useState([]);
  const [users,        setUsers]        = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [ledger,       setLedger]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [updating,     setUpdating]     = useState(null);
  const [userFilter,   setUserFilter]   = useState("ALL");

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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "40px 0" }}>
          <div className="container">
            <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>Admin Control Panel</h1>
            <p style={{ color: "#94a3b8", marginTop: 6, margin: 0, fontSize: 14 }}>Moderate events, manage users, and control payments</p>
          </div>
        </div>

        <div className="container" style={{ padding: "36px 20px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
            <StatCard label="Total Events"   value={events.length} color="#2563eb" />
            <StatCard label="Pending Review" value={events.filter((e) => e.status === "PENDING").length} color="#d97706" />
            <StatCard label="Total Users"    value={users.length} color="#7c3aed" />
            <StatCard label="Held Funds"     value={fmtPrice(ledger?.summary?.totalHeld || 0)} color="#d97706" />
            <StatCard label="Released"       value={fmtPrice(ledger?.summary?.totalReleased || 0)} color="#16a34a" />
            <StatCard label="Platform Fees"  value={fmtPrice(ledger?.summary?.platformFees || 0)} color="#0d9488" />
          </div>

          <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 8, padding: 4, marginBottom: 24, width: "fit-content", flexWrap: "wrap" }}>
            {["Events", "Users", "Payments", "Transactions"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: "8px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
                  background: activeTab === tab ? "#fff" : "transparent", color: activeTab === tab ? "#0f172a" : "#64748b",
                  boxShadow: activeTab === tab ? "0 1px 2px rgb(0 0 0 / 0.05)" : "none" }}>
                {tab}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />)}
            </div>
          ) : activeTab === "Events" ? (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0" }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>All Events</h3>
              </div>
              {events.map((ev) => {
                const ss = STATUS_STYLES[ev.status] || STATUS_STYLES.CANCELLED;
                return (
                  <div key={ev.id} style={{ padding: "14px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{ev.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{fmtDate(ev.eventDate)} · {ev.venue}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>By: {ev.organiser?.fullName || "—"}</div>
                    </div>
                    <span style={{ padding: "4px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{ev.status}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#2563eb" }}>{fmtPrice(ev.ticketPrice)}</span>
                    {ev.status === "PENDING" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleStatusChange(ev.id, "APPROVED")} disabled={updating === ev.id} style={btnSm("#10b981", "#fff")}>Approve</button>
                        <button onClick={() => handleStatusChange(ev.id, "REJECTED")} disabled={updating === ev.id} style={btnSm("#ef4444", "#fff")}>Reject</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : activeTab === "Users" ? (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Registered Users</h3>
                <div style={{ display: "flex", gap: 6 }}>
                  {["ALL", "ACTIVE", "SUSPENDED", "BANNED"].map((f) => (
                    <button key={f} onClick={() => setUserFilter(f)}
                      style={{ ...btnSm(userFilter === f ? "#0f172a" : "#f1f5f9", userFilter === f ? "#fff" : "#64748b"), fontSize: 10 }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              {filteredUsers.map((u) => {
                const rs = ROLE_STYLES[u.role] || ROLE_STYLES.ATTENDEE;
                const us = USER_STATUS_STYLES[u.status] || USER_STATUS_STYLES.ACTIVE;
                const initials = (u.fullName || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <div key={u.id} style={{ padding: "14px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{u.fullName}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{u.email}</div>
                      {u.statusReason && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{u.statusReason}</div>}
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
                      <button onClick={() => handleUserAction(u.id, "REMOVE")} disabled={updating === u.id} style={btnSm("#f1f5f9", "#64748b")}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeTab === "Payments" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Held funds — release to organizers */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0" }}>
                  <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Held Funds — Release to Organizers</h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>Payments are held by the platform (10% fee deducted). Release organizer share after event.</p>
                </div>
                {Object.keys(heldByEvent).length === 0 ? (
                  <div style={{ padding: "40px 24px", textAlign: "center", color: "#94a3b8" }}>No held funds awaiting release.</div>
                ) : Object.values(heldByEvent).map(({ event, total, count }) => (
                  <div key={event.id} style={{ padding: "14px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{event.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{event.organiser?.fullName} · {count} payment(s)</div>
                    </div>
                    <span style={{ fontWeight: 700, color: "#d97706" }}>{fmtPrice(total)}</span>
                    <button onClick={() => handleReleasePayout(event.id, event.title)} disabled={updating === event.id} style={btnSm("#10b981", "#fff")}>
                      Release Payout
                    </button>
                  </div>
                ))}
              </div>

              {/* Payout history */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0" }}>
                  <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Payout History</h3>
                </div>
                {(ledger?.payouts || []).length === 0 ? (
                  <div style={{ padding: "40px 24px", textAlign: "center", color: "#94a3b8" }}>No payouts yet.</div>
                ) : (ledger?.payouts || []).map((p) => (
                  <div key={p.id} style={{ padding: "14px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.organizer?.fullName}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{p.event?.title || "—"} · {fmtDate(p.paidAt || p.createdAt)}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: "#16a34a" }}>{fmtPrice(p.amount)}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{p.mpesaReceiptNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0" }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>All Transactions</h3>
              </div>
              {transactions.map((tx) => {
                const escrow = tx.payment?.escrowStatus;
                const es = ESCROW_STYLES[escrow] || ESCROW_STYLES.HELD;
                const canRefund = tx.status === "CONFIRMED" && escrow === "HELD";
                return (
                  <div key={tx.id} style={{ padding: "14px 24px", borderBottom: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{tx.attendee?.fullName}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{tx.attendee?.email}</div>
                    </div>
                    <div style={{ fontSize: 13, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.ticket?.event?.title}</div>
                    <div style={{ fontWeight: 700, color: "#2563eb", fontSize: 13 }}>{fmtPrice(tx.totalAmount)}</div>
                    <span style={{ padding: "3px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: es.bg, color: es.color }}>{escrow || tx.status}</span>
                    <div style={{ fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>{tx.payment?.mpesaReceiptNumber || "—"}</div>
                    {canRefund && (
                      <button onClick={() => handleRefund(tx.id, tx.totalAmount)} disabled={updating === tx.id} style={btnSm("#fef2f2", "#b91c1c")}>Refund</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

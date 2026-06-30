import { useState, useEffect } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getAdminEvents, getAllUsers, updateEventStatus, getAdminTransactions } from "../../lib/api";

const STATUS_STYLES = {
  APPROVED:  { bg: "#E8F5EE", color: "#0E7257", border: "#A7DDC4" },
  PENDING:   { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  REJECTED:  { bg: "#fef2f2", color: "#b91c1c", border: "#fca5a5" },
  CANCELLED: { bg: "#FAF8F3", color: "#4A5950", border: "#E3DFD2" },
};

const ROLE_STYLES = {
  ADMIN:     { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" },
  ORGANIZER: { bg: "#FBF3E3", color: "#9C6B1F", border: "#E8D3A0" },
  ATTENDEE:  { bg: "#E3F3F1", color: "#128C6B", border: "#BFE3DF" },
};

const StatCard = ({ label, value, color }) => (
  <div style={{ background: "#fff", border: "1px solid #E3DFD2", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)" }}>
    <span style={{ fontSize: 13, color: "#66766C", fontWeight: 500, display: "block", marginBottom: 4 }}>{label}</span>
    <span style={{ fontSize: 24, fontWeight: 800, color: color || "#0B3D2E" }}>{value}</span>
  </div>
);

export default function AdminDashboard() {
  const [activeTab,    setActiveTab]    = useState("Events");
  const [events,       setEvents]       = useState([]);
  const [users,        setUsers]        = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [updating,     setUpdating]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [evRes, userRes, txRes] = await Promise.all([getAdminEvents(), getAllUsers(), getAdminTransactions()]);
        setEvents(evRes.data || []);
        setUsers(userRes.data || []);
        setTransactions(txRes.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#FAF8F3" }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <div style={{ background: "linear-gradient(135deg, #0B3D2E 0%, #0E5A43 100%)", padding: "40px 0" }}>
          <div className="container">
            <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>Admin Control Panel</h1>
            <p style={{ color: "#8A968D", marginTop: 6, margin: 0, fontSize: 14 }}>Moderate events and manage platform users</p>
          </div>
        </div>

        <div className="container" style={{ padding: "36px 20px 80px" }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
            <StatCard label="Total Events"   value={events.length}                                                         color="#128C6B" />
            <StatCard label="Pending Review" value={events.filter((e) => e.status === "PENDING").length}                   color="#d97706" />
            <StatCard label="Approved"       value={events.filter((e) => e.status === "APPROVED").length}                  color="#0E7257" />
            <StatCard label="Total Users"    value={users.length}                                                          color="#9C6B1F" />
            <StatCard label="Transactions"   value={transactions.length}                                                   color="#0F7A75" />
            <StatCard label="Total Revenue"  value={"KES " + transactions.filter(t => t.status === "CONFIRMED").reduce((s, t) => s + Number(t.totalAmount), 0).toLocaleString()} color="#B38A36" />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "#F1EFE4", borderRadius: 8, padding: 4, marginBottom: 24, width: "fit-content" }}>
            {["Events", "Users", "Transactions"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: "8px 24px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
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
                return (
                  <div key={ev.id} style={{ padding: "14px 24px", borderBottom: "1px solid #F1EFE4", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0B3D2E", marginBottom: 3 }}>{ev.title}</div>
                      <div style={{ fontSize: 12, color: "#66766C" }}>{fmtDate(ev.eventDate)} · {ev.venue}</div>
                      <div style={{ fontSize: 11, color: "#8A968D", marginTop: 2 }}>By: {ev.organizer?.fullName || ev.organizer?.email || "—"}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>
                        {ev.status}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#128C6B", minWidth: 80, textAlign: "right" }}>{fmtPrice(ev.ticketPrice)}</span>
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
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #E3DFD2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0B3D2E", margin: 0 }}>Registered Users</h3>
                <span style={{ fontSize: 13, color: "#66766C" }}>{users.length} total</span>
              </div>
              {users.length === 0 ? (
                <div style={{ padding: "60px 24px", textAlign: "center", color: "#66766C" }}>No users registered yet.</div>
              ) : users.map((u) => {
                const rs = ROLE_STYLES[u.role] || { bg: "#FAF8F3", color: "#4A5950", border: "#E3DFD2" };
                const initials = (u.fullName || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <div key={u.id} style={{ padding: "14px 24px", borderBottom: "1px solid #F1EFE4", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #0E5A43, #0B3D2E)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0B3D2E" }}>{u.fullName || "Unnamed"}</div>
                      <div style={{ fontSize: 12, color: "#66766C" }}>{u.email}</div>
                    </div>
                    <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                      {u.role}
                    </span>
                    <span style={{ fontSize: 12, color: "#8A968D", minWidth: 80, textAlign: "right" }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Transactions Tab ── */
            <div style={{ background: "#fff", border: "1px solid #E3DFD2", borderRadius: 12, boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #E3DFD2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0B3D2E", margin: 0 }}>All Transactions</h3>
                <span style={{ fontSize: 13, color: "#66766C" }}>{transactions.length} total</span>
              </div>
              {transactions.length === 0 ? (
                <div style={{ padding: "60px 24px", textAlign: "center", color: "#66766C" }}>No transactions yet.</div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr", gap: 8, padding: "10px 24px", background: "#FAF8F3", borderBottom: "1px solid #E3DFD2" }}>
                    {["Attendee", "Event", "Type", "Amount", "M-Pesa Receipt", "Status"].map((h) => (
                      <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#66766C", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
                    ))}
                  </div>
                  {transactions.map((tx) => {
                    const isPaid    = tx.status === "CONFIRMED";
                    const isFailed  = tx.status === "FAILED";
                    const statusBg  = isPaid ? "#E8F5EE" : isFailed ? "#fef2f2" : "#fffbeb";
                    const statusClr = isPaid ? "#0E7257" : isFailed ? "#b91c1c" : "#b45309";
                    return (
                      <div key={tx.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr", gap: 8, padding: "13px 24px", borderBottom: "1px solid #F1EFE4", alignItems: "center" }}>
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
                        <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: statusBg, color: statusClr, whiteSpace: "nowrap" }}>
                          {tx.status}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

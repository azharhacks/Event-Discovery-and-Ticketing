import { useState, useEffect } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getAdminEvents, getAllUsers, updateEventStatus } from "../../lib/api";

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

const StatCard = ({ label, value, color }) => (
  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)" }}>
    <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block", marginBottom: 4 }}>{label}</span>
    <span style={{ fontSize: 24, fontWeight: 800, color: color || "#0f172a" }}>{value}</span>
  </div>
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Events");
  const [events,  setEvents]  = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [evRes, userRes] = await Promise.all([getAdminEvents(), getAllUsers()]);
        setEvents(evRes.data || []);
        setUsers(userRes.data || []);
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "40px 0" }}>
          <div className="container">
            <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>Admin Control Panel</h1>
            <p style={{ color: "#94a3b8", marginTop: 6, margin: 0, fontSize: 14 }}>Moderate events and manage platform users</p>
          </div>
        </div>

        <div className="container" style={{ padding: "36px 20px 80px" }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
            <StatCard label="Total Events"   value={events.length}                                         color="#2563eb" />
            <StatCard label="Pending Review" value={events.filter((e) => e.status === "PENDING").length}   color="#d97706" />
            <StatCard label="Approved"       value={events.filter((e) => e.status === "APPROVED").length}  color="#16a34a" />
            <StatCard label="Total Users"    value={users.length}                                          color="#7c3aed" />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 8, padding: 4, marginBottom: 24, width: "fit-content" }}>
            {["Events", "Users"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: "8px 24px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
                  background: activeTab === tab ? "#fff" : "transparent", color: activeTab === tab ? "#0f172a" : "#64748b",
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
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", margin: 0 }}>All Events</h3>
                <span style={{ fontSize: 13, color: "#64748b" }}>{events.length} total</span>
              </div>
              {events.length === 0 ? (
                <div style={{ padding: "60px 24px", textAlign: "center", color: "#64748b" }}>No events found.</div>
              ) : events.map((ev) => {
                const ss = STATUS_STYLES[ev.status] || STATUS_STYLES.CANCELLED;
                return (
                  <div key={ev.id} style={{ padding: "14px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 3 }}>{ev.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{fmtDate(ev.eventDate)} · {ev.venue}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>By: {ev.organizer?.fullName || ev.organizer?.email || "—"}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>
                        {ev.status}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#2563eb", minWidth: 80, textAlign: "right" }}>{fmtPrice(ev.ticketPrice)}</span>
                      {ev.status === "PENDING" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => handleStatusChange(ev.id, "APPROVED")} disabled={updating === ev.id}
                            style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "#10b981", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 12, fontFamily: "inherit" }}>
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
          ) : (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", margin: 0 }}>Registered Users</h3>
                <span style={{ fontSize: 13, color: "#64748b" }}>{users.length} total</span>
              </div>
              {users.length === 0 ? (
                <div style={{ padding: "60px 24px", textAlign: "center", color: "#64748b" }}>No users registered yet.</div>
              ) : users.map((u) => {
                const rs = ROLE_STYLES[u.role] || { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };
                const initials = (u.fullName || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <div key={u.id} style={{ padding: "14px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #1e293b, #0f172a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{u.fullName || "Unnamed"}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{u.email}</div>
                    </div>
                    <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                      {u.role}
                    </span>
                    <span style={{ fontSize: 12, color: "#94a3b8", minWidth: 80, textAlign: "right" }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
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

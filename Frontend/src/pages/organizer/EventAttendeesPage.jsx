import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getEventAttendees } from "../../lib/api";
import { ROUTES } from "../../config/routes";

const fmtDate  = (ds) => ds ? new Date(ds).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtPrice = (p)  => Number(p) === 0 ? "FREE" : "KES " + Number(p).toLocaleString();

export default function EventAttendeesPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attendees, setAttendees] = useState([]);
  const [event,     setEvent]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    getEventAttendees(id)
      .then((res) => {
        setAttendees(res.data || []);
        setEvent(res.event || null);
      })
      .catch((err) => setError(err.message || "Failed to load attendees."))
      .finally(() => setLoading(false));
  }, [id]);

  const totalRevenue = attendees.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const totalTickets = attendees.reduce((sum, o) => sum + o.quantity, 0);

  const filtered = attendees.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.attendee?.fullName?.toLowerCase().includes(q) ||
      o.attendee?.email?.toLowerCase().includes(q) ||
      o.ticket?.ticketType?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "40px 0" }}>
          <div className="container">
            <button onClick={() => navigate(ROUTES.ORGANIZER)}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 12, fontFamily: "inherit" }}>
              ← Back to Dashboard
            </button>
            <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>
              {event ? event.title : "Event"} — Attendees
            </h1>
            <p style={{ color: "#94a3b8", marginTop: 6, margin: 0, fontSize: 14 }}>
              {event && `${fmtDate(event.eventDate)} · ${event.venue}`}
            </p>
          </div>
        </div>

        <div className="container" style={{ padding: "36px 20px 80px" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />)}
            </div>
          ) : error ? (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "40px 24px", textAlign: "center", color: "#ef4444" }}>
              {error}
            </div>
          ) : (
            <>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
                {[
                  { label: "Total Attendees", value: attendees.length, color: "#2563eb" },
                  { label: "Tickets Sold",    value: totalTickets,     color: "#0d9488" },
                  { label: "Revenue",         value: fmtPrice(totalRevenue), color: "#16a34a" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)" }}>
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Search */}
              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="Search by name, email, or ticket type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "100%", maxWidth: 400, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", outline: "none", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>

              {/* Table */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)", overflow: "hidden" }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", margin: 0 }}>Confirmed Attendees</h3>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{filtered.length} result(s)</span>
                </div>

                {filtered.length === 0 ? (
                  <div style={{ padding: "60px 24px", textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                      {search ? "No matches found" : "No attendees yet"}
                    </h3>
                    <p style={{ color: "#94a3b8", fontSize: 14 }}>
                      {search ? "Try a different search term." : "Attendees will appear here once tickets are purchased and payments confirmed."}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Table header */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", gap: 8, padding: "10px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      {["Name", "Email", "Ticket Type", "Qty", "Paid"].map((h) => (
                        <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
                      ))}
                    </div>

                    {filtered.map((order) => (
                      <div key={order.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", gap: 8, padding: "14px 24px", borderBottom: "1px solid #f1f5f9", alignItems: "center" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
                          {order.attendee?.fullName || "—"}
                        </div>
                        <div style={{ fontSize: 13, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {order.attendee?.email || "—"}
                        </div>
                        <div>
                          <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                            {order.ticket?.ticketType || "REGULAR"}
                          </span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>x{order.quantity}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{fmtPrice(order.totalAmount)}</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#FAF8F3" }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0B3D2E 0%, #0E5A43 100%)", padding: "40px 0" }}>
          <div className="container">
            <button onClick={() => navigate(ROUTES.ORGANIZER)}
              style={{ background: "none", border: "none", color: "#8A968D", cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 12, fontFamily: "inherit" }}>
              ← Back to Dashboard
            </button>
            <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>
              {event ? event.title : "Event"} — Attendees
            </h1>
            <p style={{ color: "#8A968D", marginTop: 6, margin: 0, fontSize: 14 }}>
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
                  { label: "Total Attendees", value: attendees.length, color: "#128C6B" },
                  { label: "Tickets Sold",    value: totalTickets,     color: "#0F7A75" },
                  { label: "Revenue",         value: fmtPrice(totalRevenue), color: "#0E7257" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: "#fff", border: "1px solid #E3DFD2", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)" }}>
                    <div style={{ fontSize: 13, color: "#66766C", marginBottom: 4 }}>{label}</div>
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
                  style={{ width: "100%", maxWidth: 400, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #E3DFD2", outline: "none", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>

              {/* Table */}
              <div style={{ background: "#fff", border: "1px solid #E3DFD2", borderRadius: 12, boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)", overflow: "hidden" }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #E3DFD2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0B3D2E", margin: 0 }}>Confirmed Attendees</h3>
                  <span style={{ fontSize: 13, color: "#66766C" }}>{filtered.length} result(s)</span>
                </div>

                {filtered.length === 0 ? (
                  <div style={{ padding: "60px 24px", textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                      {search ? "No matches found" : "No attendees yet"}
                    </h3>
                    <p style={{ color: "#8A968D", fontSize: 14 }}>
                      {search ? "Try a different search term." : "Attendees will appear here once tickets are purchased and payments confirmed."}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Table header */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", gap: 8, padding: "10px 24px", background: "#FAF8F3", borderBottom: "1px solid #E3DFD2" }}>
                      {["Name", "Email", "Ticket Type", "Qty", "Paid"].map((h) => (
                        <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#66766C", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
                      ))}
                    </div>

                    {filtered.map((order) => (
                      <div key={order.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", gap: 8, padding: "14px 24px", borderBottom: "1px solid #F1EFE4", alignItems: "center" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#0B3D2E" }}>
                          {order.attendee?.fullName || "—"}
                        </div>
                        <div style={{ fontSize: 13, color: "#66766C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {order.attendee?.email || "—"}
                        </div>
                        <div>
                          <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: "#E3F3F1", color: "#128C6B", border: "1px solid #BFE3DF" }}>
                            {order.ticket?.ticketType || "REGULAR"}
                          </span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#4A5950" }}>x{order.quantity}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0E7257" }}>{fmtPrice(order.totalAmount)}</div>
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getOrganizerEvents, verifyTicket } from "../../lib/api";
import { ROUTES } from "../../config/routes";

const STATUS_STYLES = {
  APPROVED:  { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
  PENDING:   { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  REJECTED:  { bg: "#fef2f2", color: "#b91c1c", border: "#fca5a5" },
  CANCELLED: { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
};

const StatCard = ({ label, value, color }) => (
  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)", display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{label}</span>
    <span style={{ fontSize: 24, fontWeight: 800, color: color || "#0f172a" }}>{value}</span>
  </div>
);

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const [events,     setEvents]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [qrInput,    setQrInput]    = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanning,   setScanning]   = useState(false);

  useEffect(() => {
    getOrganizerEvents()
      .then((res) => setEvents(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmtDate  = (ds) => ds ? new Date(ds).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const fmtPrice = (p)  => Number(p) === 0 ? "FREE" : "KES " + Number(p).toLocaleString();

  const totalRevenue = events.reduce((sum, ev) => {
    const sold = ev.capacity - (ev.tickets?.[0]?.quantityAvailable ?? ev.capacity);
    return sum + (sold > 0 ? sold : 0) * Number(ev.ticketPrice);
  }, 0);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await verifyTicket(qrInput.trim());
      setScanResult({ success: true, message: res.message || "Ticket verified.", attendee: res.data?.attendee || null, ticketType: res.data?.ticketType || "Regular" });
      setQrInput("");
    } catch (err) {
      setScanResult({ success: false, message: err.message || "Invalid or already scanned ticket." });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "40px 0" }}>
          <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>Organizer Dashboard</h1>
              <p style={{ color: "#94a3b8", marginTop: 6, margin: 0, fontSize: 14 }}>Manage your events and validate ticket entry</p>
            </div>
            <button onClick={() => navigate(ROUTES.ORGANIZER_CREATE)}
              style={{ padding: "10px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              + Create Event
            </button>
          </div>
        </div>

        <div className="container" style={{ padding: "36px 20px 80px" }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
            <StatCard label="Total Events"   value={events.length}                                          color="#2563eb" />
            <StatCard label="Approved"       value={events.filter((e) => e.status === "APPROVED").length}   color="#16a34a" />
            <StatCard label="Pending Review" value={events.filter((e) => e.status === "PENDING").length}    color="#d97706" />
            <StatCard label="Est. Revenue"   value={"KES " + totalRevenue.toLocaleString()}                 color="#0d9488" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
            {/* Events list */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", margin: 0 }}>My Events</h3>
                <span style={{ fontSize: 13, color: "#64748b" }}>{events.length} event(s)</span>
              </div>

              {loading ? (
                <div style={{ padding: 24 }}>
                  {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 56, marginBottom: 10, borderRadius: 8 }} />)}
                </div>
              ) : events.length === 0 ? (
                <div style={{ textAlign: "center", padding: "56px 24px" }}>
                  <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16 }}>No events yet. Create your first to get started.</p>
                  <button onClick={() => navigate(ROUTES.ORGANIZER_CREATE)}
                    style={{ padding: "8px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
                    Create Event
                  </button>
                </div>
              ) : events.map((ev) => {
                const ss = STATUS_STYLES[ev.status] || STATUS_STYLES.CANCELLED;
                return (
                  <div key={ev.id} style={{ padding: "14px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{fmtDate(ev.eventDate)} · {ev.venue}</div>
                    </div>
                    <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, whiteSpace: "nowrap" }}>
                      {ev.status}
                    </span>
                    <div style={{ textAlign: "right", minWidth: 90 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>{fmtPrice(ev.ticketPrice)}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Cap: {ev.capacity}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ticket Verifier */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)" }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", margin: "0 0 6px" }}>Ticket Verifier</h3>
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px", lineHeight: 1.5 }}>Scan or paste a ticket QR token to validate entry at the gate.</p>

              <form onSubmit={handleVerify}>
                <textarea value={qrInput} onChange={(e) => setQrInput(e.target.value)} placeholder="Paste QR token here..." required
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #e2e8f0", outline: "none", fontSize: 13, fontFamily: "monospace", minHeight: 80, resize: "vertical", marginBottom: 12, background: "#f8fafc", boxSizing: "border-box" }} />
                <button type="submit" disabled={scanning || !qrInput.trim()}
                  style={{ width: "100%", padding: "10px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: scanning || !qrInput.trim() ? 0.5 : 1 }}>
                  {scanning ? "Verifying..." : "Verify Ticket"}
                </button>
              </form>

              {scanResult && (
                <div style={{ marginTop: 16, padding: 14, borderRadius: 8, background: scanResult.success ? "#ecfdf5" : "#fef2f2", border: `1px solid ${scanResult.success ? "#10b981" : "#ef4444"}` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: scanResult.success ? "#047857" : "#b91c1c", marginBottom: 6 }}>
                    {scanResult.success ? "Valid Ticket" : "Invalid / Already Scanned"}
                  </div>
                  <p style={{ fontSize: 13, color: "#334155", margin: 0, lineHeight: 1.5 }}>{scanResult.message}</p>
                  {scanResult.success && scanResult.attendee && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #a7f3d0", fontSize: 12, color: "#475569" }}>
                      <div style={{ marginBottom: 3 }}><strong>Attendee:</strong> {scanResult.attendee.fullName || scanResult.attendee.email}</div>
                      <div><strong>Tier:</strong> {scanResult.ticketType}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getOrganizerEvents, verifyTicket } from "../../lib/api";
import QrScanner from "../../components/ui/QrScanner";
import { ROUTES } from "../../config/routes";

const btnSm = (bg, color) => ({
  padding: "4px 10px", borderRadius: 6, border: `1px solid ${color}`, background: bg, color,
  cursor: "pointer", fontWeight: 600, fontSize: 11, fontFamily: "inherit",
});

const STATUS_STYLES = {
  APPROVED:  { bg: "transparent", color: "#0E7257", border: "transparent" },
  PENDING:   { bg: "#fff",        color: "#4F46E5", border: "white" },
  REJECTED:  { bg: "transparent", color: "#b91c1c", border: "transparent" },
  CANCELLED: { bg: "transparent", color: "#4A5950", border: "transparent" },
};

const StatCard = ({ label, value, color }) => (
  <div style={{ background: "#fff", border: "1px solid #E3DFD2", borderRadius: 12, padding: "16px 24px", boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flex: 1 }}>
    <span style={{ fontSize: 13, color: "#66766C", fontWeight: 500 }}>{label}</span>
    <span style={{ fontSize: 20, fontWeight: 800, color: color || "#0B3D2E" }}>{value}</span>
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

  const handleVerify = async (token) => {
    const value = (token || qrInput).trim();
    if (!value) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await verifyTicket(value);
      setScanResult({ success: true, message: res.message || "Ticket verified.", attendee: res.data?.attendee || null, ticketType: res.data?.ticketType || "Regular", quantity: res.data?.quantity });
      setQrInput("");
    } catch (err) {
      setScanResult({ success: false, message: err.message || "Invalid or already scanned ticket." });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#FAF8F3" }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <div style={{ background: "linear-gradient(135deg, #0B3D2E 0%, #0E5A43 100%)", padding: "40px 0" }}>
          <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>Organizer Dashboard</h1>
              <p style={{ color: "#8A968D", marginTop: 6, margin: 0, fontSize: 14 }}>Manage your events and validate ticket entry</p>
            </div>
            <button onClick={() => navigate(ROUTES.ORGANIZER_CREATE)}
              style={{ padding: "10px 20px", background: "#128C6B", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              + Create Event
            </button>
          </div>
        </div>

        <div className="container" style={{ padding: "30px 20px 50px" }}>
          {/* Stats */}
          <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
            <StatCard label="Total Events :"   value={events.length}                                          color="black" />
            <StatCard label="Approved :"       value={events.filter((e) => e.status === "APPROVED").length}   color="black" />
            <StatCard label="Pending Review :" value={events.filter((e) => e.status === "PENDING").length}    color="black" />
            <StatCard label="Est. Revenue :"   value={"KES " + totalRevenue.toLocaleString()}                 color="#0F7A75" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
            {/* Events list */}
            <div style={{ background: "#fff", border: "1px solid #E3DFD2", borderRadius: 12, boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #E3DFD2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0B3D2E", margin: 0 }}>My Events</h3>
                <span style={{ fontSize: 13, color: "#66766C" }}>{events.length} event(s)</span>
              </div>

              {loading ? (
                <div style={{ padding: 24 }}>
                  {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 56, marginBottom: 10, borderRadius: 8 }} />)}
                </div>
              ) : events.length === 0 ? (
                <div style={{ textAlign: "center", padding: "56px 24px" }}>
                  <p style={{ color: "#8A968D", fontSize: 14, marginBottom: 16 }}>No events yet. Create your first to get started.</p>
                  <button onClick={() => navigate(ROUTES.ORGANIZER_CREATE)}
                    style={{ padding: "8px 18px", background: "#128C6B", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
                    Create Event
                  </button>
                </div>
              ) : events.map((ev) => {
                const ss = STATUS_STYLES[ev.status] || STATUS_STYLES.CANCELLED;
                return (
                  <div key={ev.id} style={{ padding: "14px 24px", borderBottom: "1px solid #F1EFE4", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0B3D2E", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                      <div style={{ fontSize: 12, color: "#66766C" }}>{fmtDate(ev.eventDate)} · {ev.venue}</div>
                    </div>
                    <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, whiteSpace: "nowrap" }}>
                      {ev.status}
                    </span>
                    <div style={{ textAlign: "right", minWidth: 80 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "black" }}>{fmtPrice(ev.ticketPrice)}</div>
                      {(() => {
                        const avail = ev.tickets?.[0]?.quantityAvailable ?? ev.capacity;
                        const sold  = ev.capacity - avail;
                        return (
                          <div style={{ fontSize: 11, color: sold > 0 ? "#0E7257" : "#8A968D" }}>
                            {sold} / {ev.capacity} sold
                          </div>
                        );
                      })()}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => navigate(ROUTES.ORGANIZER_EDIT(ev.id))} style={btnSm("transparent", "#128C6B")}>
                        Edit
                      </button>
                      <button onClick={() => navigate(ROUTES.ORGANIZER_ATTENDEES(ev.id))} style={btnSm("transparent", "#0E7257")}>
                        Attendees
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ticket Verifier */}
            <div style={{ background: "#fff", border: "1px solid #E3DFD2", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgb(0 0 0 / 0.04)" }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: "#0B3D2E", margin: "0 0 6px" }}>Ticket Verifier</h3>
              <p style={{ fontSize: 13, color: "#66766C", margin: "0 0 16px", lineHeight: 1.5 }}>Scan a ticket QR code or paste the token below.</p>

              <QrScanner onScan={(decoded) => handleVerify(decoded)} />

              <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }}>
                <textarea value={qrInput} onChange={(e) => setQrInput(e.target.value)} placeholder="Paste QR token here..." required
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #E3DFD2", outline: "none", fontSize: 13, fontFamily: "monospace", minHeight: 80, resize: "vertical", marginBottom: 12, background: "#FAF8F3", boxSizing: "border-box" }} />
                <button type="submit" disabled={scanning || !qrInput.trim()}
                  style={{ width: "100%", padding: "10px", background: "#0B3D2E", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: scanning || !qrInput.trim() ? 0.5 : 1 }}>
                  {scanning ? "Verifying..." : "Verify Ticket"}
                </button>
              </form>

              {scanResult && (
                <div style={{ marginTop: 16, padding: 14, borderRadius: 8, background: scanResult.success ? "#E8F5EE" : "#fef2f2", border: `1px solid ${scanResult.success ? "#128C6B" : "#ef4444"}` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: scanResult.success ? "#0E7257" : "#b91c1c", marginBottom: 6 }}>
                    {scanResult.success ? "Valid Ticket" : "Invalid / Already Scanned"}
                  </div>
                  <p style={{ fontSize: 13, color: "#3A453E", margin: 0, lineHeight: 1.5 }}>{scanResult.message}</p>
                  {scanResult.success && scanResult.attendee && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #A7DDC4", fontSize: 12, color: "#4A5950" }}>
                      <div style={{ marginBottom: 3 }}><strong>Attendee:</strong> {scanResult.attendee.fullName || scanResult.attendee.email}</div>
                      <div style={{ marginBottom: 3 }}><strong>Tier:</strong> {scanResult.ticketType}</div>
                      {scanResult.quantity > 1 && <div><strong>Entries:</strong> x{scanResult.quantity}</div>}
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

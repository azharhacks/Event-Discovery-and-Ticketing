import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getMyTickets } from "../../lib/api";
import { ROUTES } from "../../config/routes";

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);

  useEffect(() => {
    getMyTickets()
      .then((res) => setTickets(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (qrToken, eventTitle) => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${qrToken}`;
    try {
      const res  = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `hafla-ticket-${(eventTitle || 'qr').replace(/\s+/g, '-').toLowerCase()}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      window.open(url, '_blank');
    }
  };

  const fmtDate = (ds) => {
    if (!ds) return "";
    const d = new Date(ds);
    return d.toLocaleString("en", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  const fmtPrice = (p) => (Number(p) === 0 ? "FREE" : "KES " + Number(p).toLocaleString());

  const statusStyle = (status) => {
    const m = { CONFIRMED: { bg: "transparent", color: "#A7DDC4" }, PENDING: { bg: "#fff", color: "#4F46E5" }, REFUNDED: { bg: "transparent", color: "rgba(255,255,255,0.5)" }, FAILED: { bg: "transparent", color: "#FCA5A5" } };
    return m[status] || { bg: "transparent", color: "rgba(255,255,255,0.5)" };
  };

  return (
    <>
      <Navbar />
      <div style={{ background: "linear-gradient(135deg,var(--primary) 0%,#0E5A43 100%)", padding: "40px 0" }}>
        <div className="container">
          <h1 style={{ color: "#fff", fontSize: "28px", fontWeight: 800 }}>My Tickets</h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", marginTop: "4px" }}>Your confirmed event tickets and QR codes</p>
        </div>
      </div>

      <div className="container" style={{ padding: "40px 24px 72px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "20px" }}>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: "200px", borderRadius: "16px" }}></div>)}
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, color: "#C9C2AC" }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                <path d="M13 5v14"/>
              </svg>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: "22px", marginBottom: "8px" }}>No Tickets Yet</h2>
            <p style={{ color: "var(--muted)", marginBottom: "28px" }}>You have not purchased any tickets. Browse events and grab yours!</p>
            <button className="btn btn-primary" onClick={() => navigate(ROUTES.EVENTS)}>Explore Events</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: "20px" }}>
            {tickets.map((order) => {
              const ev = order.ticket?.event;
              const ss = statusStyle(order.status);
              return (
                <div key={order.id} className="fade-up event-card" onClick={() => setActiveTicket(order)} style={{ overflow: "hidden", cursor: "pointer" }}>
                  <div style={{ background: "linear-gradient(135deg,var(--primary) 0%,#0E5A43 100%)", padding: "20px 22px" }}>
                    <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: ss.bg, color: ss.color, marginBottom: "8px" }}>{order.status}</div>
                    <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "16px", lineHeight: 1.3 }}>{ev?.title || "Event"}</h3>
                  </div>
                  <div style={{ borderTop: "2px dashed var(--border)", margin: "0 20px" }} />
                  <div style={{ padding: "16px 22px 20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                      {[["Date", fmtDate(ev?.eventDate)], ["Time", ev?.eventTime || "—"], ["Type", order.ticket?.ticketType], ["Paid", fmtPrice(order.totalAmount)]].map(([label, val]) => (
                        <div key={label}>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>{label}</div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: label === "Paid" ? "var(--accent)" : "var(--text)", marginTop: "4px" }}>{val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "var(--light)", borderRadius: "var(--radius-sm)", fontSize: "13px", color: "var(--muted)" }}>
                      Tap to view QR Code
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeTicket && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,41,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, backdropFilter: "blur(4px)", padding: "20px" }} onClick={(e) => e.target === e.currentTarget && setActiveTicket(null)}>
          <div style={{ background: "#fff", borderRadius: "var(--radius-xl)", padding: "36px", maxWidth: "420px", width: "100%", boxShadow: "var(--shadow-lg)", textAlign: "center", position: "relative" }}>
            <button onClick={() => setActiveTicket(null)} style={{ position: "absolute", top: 16, right: 16, background: "var(--light)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "18px" }}>×</button>
            <h3 style={{ fontWeight: 800, fontSize: "18px", color: "var(--primary)", marginBottom: "4px" }}>{activeTicket.ticket?.event?.title}</h3>
            <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "24px" }}>{fmtDate(activeTicket.ticket?.event?.eventDate)} · {activeTicket.ticket?.event?.eventTime}</p>
            {activeTicket.qrCode ? (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ background: "#fff", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px", display: "inline-block" }}>
                  <img src={"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + activeTicket.qrCode.qrToken} alt="Ticket QR Code" width="200" height="200" />
                </div>
                <div style={{ marginTop: "12px" }}>
                  <button
                    onClick={() => handleDownload(activeTicket.qrCode.qrToken, activeTicket.ticket?.event?.title)}
                    style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid var(--border)", background: "#fff", color: "var(--primary)", fontWeight: 600, fontSize: "13px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    ↓ Download QR Code
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: "var(--light)", border: "2px dashed var(--border)", borderRadius: "var(--radius-md)", padding: "40px", marginBottom: "20px", color: "var(--muted)", fontSize: "13px" }}>QR code appears once payment is confirmed.</div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", textAlign: "left", background: "var(--light)", borderRadius: "var(--radius-sm)", padding: "16px", marginBottom: "20px" }}>
              {[["Ticket Type", activeTicket.ticket?.ticketType, "var(--text)"], ["Quantity", "x" + activeTicket.quantity, "var(--text)"], ["Amount Paid", fmtPrice(activeTicket.totalAmount), "var(--accent)"], ["Status", activeTicket.status, statusStyle(activeTicket.status).color]].map(([label, val, color]) => (
                <div key={label}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color, marginTop: "4px" }}>{val}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>Present this QR code at the event entrance. Valid for one-time scan only.</p>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}

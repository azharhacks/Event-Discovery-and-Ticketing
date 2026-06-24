import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getCategories, createEvent } from "../../lib/api";
import { ROUTES } from "../../config/routes";

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: "", categoryId: "", description: "", venue: "",
    eventDate: "", eventTime: "", ticketPrice: "", capacity: "", bannerUrl: ""
  });

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data || [])).catch(console.error);
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const { title, categoryId, description, venue, eventDate, eventTime, ticketPrice, capacity } = form;
    if (!title || !categoryId || !description || !venue || !eventDate || !eventTime || !ticketPrice || !capacity) {
      setError("Please fill in all required fields.");
      return;
    }
    if (new Date(eventDate + "T" + eventTime) < new Date()) {
      setError("Event date and time must be in the future.");
      return;
    }
    setLoading(true);
    try {
      await createEvent({ ...form, ticketPrice: Number(ticketPrice), capacity: Number(capacity) });
      setSuccess(true);
      setTimeout(() => navigate(ROUTES.ORGANIZER), 2000);
    } catch (err) {
      setError(err.message || "Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  const field = {
    width: "100%", padding: "12px 14px", borderRadius: 8,
    border: "1.5px solid #e2e8f0", outline: "none", fontSize: 15,
    fontFamily: "inherit", background: "#fff", color: "#1e293b", boxSizing: "border-box"
  };
  const label = {
    fontSize: 12, fontWeight: 700, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8
  };
  const card = {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
    padding: 28, boxShadow: "0 1px 3px rgb(0 0 0 / 0.05)", marginBottom: 20
  };
  const cardTitle = { fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 20, marginTop: 0, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f8fafc" }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "40px 0" }}>
          <div className="container" style={{ maxWidth: 760 }}>
            <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>Create New Event</h1>
            <p style={{ color: "#94a3b8", marginTop: 6, margin: 0, fontSize: 14 }}>
              Fill in the event details. It will be reviewed by an admin before going live.
            </p>
          </div>
        </div>

        <div className="container" style={{ maxWidth: 760, padding: "36px 20px 80px" }}>
          {success ? (
            <div style={{ ...card, textAlign: "center", padding: "56px 32px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, color: "#10b981" }}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2 style={{ fontWeight: 800, fontSize: 22, color: "#0f172a", marginBottom: 8 }}>Event Submitted!</h2>
              <p style={{ color: "#64748b" }}>Your event is pending admin approval. Redirecting to your dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", color: "#ef4444", fontSize: 14, marginBottom: 20 }}>
                  {error}
                </div>
              )}

              {/* Basic Details */}
              <div style={card}>
                <h3 style={cardTitle}>Basic Details</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <label style={label}>Event Title *</label>
                    <input name="title" style={field} placeholder="e.g. Coastal Jazz Night 2025" value={form.title} onChange={handleChange} required />
                  </div>
                  <div>
                    <label style={label}>Category *</label>
                    <select name="categoryId" style={field} value={form.categoryId} onChange={handleChange} required>
                      <option value="">Select a category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={label}>Description *</label>
                    <textarea name="description" style={{ ...field, minHeight: 120, resize: "vertical" }}
                      placeholder="Describe your event — line-up, vibe, rules..." value={form.description} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              {/* Location & Schedule */}
              <div style={card}>
                <h3 style={cardTitle}>Location & Schedule</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <label style={label}>Venue *</label>
                    <input name="venue" style={field} placeholder="e.g. Fort Jesus Grounds, Mombasa" value={form.venue} onChange={handleChange} required />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={label}>Event Date *</label>
                      <input name="eventDate" type="date" style={field} value={form.eventDate} onChange={handleChange} required />
                    </div>
                    <div>
                      <label style={label}>Event Time *</label>
                      <input name="eventTime" type="time" style={field} value={form.eventTime} onChange={handleChange} required />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tickets & Capacity */}
              <div style={card}>
                <h3 style={cardTitle}>Tickets & Capacity</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={label}>Ticket Price (KES) *</label>
                      <input name="ticketPrice" type="number" min="0" style={field} placeholder="0 for FREE" value={form.ticketPrice} onChange={handleChange} required />
                    </div>
                    <div>
                      <label style={label}>Capacity *</label>
                      <input name="capacity" type="number" min="1" style={field} placeholder="e.g. 500" value={form.capacity} onChange={handleChange} required />
                    </div>
                  </div>
                  <div>
                    <label style={label}>Banner Image URL</label>
                    <input name="bannerUrl" type="url" style={field} placeholder="https://..." value={form.bannerUrl} onChange={handleChange} />
                    {form.bannerUrl && (
                      <div style={{ marginTop: 12, borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                        <img src={form.bannerUrl} alt="Banner preview" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
                          onError={(e) => (e.target.style.display = "none")} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 14 }}>
                <button type="button" onClick={() => navigate(ROUTES.ORGANIZER)}
                  style={{ padding: "12px 24px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex: 1, padding: "12px 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
                  {loading ? "Submitting..." : "Submit Event for Review"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

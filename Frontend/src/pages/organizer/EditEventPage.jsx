import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { getEvent, updateEvent, getCategories } from "../../lib/api";
import BannerUpload from "../../components/event/BannerUpload";
import { ROUTES } from "../../config/routes";

export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const [wasApproved, setWasApproved] = useState(false);
  const [form, setForm] = useState({
    title: "", categoryId: "", description: "", venue: "",
    eventDate: "", eventTime: "", ticketPrice: "", capacity: "", bannerUrl: "",
  });

  useEffect(() => {
    Promise.all([getEvent(id), getCategories()])
      .then(([evRes, catRes]) => {
        const ev = evRes.data;
        setWasApproved(ev.status === "APPROVED");
        setForm({
          title:       ev.title        || "",
          categoryId:  ev.category?.id || ev.categoryId || "",
          description: ev.description  || "",
          venue:       ev.venue        || "",
          eventDate:   ev.eventDate    ? new Date(ev.eventDate).toISOString().slice(0, 10) : "",
          eventTime:   ev.eventTime    || "",
          ticketPrice: ev.ticketPrice  != null ? String(ev.ticketPrice) : "",
          capacity:    ev.capacity     != null ? String(ev.capacity)    : "",
          bannerUrl:   ev.bannerUrl    || "",
        });
        setCategories(catRes.data || []);
      })
      .catch(() => setError("Failed to load event details."))
      .finally(() => setLoading(false));
  }, [id]);

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
    setSaving(true);
    try {
      await updateEvent(id, { ...form, ticketPrice: Number(form.ticketPrice), capacity: Number(form.capacity) });
      navigate(ROUTES.ORGANIZER);
    } catch (err) {
      setError(err.message || "Failed to update event.");
    } finally {
      setSaving(false);
    }
  };

  const field = {
    width: "100%", padding: "12px 14px", borderRadius: 8,
    border: "1.5px solid #E3DFD2", outline: "none", fontSize: 15,
    fontFamily: "inherit", background: "#fff", color: "#0E5A43", boxSizing: "border-box",
  };
  const lbl = {
    fontSize: 12, fontWeight: 700, color: "#66766C",
    textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8,
  };
  const card = {
    background: "#fff", border: "1px solid #E3DFD2", borderRadius: 12,
    padding: 28, boxShadow: "0 1px 3px rgb(0 0 0 / 0.05)", marginBottom: 20,
  };
  const cardTitle = {
    fontSize: 14, fontWeight: 700, color: "#0B3D2E", marginBottom: 20, marginTop: 0,
    borderBottom: "1px solid #F1EFE4", paddingBottom: 12,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#FAF8F3" }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <div style={{ background: "linear-gradient(135deg, #0B3D2E 0%, #0E5A43 100%)", padding: "40px 0" }}>
          <div className="container" style={{ maxWidth: 760 }}>
            <button onClick={() => navigate(ROUTES.ORGANIZER)}
              style={{ background: "none", border: "none", color: "#8A968D", cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 12, fontFamily: "inherit" }}>
              ← Back to Dashboard
            </button>
            <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>Edit Event</h1>
            <p style={{ color: "#8A968D", marginTop: 6, margin: 0, fontSize: 14 }}>
              Update your event details below.
            </p>
          </div>
        </div>

        <div className="container" style={{ maxWidth: 760, padding: "36px 20px 80px" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[200, 240, 180].map((h, i) => (
                <div key={i} className="skeleton" style={{ height: h, borderRadius: 12 }} />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {wasApproved && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 16px", color: "#92400e", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
                  <strong>Note:</strong> This event is currently <strong>APPROVED</strong>. Saving changes will reset it to <strong>PENDING</strong> for admin re-review before it goes live again.
                </div>
              )}

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", color: "#ef4444", fontSize: 14, marginBottom: 20 }}>
                  {error}
                </div>
              )}

              <div style={card}>
                <h3 style={cardTitle}>Basic Details</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <label style={lbl}>Event Title *</label>
                    <input name="title" style={field} value={form.title} onChange={handleChange} required />
                  </div>
                  <div>
                    <label style={lbl}>Category *</label>
                    <select name="categoryId" style={field} value={form.categoryId} onChange={handleChange} required>
                      <option value="">Select a category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Description *</label>
                    <textarea name="description" style={{ ...field, minHeight: 120, resize: "vertical" }}
                      value={form.description} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <div style={card}>
                <h3 style={cardTitle}>Location & Schedule</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <label style={lbl}>Venue *</label>
                    <input name="venue" style={field} value={form.venue} onChange={handleChange} required />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={lbl}>Event Date *</label>
                      <input name="eventDate" type="date" style={field} value={form.eventDate} onChange={handleChange} required />
                    </div>
                    <div>
                      <label style={lbl}>Event Time *</label>
                      <input name="eventTime" type="time" style={field} value={form.eventTime} onChange={handleChange} required />
                    </div>
                  </div>
                </div>
              </div>

              <div style={card}>
                <h3 style={cardTitle}>Tickets & Capacity</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={lbl}>Ticket Price (KES) *</label>
                      <input name="ticketPrice" type="number" min="0" style={field} value={form.ticketPrice} onChange={handleChange} required />
                    </div>
                    <div>
                      <label style={lbl}>Capacity *</label>
                      <input name="capacity" type="number" min="1" style={field} value={form.capacity} onChange={handleChange} required />
                    </div>
                  </div>
                  <BannerUpload
                    value={form.bannerUrl}
                    onChange={(url) => setForm((f) => ({ ...f, bannerUrl: url }))}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 14 }}>
                <button type="button" onClick={() => navigate(ROUTES.ORGANIZER)}
                  style={{ padding: "12px 24px", borderRadius: 8, border: "1.5px solid #E3DFD2", background: "#fff", color: "#4A5950", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, padding: "12px 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #0E5A43 0%, #0B3D2E 100%)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : "Save Changes"}
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

import { useEffect, useState } from "react";
import { Plus, Trash2, X, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import AppLayout from "../../components/Layout/AppLayout";
import api from "../../lib/api";
import styles from "./Calendar.module.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const emptyForm = { title: "", description: "", date: "", startTime: "09:00", endTime: "10:00", location: "" };

function ymd(date) {
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function Calendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(ymd(today));
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  function loadEvents() {
    api.get("/calendar")
      .then(({ data }) => { setEvents(data.events); setError(""); })
      .catch((err) => setError(err.response?.data?.message || "Could not load events"));
  }

  useEffect(() => { loadEvents(); }, []);

  const cells = buildMonthGrid(viewYear, viewMonth);

  function eventsOnDay(dateObj) {
    if (!events || !dateObj) return [];
    const key = ymd(dateObj);
    return events.filter((e) => e.startTime.slice(0, 10) === key);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function openFormForDate(dateKey) {
    setFormData({ ...emptyForm, date: dateKey });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) return;
    setSaving(true);
    setError("");
    try {
      const startTime = new Date(formData.date + "T" + formData.startTime + ":00").toISOString();
      const endTime = new Date(formData.date + "T" + formData.endTime + ":00").toISOString();
      await api.post("/calendar", {
        title: formData.title,
        description: formData.description,
        startTime,
        endTime,
        location: formData.location,
      });
      setFormData(emptyForm);
      setShowForm(false);
      loadEvents();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create event");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete("/calendar/" + id);
      loadEvents();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete event");
    } finally {
      setDeletingId(null);
    }
  }

  const selectedDateObj = new Date(selectedDate + "T00:00:00");
  const selectedEvents = events ? events.filter((e) => e.startTime.slice(0, 10) === selectedDate) : [];

  return (
    <AppLayout
      title="Calendar"
      subtitle="Meetings, calls, and everything scheduled"
      actions={
        <button className={styles.addBtn} onClick={() => openFormForDate(selectedDate)}>
          <Plus size={16} /> Add Event
        </button>
      }
    >
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.layout}>
        <div className={styles.calendarCard}>
          <div className={styles.calendarHeader}>
            <button onClick={prevMonth} aria-label="Previous month"><ChevronLeft size={18} /></button>
            <h3>{new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
            <button onClick={nextMonth} aria-label="Next month"><ChevronRight size={18} /></button>
          </div>

          <div className={styles.weekdayRow}>
            {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
          </div>

          <div className={styles.grid}>
            {cells.map((dateObj, i) => {
              if (!dateObj) return <div key={i} className={styles.emptyCell} />;
              const key = ymd(dateObj);
              const dayEvents = eventsOnDay(dateObj);
              const isToday = key === ymd(today);
              const isSelected = key === selectedDate;
              return (
                <button
                  key={i}
                  className={styles.dayCell + " " + (isSelected ? styles.daySelected : "") + " " + (isToday ? styles.dayToday : "")}
                  onClick={() => setSelectedDate(key)}
                >
                  <span>{dateObj.getDate()}</span>
                  {dayEvents.length > 0 && <div className={styles.dayDot} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.dayPanel}>
          <h3>{selectedDateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h3>

          {events === null ? (
            <div className={styles.empty}>Loading...</div>
          ) : selectedEvents.length === 0 ? (
            <div className={styles.empty}>No events on this day.</div>
          ) : (
            <div className={styles.eventList}>
              {selectedEvents.map((ev) => (
                <div key={ev.id} className={styles.eventItem}>
                  <div className={styles.eventBody}>
                    <div className={styles.eventTitle}>{ev.title}</div>
                    <div className={styles.eventMeta}>
                      <Clock size={12} />
                      {new Date(ev.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      {" \u2013 "}
                      {new Date(ev.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    {ev.location && (
                      <div className={styles.eventMeta}>
                        <MapPin size={12} /> {ev.location}
                      </div>
                    )}
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(ev.id)}
                    disabled={deletingId === ev.id}
                    aria-label="Delete event"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add Event</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Start time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>End time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={saving}>
                {saving ? "Saving..." : "Save Event"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

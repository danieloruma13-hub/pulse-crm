import { CalendarDays, Clock } from "lucide-react";
import styles from "./CalendarCard.module.css";

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function CalendarCard({ events }) {
  const list = events || [];

  return (
    <section className={styles.card}>

      <div className={styles.header}>

        <div>

          <h2>Today's Schedule</h2>

          <p>{events === undefined ? 'Loading...' : `${list.length} Upcoming Event${list.length === 1 ? '' : 's'}`}</p>

        </div>

        <CalendarDays size={22} />

      </div>

      <div className={styles.events}>

        {events !== undefined && list.length === 0 && (
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            No upcoming events. Schedule something from the Calendar page.
          </span>
        )}

        {list.map((event) => (

          <div
            key={event.id}
            className={styles.event}
          >

            <div className={styles.time}>

              <Clock size={15} />

              {formatTime(event.startTime)}

            </div>

            <div className={styles.info}>

              <h4>{event.title}</h4>

              <span>{event.location || 'Scheduled Event'}</span>

            </div>

          </div>

        ))}

      </div>

    </section>
  );
}

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Users, ListChecks, Loader2, Mail, History, X, Trash2 } from "lucide-react";
import AppLayout from "../../components/Layout/AppLayout";
import api from "../../lib/api";
import styles from "./AIAssistant.module.css";

const QUICK_ACTIONS = [
  { label: "Summarize my leads", icon: Users, endpoint: "/ai/summarize-leads", method: "get" },
  { label: "What should I do today?", icon: ListChecks, endpoint: "/ai/recommend-actions", method: "get" },
];

const GREETING = { role: "assistant", content: "Hi! I am your Pulse CRM assistant. Ask me anything about your leads, deals, or what to focus on today \u2014 or say something like 'send an email to Daniel Oruma' and I will write and send it to that contact." };

function parseEmail(text) {
  const match = text.match(/^Subject:\s*(.*?)\n+([\s\S]*)$/i);
  if (match) return { subject: match[1].trim(), body: match[2].trim() };
  return { subject: "(no subject)", body: text.trim() };
}

function findMentionedContact(message, contacts) {
  const lower = message.toLowerCase();
  const matches = contacts.filter((c) => lower.includes(c.name.toLowerCase()));
  return matches.length === 1 ? matches[0] : null;
}

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([GREETING]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const [showHistory, setShowHistory] = useState(false);
  const [historyMessages, setHistoryMessages] = useState(null);
  const [historyError, setHistoryError] = useState("");
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    api.get("/contacts?limit=100").then(({ data }) => setContacts(data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    api.get("/chat-history")
      .then(({ data }) => {
        if (data.messages && data.messages.length > 0) {
          setMessages([GREETING, ...data.messages.map((m) => ({ role: m.role, content: m.content }))]);
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function openHistory() {
    setShowHistory(true);
    setHistoryError("");
    setHistoryMessages(null);
    api.get("/chat-history")
      .then(({ data }) => setHistoryMessages(data.messages || []))
      .catch((err) => setHistoryError(err.response?.data?.message || "Could not load history"));
  }

  async function handleClearHistory() {
    setClearing(true);
    try {
      await api.delete("/chat-history");
      setHistoryMessages([]);
      setMessages([GREETING]);
    } catch (err) {
      setHistoryError(err.response?.data?.message || "Could not clear history");
    } finally {
      setClearing(false);
    }
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setError("");

    const mentionsEmail = /\bemail\b/i.test(text);
    const contact = mentionsEmail ? findMentionedContact(text, contacts) : null;

    try {
      if (contact && contact.email) {
        const { data } = await api.post("/ai/generate-email", { contactId: contact.id, tone: "professional", context: text });
        const parsed = parseEmail(data.email);

        const bodyHtml = "<p>" + parsed.body.replace(/\n/g, "</p><p>") + "</p>";
        const { data: campaignData } = await api.post("/campaigns", {
          name: "AI Email - " + contact.name,
          subject: parsed.subject,
          body: bodyHtml,
          recipientContactIds: [contact.id],
        });
        await api.post("/campaigns/" + campaignData.campaign.id + "/send");

        setMessages((prev) => [
          ...prev,
          { role: "assistant", isEmail: true, contactName: contact.name, contactEmail: contact.email, subject: parsed.subject, body: parsed.body },
        ]);
      } else if (contact && !contact.email) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: contact.name + " does not have an email address saved. Add one on the Contacts page, then try again." },
        ]);
      } else if (mentionsEmail && !contact) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I could not tell which contact you meant. Try naming them exactly as they appear in your Contacts list." },
        ]);
      } else {
        const { data } = await api.post("/ai/chat", { message: text });
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "The assistant could not respond. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function runQuickAction(action) {
    if (loading) return;
    setMessages((prev) => [...prev, { role: "user", content: action.label }]);
    setLoading(true);
    setError("");
    try {
      const { data } = await api[action.method](action.endpoint);
      const content = data.summary || data.recommendations || data.reply || "No response.";
      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch (err) {
      setError(err.response?.data?.message || "Could not complete that request.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <AppLayout
      title="AI Assistant"
      subtitle="Ask about your pipeline, get summaries, or send emails to contacts"
      actions={
        <button className={styles.historyBtn} onClick={openHistory}>
          <History size={16} /> Chat History
        </button>
      }
    >
      <div className={styles.quickActions}>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            className={styles.quickAction}
            onClick={() => runQuickAction(action)}
            disabled={loading}
          >
            <action.icon size={15} />
            {action.label}
          </button>
        ))}
      </div>

      <div className={styles.chatWindow}>
        <div className={styles.messages}>
          {!historyLoaded && <div style={{ color: "#64748b", fontSize: "0.82rem" }}>Loading conversation...</div>}

          {messages.map((msg, i) => (
            <div key={i} className={(msg.role === "user" ? styles.rowUser : styles.rowAssistant) + " " + styles.messageRow}>
              {msg.role === "assistant" && (
                <div className={styles.avatar}>
                  <Sparkles size={14} />
                </div>
              )}

              {msg.isEmail ? (
                <div className={styles.bubble + " " + styles.bubbleAssistant + " " + styles.emailBubble}>
                  <div className={styles.emailHeader}>
                    <Mail size={14} /> Sent to {msg.contactName}
                  </div>
                  <div className={styles.emailSubject}>{msg.subject}</div>
                  <div className={styles.emailBody}>{msg.body}</div>
                  <div className={styles.sentTag}>Delivered to {msg.contactEmail}</div>
                </div>
              ) : (
                <div className={styles.bubble + " " + (msg.role === "user" ? styles.bubbleUser : styles.bubbleAssistant)}>
                  {msg.content}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className={styles.messageRow + " " + styles.rowAssistant}>
              <div className={styles.avatar}>
                <Sparkles size={14} />
              </div>
              <div className={styles.bubble + " " + styles.bubbleAssistant + " " + styles.thinking}>
                <Loader2 size={14} className={styles.spinner} /> Writing and sending...
              </div>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <div ref={bottomRef} />
        </div>

        <form className={styles.inputBar} onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Ask about your leads, deals, or say send an email to a contact name..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} aria-label="Send">
            <Send size={17} />
          </button>
        </form>
      </div>

      {showHistory && (
        <div className={styles.modalOverlay} onClick={() => setShowHistory(false)}>
          <div className={styles.historyModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2><History size={18} /> Chat History</h2>
              <button onClick={() => setShowHistory(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {historyError && <div className={styles.error}>{historyError}</div>}

            <div className={styles.historyList}>
              {historyMessages === null ? (
                <div className={styles.historyEmpty}>Loading...</div>
              ) : historyMessages.length === 0 ? (
                <div className={styles.historyEmpty}>No conversation history yet.</div>
              ) : (
                historyMessages.map((m) => (
                  <div key={m.id} className={styles.historyItem}>
                    <div className={styles.historyItemHeader}>
                      <span className={styles.historyRole}>{m.role === "user" ? "You" : "Assistant"}</span>
                      <span className={styles.historyTime}>{formatTimestamp(m.createdAt)}</span>
                    </div>
                    <p className={styles.historyContent}>{m.content}</p>
                  </div>
                ))
              )}
            </div>

            {historyMessages && historyMessages.length > 0 && (
              <button className={styles.clearBtn} onClick={handleClearHistory} disabled={clearing}>
                <Trash2 size={14} /> {clearing ? "Clearing..." : "Clear All History"}
              </button>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

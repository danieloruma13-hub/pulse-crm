import { useEffect, useState } from "react";
import { Plus, Trash2, X, Sparkles, Share2, Camera, Hash, Briefcase } from "lucide-react";
import AppLayout from "../../components/Layout/AppLayout";
import api from "../../lib/api";
import styles from "./SocialMedia.module.css";

const PLATFORMS = ["facebook", "instagram", "x", "linkedin"];
const PLATFORM_ICONS = { facebook: Share2, instagram: Camera, x: Hash, linkedin: Briefcase };
const PLATFORM_LABELS = { facebook: "Facebook", instagram: "Instagram", x: "X (Twitter)", linkedin: "LinkedIn" };
const STATUS_LABELS = { draft: "Draft", scheduled: "Scheduled", posted: "Posted" };

const emptyForm = { platform: "facebook", topic: "", content: "" };

export default function SocialMedia() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  function loadPosts() {
    api.get("/social-posts")
      .then(({ data }) => { setPosts(data.posts); setError(""); })
      .catch((err) => setError(err.response?.data?.message || "Could not load posts"));
  }

  useEffect(() => { loadPosts(); }, []);

  async function handleGenerate() {
    if (!formData.topic.trim()) return;
    setGenerating(true);
    setError("");
    try {
      const { data } = await api.post("/social-posts/generate", { platform: formData.platform, topic: formData.topic });
      setFormData({ ...formData, content: data.content });
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate content");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.content.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/social-posts", { platform: formData.platform, content: formData.content, status: "draft" });
      setFormData(emptyForm);
      setShowForm(false);
      loadPosts();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save post");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPosted(post) {
    setUpdatingId(post.id);
    try {
      await api.patch("/social-posts/" + post.id, { status: "posted" });
      loadPosts();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update post");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete("/social-posts/" + id);
      loadPosts();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete post");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout
      title="Social Media"
      subtitle="Draft posts with AI, then copy them to post yourself"
      actions={
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
          <Plus size={16} /> New Post
        </button>
      }
    >
      <div className={styles.noticeBox}>
        Pulse CRM helps you write posts with AI, but does not auto-publish to Facebook, Instagram, X, or LinkedIn \u2014 each platform requires its own developer approval. Copy the drafted text and post it yourself, then mark it as posted here to keep track.
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {posts === null ? (
        <div className={styles.empty}>Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className={styles.empty}>No posts yet. Create your first one to get started.</div>
      ) : (
        <div className={styles.grid}>
          {posts.map((post) => {
            const Icon = PLATFORM_ICONS[post.platform];
            return (
              <div key={post.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.platformTag}>
                    <Icon size={14} /> {PLATFORM_LABELS[post.platform]}
                  </div>
                  <span className={styles.statusBadge + " " + styles["status_" + post.status]}>
                    {STATUS_LABELS[post.status]}
                  </span>
                </div>

                <p className={styles.cardContent}>{post.content}</p>

                <div className={styles.cardActions}>
                  {post.status !== "posted" && (
                    <button
                      className={styles.markBtn}
                      onClick={() => handleMarkPosted(post)}
                      disabled={updatingId === post.id}
                    >
                      Mark as Posted
                    </button>
                  )}
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(post.id)}
                    disabled={deletingId === post.id}
                    aria-label="Delete post"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>New Social Post</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Topic (for AI generation)</label>
                <div className={styles.topicRow}>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g. new feature launch, customer testimonial"
                  />
                  <button type="button" className={styles.generateBtn} onClick={handleGenerate} disabled={generating || !formData.topic.trim()}>
                    <Sparkles size={14} /> {generating ? "..." : "Generate"}
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <label>Post content *</label>
                <textarea
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your own, or generate with AI above"
                  required
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={saving}>
                {saving ? "Saving..." : "Save Draft"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

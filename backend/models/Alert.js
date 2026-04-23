const mongoose = require('mongoose');

// ── Note sub-document ─────────────────────────────────────────────────────────
// Each note is appended by an officer action (investigation opened, report filed, etc.)
const NoteSchema = new mongoose.Schema(
  {
    note: { type: String, required: true, trim: true, maxlength: 1000 },
    user: { type: String, default: 'System', trim: true, maxlength: 100 },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: true }
);

// ── Alert document ────────────────────────────────────────────────────────────
const AlertSchema = new mongoose.Schema(
  {
    videoName: {
      type: String,
      trim: true,
      default: 'Unknown Source'
    },

    behavior: {
      type: String,
      trim: true,
      default: 'Unclassified'
    },

    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true,
      default: 'Low'
    },

    status: {
      type: String,
      enum: ['Pending', 'Investigating', 'Verified', 'Reported', 'Resolved', 'False Alarm'],
      default: 'Pending'
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true       // index for fast time-sorted queries
    },

    videoPath: {
      type: String,     // Relative URL path to evidence clip, e.g. /uploads/...
      default: null
    },

    location: {
      lat: { type: Number, min: -90, max: 90 },
      lon: { type: Number, min: -180, max: 180 }
    },

    // ── Notes ───────────────────────────────────────────────────────────────
    // Appended by officers during investigation / report filing.
    // Previously relied on Mongoose's permissive mode (schema-less) — now explicit.
    notes: {
      type: [NoteSchema],
      default: []
    },

    // ── Soft-delete flag ────────────────────────────────────────────────────
    // When a CCTV user "clears history", records are hidden not deleted
    // so police can still access them.
    hiddenFromUser: {
      type: Boolean,
      default: false,
      index: true
    },

    // ── Legacy / metadata ───────────────────────────────────────────────────
    sourceDetails: {
      type: Object         // Optional extra metadata from ML pipeline
    }
  },
  {
    timestamps: true,      // adds createdAt + updatedAt automatically
    strict: true           // reject unknown fields — no more accidental schema-less writes
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
AlertSchema.index({ riskLevel: 1, timestamp: -1 });
AlertSchema.index({ status: 1 });

module.exports = mongoose.model('Alert', AlertSchema);

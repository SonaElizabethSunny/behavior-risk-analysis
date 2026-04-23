# 🐛 Known Bugs & Issues Tracker
## Sentinel AI - Behavior Risk Analysis System

---

## 🔴 CRITICAL BUGS (Fix Immediately)

### BUG-001: In-Memory Storage Data Loss
**Severity:** Critical  
**Priority:** P0  
**Status:** 🔴 Open  
**Affected Component:** Backend - Alert Controller  
**Location:** `backend/controllers/alertController.js`

**Description:**
When MongoDB is unavailable, the system falls back to in-memory storage. All data is lost when the server restarts.

**Impact:**
- Data loss on server restart
- Alerts not persisted
- Inconsistent data between restarts

**Steps to Reproduce:**
1. Start server without MongoDB
2. Create alerts
3. Restart server
4. Alerts are gone

**Fix:**
Remove in-memory fallback. Ensure MongoDB is always available or fail fast.

```javascript
// Remove this:
let inMemoryAlerts = [];

// Add this:
if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB connection required');
}
```

**Estimated Time:** 2 hours  
**Assigned To:** Backend Team

---

### BUG-002: XSS Vulnerability via localStorage
**Severity:** Critical  
**Priority:** P0  
**Status:** 🔴 Open  
**Affected Component:** Frontend - Authentication  
**Location:** `frontend/src/App.jsx`

**Description:**
JWT tokens are stored in localStorage, making them vulnerable to XSS attacks.

**Impact:**
- Security vulnerability
- Tokens can be stolen via XSS
- User sessions can be hijacked

**Fix:**
Use httpOnly cookies instead of localStorage.

```javascript
// Backend
res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
});

// Frontend - Remove localStorage
// Cookies sent automatically
```

**Estimated Time:** 4 hours  
**Assigned To:** Full Stack Team

---

### BUG-003: No Input Validation
**Severity:** Critical  
**Priority:** P0  
**Status:** 🔴 Open  
**Affected Component:** Backend - All API Endpoints  
**Location:** All route handlers

**Description:**
No validation on user inputs allows malicious data and can crash the server.

**Impact:**
- SQL/NoSQL injection vulnerability
- Server crashes on malformed input
- Data corruption

**Fix:**
Add express-validator to all endpoints.

```bash
npm install express-validator
```

**Estimated Time:** 8 hours  
**Assigned To:** Backend Team

---

### BUG-004: No Rate Limiting
**Severity:** Critical  
**Priority:** P0  
**Status:** 🔴 Open  
**Affected Component:** Backend - All Endpoints  
**Location:** `backend/server.js`

**Description:**
No rate limiting allows brute force attacks and DDoS.

**Impact:**
- Vulnerable to brute force
- Vulnerable to DDoS
- Server can be overwhelmed

**Fix:**
Add express-rate-limit.

```bash
npm install express-rate-limit
```

**Estimated Time:** 2 hours  
**Assigned To:** Backend Team

---

## 🟠 HIGH PRIORITY BUGS

### BUG-005: Debug Logs in Production
**Severity:** High  
**Priority:** P1  
**Status:** 🟡 In Progress  
**Affected Component:** Frontend - Pagination  
**Location:** `frontend/src/components/Pagination.jsx` (lines 15-20)

**Description:**
Console.log statements present in production code.

**Impact:**
- Performance degradation
- Exposes internal state
- Clutters browser console

**Fix:**
Remove or wrap in development check.

```javascript
if (process.env.NODE_ENV === 'development') {
    console.log('Debug info');
}
```

**Estimated Time:** 1 hour  
**Assigned To:** Frontend Team

---

### BUG-006: No Error Monitoring
**Severity:** High  
**Priority:** P1  
**Status:** 🔴 Open  
**Affected Component:** Backend & Frontend  
**Location:** All components

**Description:**
No error tracking or monitoring system in place.

**Impact:**
- Can't track production errors
- No visibility into issues
- Slow incident response

**Fix:**
Integrate Sentry or similar service.

```bash
npm install @sentry/node @sentry/react
```

**Estimated Time:** 4 hours  
**Assigned To:** DevOps Team

---

### BUG-007: Inefficient Polling
**Severity:** High  
**Priority:** P1  
**Status:** 🟡 Partially Fixed  
**Affected Component:** Frontend - Dashboard  
**Location:** `frontend/src/components/Dashboard.jsx` (line 206)

**Description:**
Dashboard polls every 30 seconds instead of using WebSocket.

**Impact:**
- Unnecessary network requests
- Increased server load
- Delayed updates
- Higher bandwidth usage

**Fix:**
Implement WebSocket for real-time updates.

**Note:** Already reduced from 2s to 30s, but WebSocket is better.

**Estimated Time:** 6 hours  
**Assigned To:** Full Stack Team

---

### BUG-008: No Database Indexes
**Severity:** High  
**Priority:** P1  
**Status:** 🔴 Open  
**Affected Component:** Backend - Database  
**Location:** `backend/models/Alert.js`

**Description:**
No indexes on frequently queried fields leads to slow queries.

**Impact:**
- Slow query performance
- High database load
- Poor scalability

**Fix:**
Add indexes to Alert model.

```javascript
AlertSchema.index({ timestamp: -1 });
AlertSchema.index({ riskLevel: 1, status: 1 });
AlertSchema.index({ status: 1 });
```

**Estimated Time:** 2 hours  
**Assigned To:** Backend Team

---

### BUG-009: No File Upload Validation
**Severity:** High  
**Priority:** P1  
**Status:** 🔴 Open  
**Affected Component:** Backend - File Upload  
**Location:** `backend/routes/alerts.js`

**Description:**
No validation on uploaded files (size, type, content).

**Impact:**
- Can upload malicious files
- Can upload huge files (DoS)
- Can upload non-video files

**Fix:**
Add multer validation.

```javascript
const upload = multer({
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: (req, file, cb) => {
        const allowed = ['video/mp4', 'video/avi'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});
```

**Estimated Time:** 3 hours  
**Assigned To:** Backend Team

---

## 🟡 MEDIUM PRIORITY BUGS

### BUG-010: No Error Boundaries
**Severity:** Medium  
**Priority:** P2  
**Status:** 🔴 Open  
**Affected Component:** Frontend - React  
**Location:** All components

**Description:**
No error boundaries to catch React rendering errors.

**Impact:**
- Blank page on errors
- Poor user experience
- No error recovery

**Fix:**
Add ErrorBoundary component.

**Estimated Time:** 2 hours  
**Assigned To:** Frontend Team

---

### BUG-011: Hardcoded API URLs
**Severity:** Medium  
**Priority:** P2  
**Status:** 🟢 Fixed  
**Affected Component:** Frontend - Dashboard  
**Location:** `frontend/src/components/Dashboard.jsx`

**Description:**
Some API URLs were hardcoded instead of using environment variables.

**Fix Applied:**
Replaced hardcoded URLs with environment variables.

**Fixed In:** Latest commit  
**Verified By:** Code review

---

### BUG-012: No Session Timeout
**Severity:** Medium  
**Priority:** P2  
**Status:** 🔴 Open  
**Affected Component:** Frontend - Authentication  
**Location:** `frontend/src/App.jsx`

**Description:**
User sessions never expire, even after long inactivity.

**Impact:**
- Security risk
- Stale sessions
- Potential unauthorized access

**Fix:**
Add 30-minute inactivity timeout.

**Estimated Time:** 3 hours  
**Assigned To:** Frontend Team

---

### BUG-013: Inconsistent Date Formatting
**Severity:** Medium  
**Priority:** P2  
**Status:** 🔴 Open  
**Affected Component:** Frontend - All date displays  
**Location:** Multiple components

**Description:**
Dates displayed in different formats across the app.

**Impact:**
- Inconsistent UX
- Confusion for users
- Unprofessional appearance

**Fix:**
Use date-fns for consistent formatting.

```bash
npm install date-fns
```

**Estimated Time:** 2 hours  
**Assigned To:** Frontend Team

---

### BUG-014: No Loading States
**Severity:** Medium  
**Priority:** P2  
**Status:** 🟡 Partially Fixed  
**Affected Component:** Frontend - All async operations  
**Location:** Multiple components

**Description:**
Some async operations don't show loading indicators.

**Impact:**
- Users don't know if action is processing
- Confusion and repeated clicks
- Poor UX

**Fix:**
Add loading states to all async operations.

**Note:** Dashboard has loading spinner, but other components need it.

**Estimated Time:** 4 hours  
**Assigned To:** Frontend Team

---

## 🔵 LOW PRIORITY BUGS

### BUG-015: No Keyboard Shortcuts
**Severity:** Low  
**Priority:** P3  
**Status:** 🔴 Open  
**Affected Component:** Frontend - All pages  
**Location:** N/A

**Description:**
No keyboard shortcuts for common actions.

**Impact:**
- Slower workflow for power users
- Reduced accessibility
- Less efficient navigation

**Suggested Shortcuts:**
- `Ctrl+K`: Search
- `Ctrl+R`: Refresh
- `Esc`: Close modals
- `?`: Show shortcuts help

**Estimated Time:** 6 hours  
**Assigned To:** Frontend Team

---

### BUG-016: No Dark Mode Toggle
**Severity:** Low  
**Priority:** P3  
**Status:** 🔴 Open  
**Affected Component:** Frontend - Theme  
**Location:** All components

**Description:**
App is always in dark mode, no light mode option.

**Impact:**
- Limited user preference
- Accessibility issue for some users
- Not following modern UX patterns

**Fix:**
Add theme toggle with localStorage persistence.

**Estimated Time:** 8 hours  
**Assigned To:** Frontend Team

---

### BUG-017: No Export Functionality
**Severity:** Low  
**Priority:** P3  
**Status:** 🔴 Open  
**Affected Component:** Frontend - Dashboard  
**Location:** `frontend/src/components/Dashboard.jsx`

**Description:**
Can't export alerts to CSV or PDF.

**Impact:**
- Can't generate reports
- Manual data extraction needed
- Reduced functionality

**Fix:**
Add export buttons with CSV/PDF generation.

**Estimated Time:** 6 hours  
**Assigned To:** Frontend Team

---

## 📊 Bug Statistics

```
Total Bugs: 17

By Severity:
🔴 Critical: 4 (24%)
🟠 High:     5 (29%)
🟡 Medium:   5 (29%)
🔵 Low:      3 (18%)

By Status:
🔴 Open:           14 (82%)
🟡 In Progress:     2 (12%)
🟢 Fixed:           1 (6%)

By Component:
Backend:   8 bugs
Frontend:  7 bugs
Full Stack: 2 bugs
```

---

## 🎯 Sprint Planning

### Sprint 1 (Week 1-2): Critical Bugs
- [ ] BUG-001: In-Memory Storage
- [ ] BUG-002: XSS Vulnerability
- [ ] BUG-003: Input Validation
- [ ] BUG-004: Rate Limiting

**Goal:** Fix all critical security issues

---

### Sprint 2 (Week 3-4): High Priority Bugs
- [ ] BUG-005: Debug Logs
- [ ] BUG-006: Error Monitoring
- [ ] BUG-007: Polling to WebSocket
- [ ] BUG-008: Database Indexes
- [ ] BUG-009: File Upload Validation

**Goal:** Improve performance and monitoring

---

### Sprint 3 (Week 5-6): Medium Priority Bugs
- [ ] BUG-010: Error Boundaries
- [ ] BUG-012: Session Timeout
- [ ] BUG-013: Date Formatting
- [ ] BUG-014: Loading States

**Goal:** Polish UX and stability

---

### Sprint 4 (Week 7-8): Low Priority Bugs
- [ ] BUG-015: Keyboard Shortcuts
- [ ] BUG-016: Dark Mode Toggle
- [ ] BUG-017: Export Functionality

**Goal:** Add nice-to-have features

---

## 🔄 Bug Reporting Template

When reporting new bugs, use this template:

```markdown
### BUG-XXX: [Short Description]
**Severity:** [Critical/High/Medium/Low]
**Priority:** [P0/P1/P2/P3]
**Status:** [Open/In Progress/Fixed]
**Affected Component:** [Component Name]
**Location:** [File path and line numbers]

**Description:**
[Detailed description of the bug]

**Impact:**
- [Impact point 1]
- [Impact point 2]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Fix:**
[Proposed solution]

**Estimated Time:** [Hours]
**Assigned To:** [Team/Person]
```

---

## 📝 Notes

- All critical bugs must be fixed before production
- High priority bugs should be fixed within 2 weeks
- Medium priority bugs can be addressed in later sprints
- Low priority bugs are nice-to-have improvements

**Last Updated:** 2026-02-16  
**Next Review:** Weekly on Mondays

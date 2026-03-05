/* ===== SquareBerry App — Main JavaScript ===== */

// ==================== SECURITY UTILITIES ====================

/**
 * Escape HTML to prevent XSS in template literals
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const s = String(str);
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return s.replace(/[&<>"']/g, c => map[c]);
}

/**
 * Sanitize user input — strip tags and limit length
 */
function sanitizeInput(str, maxLen = 500) {
  if (!str) return '';
  return String(str).replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

TEST_TRUNCATION_CHECK
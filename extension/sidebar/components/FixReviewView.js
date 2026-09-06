/**
 * Fix Review Component (Human-In-The-Loop Hub)
 * Aggregates all AI accessibility repair suggestions with Approve / Reject and bulk Approve All actions.
 */

import { fixService } from '../../services/fixService.js';

export function renderFixReviewView(container, state, setState, onNavigate) {
  let fixes = fixService.getAllFixes();

  function render() {
    fixes = fixService.getAllFixes();
    const pendingFixes = fixes.filter(f => f.status === 'pending');
    const appliedFixes = fixes.filter(f => f.status === 'applied');

    container.innerHTML = `
      <div class="view-panel fix-review-view animate-fade-in" id="panel-fix-review" role="region" aria-label="Fix Review Hub">
        
        <!-- Header Strip -->
        <div class="review-header-box">
          <div class="header-badge-row">
            <span class="human-loop-pill">🛡️ Human-In-The-Loop</span>
            <span class="pending-count-chip">${pendingFixes.length} കാത്തിരിക്കുന്നു (Pending)</span>
          </div>
          <h2 class="view-heading-ml">AI പരിഹാര അവലോകനം</h2>
          <p class="view-subheading-en">AI-generated fixes are never applied silently. Review and approve each repair proposal.</p>
        </div>

        <!-- Bulk Action Bar -->
        ${pendingFixes.length > 0 ? `
          <div class="bulk-actions-strip">
            <button class="btn-bulk-approve" id="btn-approve-all-fixes">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>എല്ലാം അംഗീകരിക്കുക (Approve All)</span>
            </button>
          </div>
        ` : ''}

        <!-- Pending Fixes List -->
        <div class="fixes-list-container" role="list">
          ${fixes.length === 0 ? `
            <div class="empty-state-box">
              <span class="empty-icon">✨</span>
              <p class="empty-title-ml">പരിഹാരങ്ങൾ ഒന്നും ബാക്കിയില്ല</p>
              <p class="empty-sub-en">No pending accessibility fixes found on this page.</p>
            </div>
          ` : fixes.map(fix => {
            const isApplied = fix.status === 'applied';
            const isRejected = fix.status === 'rejected';

            return `
              <div class="fix-card-item ${isApplied ? 'applied' : isRejected ? 'rejected' : 'pending'}" role="listitem">
                <div class="fix-item-top">
                  <div class="fix-category-tag">${fix.category}</div>
                  <div class="fix-confidence-badge">${fix.confidence}</div>
                </div>

                <h3 class="fix-title-text">${fix.title}</h3>
                <p class="fix-rule-tag">${fix.rule}</p>
                <p class="fix-proposed-desc">${fix.proposedChange}</p>

                <div class="fix-code-box">
                  <pre><code>${escapeHTML(fix.codeSnippet)}</code></pre>
                </div>

                <div class="fix-actions-footer">
                  ${isApplied ? `
                    <div class="fix-applied-pill">
                      <span class="check-mark">✓</span>
                      <span class="applied-label">Applied to Page (പ്രയോഗിച്ചു)</span>
                    </div>
                  ` : isRejected ? `
                    <div class="fix-rejected-pill">
                      <span>✕ നിരസിച്ചു (Rejected)</span>
                    </div>
                  ` : `
                    <div class="fix-decision-buttons">
                      <button class="btn-single-approve" data-fix-id="${fix.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>Approve</span>
                      </button>
                      <button class="btn-single-reject" data-fix-id="${fix.id}">
                        <span>Reject</span>
                      </button>
                    </div>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Back to Scan Link -->
        <div class="return-nav-link">
          <button class="btn-link-action" id="btn-back-to-scan">
            <span>← പരിശോധന പേജിലേക്ക് മടങ്ങുക (Back to Scan)</span>
          </button>
        </div>

      </div>
    `;

    attachEvents();
  }

  function escapeHTML(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function attachEvents() {
    // Approve All
    const approveAllBtn = container.querySelector('#btn-approve-all-fixes');
    if (approveAllBtn) {
      approveAllBtn.addEventListener('click', () => {
        fixService.approveAll();
        render();
      });
    }

    // Single Approve
    container.querySelectorAll('.btn-single-approve').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-fix-id');
        fixService.approveFix(id);
        render();
      });
    });

    // Single Reject
    container.querySelectorAll('.btn-single-reject').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-fix-id');
        fixService.rejectFix(id);
        render();
      });
    });

    // Back to Scan View
    const backToScanBtn = container.querySelector('#btn-back-to-scan');
    if (backToScanBtn) {
      backToScanBtn.addEventListener('click', () => {
        if (onNavigate) onNavigate('scan');
      });
    }
  }

  render();
}

/**
 * Admin Dashboard JavaScript
 * Handles sidebar navigation and toggle functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  // Sidebar navigation - handles data-section links (SPA-style navigation)
  document.querySelectorAll('.nav-link[data-section]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const section = this.dataset.section;

      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      this.classList.add('active');

      document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
      const target = document.getElementById('section-' + section);
      if (target) target.classList.add('active');

      // Close sidebar on mobile
      if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('sidebarOverlay').classList.remove('active');
      }
    });
  });

  // Handle regular nav-link clicks (navigate to other pages)
  document.querySelectorAll('.nav-link[href]').forEach(link => {
    // Skip links that have data-section (they're handled above)
    if (link.hasAttribute('data-section')) return;
    
    link.addEventListener('click', function(e) {
      // Let the default navigation happen - just close sidebar on mobile
      if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
      }
    });
  });

  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  function toggleSidebar() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  }

  sidebarToggle.addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', toggleSidebar);
});

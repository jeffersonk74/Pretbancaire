/* PrêtBancaire — Main JavaScript */

// Auto-dismiss alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function () {
  setTimeout(function () {
    document.querySelectorAll('.alert-dismissible').forEach(function (el) {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(el);
      bsAlert.close();
    });
  }, 5000);

  // Tooltip initialization
  const tooltipEls = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipEls.forEach(function (el) {
    new bootstrap.Tooltip(el);
  });
});

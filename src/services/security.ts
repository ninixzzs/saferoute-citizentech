/**
 * Sanitizes text inputs against XSS, inline scripts, and protocol injection.
 */
export function sanitizeUserInput(value: string, maxLength = 280): string {
  if (!value) return '';
  return value
    .replace(/\0/g, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .slice(0, maxLength);
}

/**
 * Installs production-only client hardening deterrents while preserving keyboard accessibility.
 */
export function installRuntimeHardening(): void {
  if (typeof window === 'undefined' || !import.meta.env.PROD) return;

  // Disable right-click inspection outside editable inputs
  document.addEventListener('contextmenu', (e) => {
    const target = e.target as HTMLElement | null;
    const isEditable =
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable);
    if (!isEditable) {
      e.preventDefault();
    }
  });

  // Deter common source-view / devtools shortcuts cleanly without affecting Tab/Enter/Esc/Arrows
  document.addEventListener('keydown', (e) => {
    const key = e.key.toUpperCase();
    const isInspectShortcut =
      key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (key === 'I' || key === 'J' || key === 'C')) ||
      (e.ctrlKey && key === 'U') ||
      (e.metaKey && e.altKey && (key === 'I' || key === 'J' || key === 'U'));

    if (isInspectShortcut) {
      e.preventDefault();
    }
  });
}

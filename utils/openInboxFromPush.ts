export function isInboxPushType(
  data?: Record<string, unknown> | null,
): boolean {
  const type = String(data?.type ?? "").toUpperCase();
  return type.includes("INBOX");
}

export function buildOpenInboxNotesScript(): string {
  return `(function(){try{window.dispatchEvent(new CustomEvent('GOSCA_OPEN_INBOX_NOTES',{detail:{tab:'inquiry'}}));}catch(e){}})();true;`;
}

export function buildRefreshInboxNotesScript(): string {
  return `(function(){try{window.dispatchEvent(new Event('GOSCA_INBOX_PUSH'));}catch(e){}})();true;`;
}

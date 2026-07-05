import { Injectable, signal } from '@angular/core';

/** Shared clipboard utility with graceful fallback and observable "copied" state. */
@Injectable({ providedIn: 'root' })
export class ClipboardService {
  /** Briefly true after a successful copy; components can display a checkmark. */
  readonly lastCopied = signal<string | null>(null);

  /**
   * Copy text to the system clipboard.
   * @returns true on success, false on failure.
   */
  async copy(text: string): Promise<boolean> {
    try {
      // Modern async clipboard API
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers / insecure contexts
        this.fallbackCopy(text);
      }
      this.lastCopied.set(text);
      // Reset after 2 s so the "copied" indicator disappears.
      setTimeout(() => {
        if (this.lastCopied() === text) this.lastCopied.set(null);
      }, 2000);
      return true;
    } catch {
      // clipboard writeText rejecting is silent — user needs feedback.
      this.lastCopied.set(null);
      return false;
    }
  }

  /** Clear the copied indicator immediately. */
  clear(): void {
    this.lastCopied.set(null);
  }

  /** execCommand fallback for older / insecure environments. */
  private fallbackCopy(text: string): void {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

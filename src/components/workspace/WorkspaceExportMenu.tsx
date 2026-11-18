import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Download, FileJson, FileSpreadsheet, Printer } from 'lucide-react';
import { Button } from '../ui/Button';

export function WorkspaceExportMenu({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-expanded={open}
        data-testid="workspace-export-btn"
        onClick={() => setOpen((v) => !v)}
      >
        <Download className="h-3.5 w-3.5" /> Export
      </Button>

      {open && (
        <div
          role="menu"
          data-testid="workspace-export-menu"
          onMouseLeave={() => setOpen(false)}
          className="absolute right-0 z-40 mt-1.5 w-56 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-1.5 text-xs shadow-lg"
        >
          <a
            role="menuitem"
            href={`/api/trips/${tripId}/export/ics`}
            download
            data-testid="export-ics-link"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 font-medium hover:bg-[var(--bg-muted)]"
          >
            <Calendar className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
            Calendar (.ics)
          </a>
          <a
            role="menuitem"
            href={`/api/trips/${tripId}/export/csv`}
            download
            data-testid="export-csv-link"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 font-medium hover:bg-[var(--bg-muted)]"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
            Expenses Ledger (.csv)
          </a>
          <a
            role="menuitem"
            href={`/api/trips/${tripId}/export/json`}
            download
            data-testid="export-json-link"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 font-medium hover:bg-[var(--bg-muted)]"
          >
            <FileJson className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
            Trip Backup (.json)
          </a>
          <Link
            role="menuitem"
            to={`/trips/${tripId}/print`}
            data-testid="export-print-link"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 font-medium hover:bg-[var(--bg-muted)]"
          >
            <Printer className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
            Print / Save PDF
          </Link>
        </div>
      )}
    </div>
  );
}

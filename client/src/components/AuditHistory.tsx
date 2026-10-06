import type { AuditLog } from '../types/task';
const f = (v: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(v),
  );
export function AuditHistory({ logs }: { logs: AuditLog[] }) {
  const latest = [...logs].slice(-5).reverse();
  return (
    <ol className="history">
      {latest.length === 0 ? (
        <li>No changes yet.</li>
      ) : (
        latest.map((log) => (
          <li key={log.id}>
            <strong>@{log.actor}</strong>{' '}
            {log.action === 'edited'
              ? (log.details ?? 'edited task details')
              : 'moved to ' + log.toStatusLabel}
            <time>{f(log.createdAt)}</time>
          </li>
        ))
      )}
    </ol>
  );
}

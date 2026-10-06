import type { Actor } from '../types/task';

interface ActorPickerProps {
  actors: Actor[];
  value: string;
  disabled?: boolean;
  onChange: (actorId: string) => void;
}
export function ActorPicker({ actors, value, disabled, onChange }: ActorPickerProps) {
  return (
    <fieldset className="actor-picker" disabled={disabled}>
      <label>Acting as</label>
      <p className="muted">Choose the person whose action will be recorded.</p>
      <div className="actor-options" role="radiogroup" aria-label="Acting as">
        {actors.map((actor) => (
          <button
            type="button"
            key={actor.id}
            role="radio"
            aria-checked={value === actor.id}
            className={value === actor.id ? 'actor selected' : 'actor'}
            onClick={() => onChange(actor.id)}
          >
            <span className="avatar" aria-hidden="true">
              {actor.displayName.slice(0, 1)}
            </span>
            <span>
              <strong>@{actor.handle}</strong>
              <small>{actor.displayName}</small>
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

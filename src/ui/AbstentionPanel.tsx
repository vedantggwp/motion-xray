import { copy } from '../copy/copy';

type Props = {
  onTryAccepted: () => void;
  reasonCodes?: string[];
};

export function AbstentionPanel({ onTryAccepted, reasonCodes = [] }: Props) {
  return (
    <section className="abstention" role="status" aria-live="polite">
      <h2 className="section-title">{copy.abstentionTitle}</h2>
      <p>{copy.abstentionBody}</p>
      {reasonCodes.length > 0 && (
        <p className="mono">
          {copy.reasonCodes}: {reasonCodes.join(', ')}
        </p>
      )}
      <p>{copy.abstentionHint}</p>
      <button type="button" className="btn primary" onClick={onTryAccepted}>
        {copy.actions.runBundled}
      </button>
    </section>
  );
}

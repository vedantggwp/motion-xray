import { copy } from '../copy/copy';

type Props = {
  onRealVideoProof: () => void;
  onStart: () => void;
  onOpenSources: () => void;
  disabled?: boolean;
};

export function Hero({ onRealVideoProof, onStart, onOpenSources, disabled }: Props) {
  return (
    <header className="hero">
      <p className="eyebrow">{copy.productName}</p>
      <h1 className="hero-headline">{copy.heroHeadline}</h1>
      <p className="hero-body">{copy.heroBody}</p>
      <div className="hero-actions">
        <button type="button" className="btn primary" onClick={onRealVideoProof} disabled={disabled}>
          {copy.actions.runRealVideoProof}
        </button>
        <button type="button" className="btn" onClick={onStart} disabled={disabled}>
          {copy.actions.runBundled}
        </button>
        <button type="button" className="btn ghost" onClick={onOpenSources} disabled={disabled}>
          {copy.actions.openSources}
        </button>
      </div>
      <p className="hero-helper">{copy.heroHelper}</p>
    </header>
  );
}

// Disclosure — progressive-disclosure wrapper for the results board.
//
// The board used to render nine-ish sub-panels (greedy-transition,
// human-baseline, swap-attempt, equity dial, placements, why-not, unmatched,
// regret, impact) fully expanded, all at once. That reads fine when someone
// is narrating a rehearsed script over it, but the standard this app is held
// to is a judge exploring it ALONE — and that much simultaneous surface area
// works against exactly that. This wraps the secondary panels (everything
// except the placements list, the equity dial, and the stability check —
// the three things a self-serve visitor needs immediately) behind a closed-
// by-default toggle with a one-line teaser, so the first screen is short and
// everything else is still one click away, not removed.

import { useState, type ReactNode } from 'react';

export function Disclosure({
  title,
  teaser,
  children,
  defaultOpen = false,
}: {
  title: string;
  teaser: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="disclosure">
      <button
        type="button"
        className="disclosure__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="disclosure__chevron" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
        <span className="disclosure__labels">
          <span className="disclosure__title">{title}</span>
          <span className="disclosure__teaser">{teaser}</span>
        </span>
      </button>
      {open ? <div className="disclosure__body">{children}</div> : null}
    </div>
  );
}

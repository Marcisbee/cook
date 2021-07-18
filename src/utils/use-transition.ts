import React from 'react';

export function useTransition(options?: number | KeyframeAnimationOptions) {
  const ref = React.useRef<HTMLElement>(null);
  const [] = React.useState();

  return [ref, (target: HTMLElement, reverse = false) => {
    const targetPosition = target.getBoundingClientRect();
    const selfPosition = ref.current!.getBoundingClientRect();

    if (!reverse) {
      ref.current?.animate([
        {
          transform: 'translate(0px, 0px)',
        },
        {
          transform: `translate(${targetPosition.x - selfPosition.x}px, ${targetPosition.y - selfPosition.y}px)`,
        },
      ], options);
      return;
    }

    ref.current?.animate([
      {
        transform: `translate(${targetPosition.x - selfPosition.x}px, ${targetPosition.y - selfPosition.y}px)`,
      },
      {
        transform: 'translate(0px, 0px)',
      },
    ], options);
  }] as const;
}

import React from 'react';

export function useTransition(options?: number | KeyframeAnimationOptions) {
  const ref = React.useRef<HTMLElement>(null);
  const [] = React.useState();

  return [ref, (target: HTMLElement) => {
    const targetPosition = target.getBoundingClientRect();
    const selfPosition = ref.current!.getBoundingClientRect();

    ref.current?.animate([
      {
        transform: 'translate(0px, 0px)',
      },
      {
        transform: `translate(${targetPosition.x + targetPosition.height - selfPosition.x}px, ${targetPosition.y + 10 - selfPosition.y}px)`,
      },
    ], options);
  }] as const;
}

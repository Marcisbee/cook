import React from 'react';

export function useTransition(
  keyframes: Keyframe[],
  options?: number | KeyframeAnimationOptions,
) {
  const ref = React.useRef<HTMLElement>(null);
  const [] = React.useState();

  return [ref, () => {
    console.log('start transition', ref.current);
    ref.current?.animate(keyframes, options);
  }] as const;
}

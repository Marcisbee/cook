import React from 'react';

import styles from './game-object.module.scss';

interface GameObjectProps {
  children?: React.ReactNode;
}

export function GameObject({ children }: GameObjectProps) {
  return (
    <span className={styles.gameObject}>
      {children}
    </span>
  );
}

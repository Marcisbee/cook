import React from 'react';

import styles from './grid.module.scss';

export function Grid({ children }) {
  return <div className={styles.grid}>{children}</div>;
}

import React from 'react';

import styles from './row.module.scss';

export function Row({ children }) {
  return <div className={styles.row}>{children}</div>;
}

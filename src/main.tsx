import { useStore } from 'exome/react';
import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';

import { store, scenes } from './store/store';

function Root() {
  const { scene } = useStore(store);
  const SceneComponent = scenes[scene];

  return (
    <div>
      <SceneComponent />
    </div>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
  document.getElementById('root')
)

import React from 'react';
import logo from './logo.svg';
import './App.css';
import World from './components/world';

function App() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: '100%'
    }}>
      <World/>
    </div>
  );
}

export default App;

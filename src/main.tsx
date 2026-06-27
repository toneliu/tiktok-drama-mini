import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 演示模式：强制重置用户状态（跳过登录
localStorage.removeItem('user-storage');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React from 'react';
import {createRoot} from 'react-dom/client';
import {HashRouter} from 'react-router-dom';
import './style.css';
import App from './App';
import 'antd/dist/antd.css';

const container = document.getElementById('root');

const root = createRoot(container);

root.render(
    <React.StrictMode>
        <HashRouter>
            <App/>
        </HashRouter>
    </React.StrictMode>
);

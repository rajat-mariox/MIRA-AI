// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App.tsx'
// import './index.css'

// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
// )

import "./lib/session"; // clears a stale mock token before the store reads localStorage
import { Provider } from "react-redux";

import { store } from "./app/store";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const render = () =>
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>,
  );

// VITE_USE_MOCK=true runs the panel on in-browser mock data (src/mocks/mockApi.ts). For `npm run dev`
// set it in .env.development.local (.env.local cannot override .env.development).
if (import.meta.env.VITE_USE_MOCK === "true") {
  import("./mocks/mockApi").then(({ installMockApi }) => {
    installMockApi();
    render();
  });
} else {
  render();
}

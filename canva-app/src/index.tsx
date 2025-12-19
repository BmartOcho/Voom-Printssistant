import React from "react";
import ReactDOM from "react-dom/client";

import "@canva/app-ui-kit/styles.css";
import { AppUiProvider } from "@canva/app-ui-kit";

import { App } from "./app";
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppUiProvider>
      <App />
    </AppUiProvider>
  </React.StrictMode>
);

import { AppUiProvider } from "@canva/app-ui-kit";
import { createRoot } from "react-dom/client";
import React from "react";
import { App } from "../../app";

export default {
  render: async () => {
    const root = createRoot(document.getElementById("root")!);
    root.render(
      <React.StrictMode>
        <AppUiProvider>
          <App />
        </AppUiProvider>
      </React.StrictMode>
    );
  },
};

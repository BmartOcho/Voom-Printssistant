import "@canva/app-ui-kit/styles.css";
import { AppUiProvider } from "@canva/app-ui-kit";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./styles/app.css";

// Log to help debug
console.log("Index.tsx loaded");

// Dynamically import to avoid immediate execution errors
import("@canva/intents/design").then(({ prepareDesignEditor }) => {
  console.log("prepareDesignEditor loaded:", prepareDesignEditor);
  
  prepareDesignEditor({
    render: async () => {
      console.log("Render function called");
      const rootElement = document.getElementById("root");
      if (!rootElement) {
        throw new Error("Unable to find element with id of 'root'");
      }

      const root = createRoot(rootElement);
      root.render(
        <AppUiProvider>
          <App />
        </AppUiProvider>
      );
    },
  });
}).catch((error) => {
  console.error("Error loading @canva/intents/design:", error);
});

import { createRoot } from "react-dom/client";
import { AppUiProvider } from "@canva/app-ui-kit";
import { App } from "../../app";
import type { DesignEditorIntent } from "@canva/intents/design";

const designEditorIntent: DesignEditorIntent = {
  render: async () => {
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
};

export default designEditorIntent;

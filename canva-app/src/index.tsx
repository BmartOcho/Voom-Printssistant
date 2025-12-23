import "@canva/app-ui-kit/styles.css";
import "./styles/app.css";
import { prepareDesignEditor } from "@canva/intents/design";
import designEditorIntent from "./intents/design_editor";

// Register the Design Editor intent with Canva
prepareDesignEditor(designEditorIntent);

import { prepareDesignEditor } from "@canva/intents/design";
import { prepareDataConnector } from "@canva/intents/data";
import designEditor from "./intents/design_editor";
import dataConnector from "./intents/data_connector";

prepareDesignEditor(designEditor);
prepareDataConnector(dataConnector);

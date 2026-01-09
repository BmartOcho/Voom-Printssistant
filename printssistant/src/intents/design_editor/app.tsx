/**
 * Printssistant - Prepress Assistant for Canva
 *
 * Multi-view application that guides users through print preparation:
 * - Welcome: Branding and introduction
 * - Template Browse: Browse and select templates from organization folders
 * - Main: Preflight checks, DPI analysis, and tips
 */

import { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Alert, Rows, Text } from "@canva/app-ui-kit";
import * as styles from "styles/components.css";

// Components
import { WelcomeView } from "../../components/WelcomeView";
import { MainView } from "../../components/MainView";
import { TemplateBrowser } from "../../components/TemplateBrowser";

// Data
import type { PrintJob } from "../../data/printJobs";

// Hooks
import { usePageContext } from "../../hooks/usePageContext";
import { useImageAnalysis } from "../../hooks/useImageAnalysis";

// Types
type AppView = "welcome" | "template-browse" | "main";

export const App = () => {
  // View navigation state
  const [view, setView] = useState<AppView>("welcome");

  // Selected print job (created from template)
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);

  // Completed check IDs
  const [completedChecks, setCompletedChecks] = useState<string[]>([]);

  // Get page context (design dimensions)
  const pageContext = usePageContext();

  // Image analysis hook
  const imageAnalysis = useImageAnalysis();

  // Navigation handlers
  const handleGetStarted = useCallback(() => {
    setView("template-browse");
  }, []);

  const handleBackToWelcome = useCallback(() => {
    setView("welcome");
  }, []);

  const handleChangeTemplate = useCallback(() => {
    setView("template-browse");
    setSelectedJob(null);
  }, []);

  const handleStartOver = useCallback(() => {
    setView("welcome");
    setSelectedJob(null);
    setCompletedChecks([]);
    imageAnalysis.clear();
  }, [imageAnalysis]);

  // Toggle check completion
  const handleToggleCheck = useCallback((id: string) => {
    setCompletedChecks((prev) => {
      if (prev.includes(id)) {
        return prev.filter((checkId) => checkId !== id);
      }
      return [...prev, id];
    });
  }, []);

  // Render appropriate view
  switch (view) {
    case "welcome":
      return <WelcomeView onGetStarted={handleGetStarted} />;

    case "template-browse":
      return (
        <TemplateBrowser
          onBack={handleBackToWelcome}
        />
      );

    case "main":
      if (!selectedJob) {
        // Safety fallback - shouldn't happen
        return (
          <div className={styles.scrollContainer}>
            <Rows spacing="2u">
              <Alert tone="critical">
                <Text>
                  <FormattedMessage
                    defaultMessage="No template selected. Please go back and select a template."
                    description="Error when no template is selected"
                  />
                </Text>
              </Alert>
            </Rows>
          </div>
        );
      }

      return (
        <MainView
          job={selectedJob}
          designWidthIn={pageContext.widthIn}
          designHeightIn={pageContext.heightIn}
          completedChecks={completedChecks}
          onToggleCheck={handleToggleCheck}
          onChangeJob={handleChangeTemplate}
          onStartOver={handleStartOver}
          imageAnalysis={imageAnalysis}
        />
      );

    default:
      return <WelcomeView onGetStarted={handleGetStarted} />;
  }
};

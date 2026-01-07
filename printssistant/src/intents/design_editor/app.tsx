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
import type { CanvaTemplate } from "@printssistant/shared";

// Hooks
import { usePageContext } from "../../hooks/usePageContext";
import { useImageAnalysis } from "../../hooks/useImageAnalysis";
import { useTemplateOperations } from "../../hooks/useTemplateOperations";

// Types
type AppView = "welcome" | "template-browse" | "main";

/**
 * Create a PrintJob from a selected template
 * Uses template dimensions converted from pixels to inches (assuming 72 DPI)
 */
function createJobFromTemplate(template: CanvaTemplate): PrintJob {
  // Convert pixels to inches (assuming 72 DPI for Canva templates)
  const widthIn = template.widthPx ? template.widthPx / 72 : 8.5;
  const heightIn = template.heightPx ? template.heightPx / 72 : 11;

  return {
    id: `template-${template.id}`,
    name: template.name,
    widthIn,
    heightIn,
    bleedIn: 0.125, // Standard bleed
    safeMarginIn: 0.125, // Standard safe margin
    category: "custom",
  };
}

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

  // Template operations hook
  const templateOps = useTemplateOperations();

  // Navigation handlers
  const handleGetStarted = useCallback(() => {
    setView("template-browse");
  }, []);

  const handleBackToWelcome = useCallback(() => {
    setView("welcome");
  }, []);

  const handleSelectTemplate = useCallback(
    async (template: CanvaTemplate) => {
      try {
        // Copy the template (never edit the original!)
        const { designId, editUrl } = await templateOps.copyTemplate(template);
        
        // Log the copy result (in production, you might redirect to editUrl)
        console.log(`Template copied successfully:`, { designId, editUrl });
        
        // Create a job from the template
        const job = createJobFromTemplate(template);
        setSelectedJob(job);
        
        // Navigate to main analysis view
        setView("main");
        pageContext.refresh();
        imageAnalysis.clear();
      } catch (err) {
        // Error is handled in the hook, just log here
        console.error("Failed to copy template:", err);
      }
    },
    [templateOps, pageContext, imageAnalysis]
  );

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
          onSelectTemplate={handleSelectTemplate}
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

/**
 * Printssistant - Prepress Assistant for Canva
 * 
 * Multi-view application that guides users through print preparation:
 * - Welcome: Branding and introduction
 * - Job Select: Choose print job type with size matching
 * - Main: Preflight checks, DPI analysis, and tips
 */

import { useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Alert, Rows, Text } from '@canva/app-ui-kit';
import * as styles from 'styles/components.css';

// Components
import { WelcomeView } from '../../components/WelcomeView';
import { JobSelector } from '../../components/JobSelector';
import { MainView } from '../../components/MainView';

// Data
import { PrintJob } from '../../data/printJobs';

// Hooks
import { usePageContext } from '../../hooks/usePageContext';
import { useImageAnalysis } from '../../hooks/useImageAnalysis';

// Types
type AppView = 'welcome' | 'job-select' | 'main';

export const App = () => {
  // View navigation state
  const [view, setView] = useState<AppView>('welcome');
  
  // Selected print job
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);
  
  // Completed check IDs
  const [completedChecks, setCompletedChecks] = useState<string[]>([]);

  // Get page context (design dimensions)
  const pageContext = usePageContext();

  // Image analysis hook
  const imageAnalysis = useImageAnalysis();

  // Navigation handlers
  const handleGetStarted = useCallback(() => {
    setView('job-select');
    pageContext.refresh(); // Refresh dimensions when entering job select
  }, [pageContext]);

  const handleSelectJob = useCallback((job: PrintJob) => {
    setSelectedJob(job);
    setView('main');
    imageAnalysis.clear(); // Clear any previous analysis
  }, [imageAnalysis]);

  const handleBack = useCallback(() => {
    setView('welcome');
  }, []);

  const handleChangeJob = useCallback(() => {
    setView('job-select');
    pageContext.refresh();
  }, [pageContext]);

  const handleStartOver = useCallback(() => {
    setView('welcome');
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
    case 'welcome':
      return <WelcomeView onGetStarted={handleGetStarted} />;

    case 'job-select':
      return (
        <JobSelector
          designWidthIn={pageContext.widthIn}
          designHeightIn={pageContext.heightIn}
          loading={pageContext.loading}
          onSelectJob={handleSelectJob}
          onBack={handleBack}
          onRefresh={pageContext.refresh}
        />
      );

    case 'main':
      if (!selectedJob) {
        // Safety fallback - shouldn't happen
        return (
          <div className={styles.scrollContainer}>
            <Rows spacing="2u">
              <Alert tone="critical">
                <Text>
                  <FormattedMessage
                    defaultMessage="No job selected. Please go back and select a job."
                    description="Error when no job is selected"
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
          onChangeJob={handleChangeJob}
          onStartOver={handleStartOver}
          imageAnalysis={imageAnalysis}
        />
      );

    default:
      return <WelcomeView onGetStarted={handleGetStarted} />;
  }
};

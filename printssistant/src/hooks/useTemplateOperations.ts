import { useState, useCallback } from "react";
import type { CanvaTemplate } from "@printssistant/shared";
import { requestOpenExternalUrl } from "@canva/platform";

interface UseTemplateOperationsResult {
  selectedTemplate: CanvaTemplate | null;
  isLoading: boolean;
  error: string | null;
  copyTemplate: (template: CanvaTemplate) => Promise<void>;
}

/**
 * Hook for managing template operations
 * Opens brand templates in Canva using their create URLs
 * 
 * Note: Canva's API doesn't support adding brand template pages to an existing design programmatically.
 * Templates must be opened in a new context per Canva's design.
 */
export const useTemplateOperations = (): UseTemplateOperationsResult => {
  const [selectedTemplate, setSelectedTemplate] = useState<CanvaTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyTemplate = useCallback(async (template: CanvaTemplate) => {
    setIsLoading(true);
    setError(null);

    try {
      // Store the selected template
      setSelectedTemplate(template);
      
      // Generate the template's create URL
      const createUrl = `https://www.canva.com/design?create=true&template=${template.id}`;
      
      // Request to open the URL using Canva's platform API
      // This will open in a new context as required by Canva's security model
      await requestOpenExternalUrl({
        url: createUrl,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to open template";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    selectedTemplate,
    isLoading,
    error,
    copyTemplate,
  };
};

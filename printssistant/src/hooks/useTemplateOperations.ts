import { useState, useCallback } from "react";
import type { CanvaTemplate } from "@printssistant/shared";
import { requestOpenExternalUrl } from "@canva/platform";

interface UseTemplateOperationsResult {
  selectedTemplate: CanvaTemplate | null;
  isLoading: boolean;
  error: string | null;
  copyTemplate: (template: CanvaTemplate) => Promise<{ designId: string; editUrl: string }>;
}

/**
 * Hook for managing template operations
 * Opens shared template links for remixing/creating new designs
 * 
 * For shared templates (public view links), this opens a create URL
 * that tells Canva to create a new design from the template.
 */
export const useTemplateOperations = (): UseTemplateOperationsResult => {
  const [selectedTemplate, setSelectedTemplate] = useState<CanvaTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyTemplate = useCallback(async (template: CanvaTemplate): Promise<{ designId: string; editUrl: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      // Store the selected template
      setSelectedTemplate(template);
      
      // For shared templates, construct a create URL
      // This tells Canva to create a new design from the template
      const createUrl = `https://www.canva.com/design?create=true&template=${template.id}`;
      
      console.log(`Opening template for creation: ${createUrl}`);
      
      // Open the URL using Canva's platform API
      // This will open in a new tab/window where the user can edit the copy
      await requestOpenExternalUrl({
        url: createUrl,
      });
      
      // Since we're using shared templates (not API-based copying),
      // we can't get the actual designId/editUrl of the new design.
      // Return placeholder values.
      return {
        designId: `template-${template.id}`,
        editUrl: createUrl,
      };
      
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

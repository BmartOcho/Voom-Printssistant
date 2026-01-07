/**
 * Hook for managing Canva template operations
 * Handles template selection and preparation
 */

import { useState, useCallback } from "react";
import type { CanvaTemplate } from "@printssistant/shared";

interface UseTemplateOperationsResult {
  selectTemplate: (template: CanvaTemplate) => Promise<void>;
  selectedTemplate: CanvaTemplate | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook to manage template operations
 * 
 * Note: In production, this would integrate with Canva Connect API to:
 * 1. Copy the template design
 * 2. Open the copied design in the editor
 * 
 * For MVP, we track the selected template for future integration.
 */
export const useTemplateOperations = (): UseTemplateOperationsResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CanvaTemplate | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Select a template for use
   * 
   * In production, this would:
   * 1. Call backend endpoint: POST /api/templates/{templateId}/copy
   * 2. Backend would use Canva Connect API to duplicate the template
   * 3. Return the new design ID
   * 4. User would be redirected to edit the new design
   * 
   * For MVP, we just store the selection.
   */
  const selectTemplate = useCallback(
    async (template: CanvaTemplate) => {
      setLoading(true);
      setError(null);

      try {
        // Store the selected template
        setSelectedTemplate(template);
        
        // In production, you would:
        // const backendHost = process.env.CANVA_BACKEND_HOST || "http://localhost:8787";
        // const response = await fetch(`${backendHost}/api/templates/${template.id}/copy`, {
        //   method: 'POST'
        // });
        // const { designId, editUrl } = await response.json();
        // 
        // Then redirect user to the edit URL or use deep linking
        
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to select template";
        setError(errorMessage);
        console.error("Template operation error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    selectTemplate,
    selectedTemplate,
    loading,
    error,
    clearError,
  };
};


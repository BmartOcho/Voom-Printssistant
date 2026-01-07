/**
 * Hook for managing Canva template operations
 * Handles template copying via backend API
 */

import { useState, useCallback } from "react";
import type { CanvaTemplate } from "@printssistant/shared";

interface UseTemplateOperationsResult {
  copyTemplate: (template: CanvaTemplate) => Promise<{ designId: string; editUrl: string }>;
  selectedTemplate: CanvaTemplate | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook to manage template operations
 * 
 * Copies templates via Canva Connect API to ensure originals are never edited
 */
export const useTemplateOperations = (): UseTemplateOperationsResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CanvaTemplate | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Copy a template via backend API
   * 
   * In production, this calls Canva Connect API to duplicate the template.
   * Returns the new design ID and edit URL.
   */
  const copyTemplate = useCallback(
    async (template: CanvaTemplate): Promise<{ designId: string; editUrl: string }> => {
      setLoading(true);
      setError(null);

      try {
        // Store the selected template
        setSelectedTemplate(template);
        
        // Call backend to copy the template
        const backendHost = process.env.CANVA_BACKEND_HOST || "http://localhost:8787";
        const response = await fetch(`${backendHost}/api/templates/${template.id}/copy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to copy template: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.designId) {
          throw new Error(data.error || 'Failed to copy template');
        }

        return {
          designId: data.designId,
          editUrl: data.editUrl,
        };
        
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to copy template";
        setError(errorMessage);
        console.error("Template copy error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    copyTemplate,
    selectedTemplate,
    loading,
    error,
    clearError,
  };
};


/**
 * Template Browser Component
 * Displays organization brand templates for users to select
 */

import { useState, useEffect, useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  Button,
  ImageCard,
  LoadingIndicator,
  Rows,
  Text,
  Title,
} from "@canva/app-ui-kit";
import type { CanvaTemplate } from "@printssistant/shared";
import * as styles from "styles/components.css";

interface BrandTemplate {
  id: string;
  title: string;
  view_url: string;
  create_url: string;
  thumbnail?: {
    width: number;
    height: number;
    url: string;
  };
  created_at?: number;
  updated_at?: number;
}

interface TemplateBrowserProps {
  onSelectTemplate: (template: CanvaTemplate) => void;
  onBack: () => void;
}

export const TemplateBrowser = ({
  onSelectTemplate,
  onBack,
}: TemplateBrowserProps) => {
  const intl = useIntl();
  const [templates, setTemplates] = useState<BrandTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch brand templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use global BACKEND_HOST injected by Webpack
      const backendHost = typeof BACKEND_HOST !== 'undefined' ? BACKEND_HOST : "http://localhost:8787";
      const response = await fetch(`${backendHost}/api/brand-templates`);
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`);
      }
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load templates"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTemplateClick = useCallback(
    (template: BrandTemplate) => {
      // Convert brand template to CanvaTemplate format
      const canvaTemplate: CanvaTemplate = {
        id: template.id,
        name: template.title,
        folderId: "brand-templates",
        thumbnailUrl: template.thumbnail?.url,
        widthPx: template.thumbnail?.width || 800,
        heightPx: template.thumbnail?.height || 600,
        createdAt: template.created_at
          ? new Date(template.created_at * 1000).toISOString()
          : new Date().toISOString(),
        updatedAt: template.updated_at
          ? new Date(template.updated_at * 1000).toISOString()
          : new Date().toISOString(),
      };
      onSelectTemplate(canvaTemplate);
    },
    [onSelectTemplate]
  );

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        {/* Header */}
        <Rows spacing="1u">
          <Title size="medium">
            <FormattedMessage
              defaultMessage="Browse Templates"
              description="Template browser title"
            />
          </Title>
          <Text>
            <FormattedMessage
              defaultMessage="Select a template to get started"
              description="Template browser subtitle"
            />
          </Text>
        </Rows>

        {/* Error Alert */}
        {error && (
          <Alert tone="critical">
            <Text>{error}</Text>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Rows spacing="1u" align="center">
            <LoadingIndicator size="medium" />
            <Text>
              <FormattedMessage
                defaultMessage="Loading templates..."
                description="Loading templates message"
              />
            </Text>
          </Rows>
        )}

        {/* Templates List */}
        {!loading && templates.length > 0 && (
          <Rows spacing="1u">
            {templates.map((template) => (
              <div
                key={template.id}
                style={{
                  padding: "12px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={() => handleTemplateClick(template)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleTemplateClick(template);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <Rows spacing="1u">
                  {template.thumbnail && (
                    <ImageCard
                      alt={template.title}
                      ariaLabel={template.title}
                      thumbnailUrl={template.thumbnail.url}
                      onDragStart={() => {
                        // Drag handler
                      }}
                    />
                  )}
                  <Text size="medium" tone="primary">
                    {template.title}
                  </Text>
                </Rows>
              </div>
            ))}
          </Rows>
        )}

        {/* Empty State */}
        {!loading && templates.length === 0 && !error && (
          <Alert tone="info">
            <Text>
              <FormattedMessage
                defaultMessage="No templates available"
                description="Empty templates message"
              />
            </Text>
          </Alert>
        )}

        {/* Actions */}
        <Button variant="secondary" onClick={onBack}>
          {intl.formatMessage({
            defaultMessage: "Back",
            description: "Back button",
          })}
        </Button>
      </Rows>
    </div>
  );
};

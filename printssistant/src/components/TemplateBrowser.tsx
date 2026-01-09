/**
 * Template Browser Component
 * Displays organization templates for users to select
 */

import { useState, useEffect, useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  Button,
  LoadingIndicator,
  Rows,
  Text,
  Title,
} from "@canva/app-ui-kit";
import type { CanvaTemplate } from "@printssistant/shared";
import * as styles from "styles/components.css";

interface Template {
  id: string;
  name: string;
  url: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateBrowserProps {
  onSelectTemplate: (template: CanvaTemplate) => void;
  onBack: () => void;
}

/**
 * Extract Canva design ID from URL
 * URL format: https://www.canva.com/design/DAGPQ1Ic0tA/...
 */
function extractCanvaDesignId(url: string): string | undefined {
  const match = url.match(/\/design\/([^/?]+)/);
  return match ? match[1] : undefined;
}

export const TemplateBrowser = ({
  onSelectTemplate,
  onBack,
}: TemplateBrowserProps) => {
  const intl = useIntl();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use global BACKEND_HOST injected by Webpack
      const backendHost = typeof BACKEND_HOST !== 'undefined' ? BACKEND_HOST : "http://localhost:8787";
      const response = await fetch(`${backendHost}/api/canva-templates`);
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

  // Group templates by category
  const categories = Array.from(new Set(templates.map(t => t.category)));
  const filteredTemplates = selectedCategory === "all" 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handleTemplateClick = (template: Template) => {
    // Extract Canva design ID from URL
    const canvaDesignId = extractCanvaDesignId(template.url);
    
    if (!canvaDesignId) {
      setError(intl.formatMessage({
        defaultMessage: "Invalid template URL",
        description: "Error message when template URL cannot be parsed"
      }));
      return;
    }
    
    // Convert to CanvaTemplate format
    const canvaTemplate: CanvaTemplate = {
      id: canvaDesignId, // Use extracted Canva design ID
      name: template.name,
      folderId: template.category,
      thumbnailUrl: undefined,
      widthPx: undefined,
      heightPx: undefined,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
    onSelectTemplate(canvaTemplate);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingIndicator />
        <Text>
          <FormattedMessage
            defaultMessage="Loading templates..."
            description="Loading message shown while fetching templates"
          />
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Alert tone="critical">{error}</Alert>
        <Button variant="secondary" onClick={onBack}>
          {intl.formatMessage({
            defaultMessage: "Go Back",
            description: "Button to go back from error state"
          })}
        </Button>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className={styles.container}>
        <Alert tone="info">
          {intl.formatMessage({
            defaultMessage: "No templates available. Please add templates via the admin panel.",
            description: "Message shown when no templates are available"
          })}
        </Alert>
        <Button variant="secondary" onClick={onBack}>
          {intl.formatMessage({
            defaultMessage: "Go Back",
            description: "Button to go back when no templates"
          })}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Rows spacing="2u">
        <Title size="medium">
          <FormattedMessage
            defaultMessage="Select a Template"
            description="Title for template selection screen"
          />
        </Title>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Button
              variant={selectedCategory === "all" ? "primary" : "secondary"}
              onClick={() => setSelectedCategory("all")}
            >
              {intl.formatMessage({
                defaultMessage: "All",
                description: "Button to show all template categories"
              })}
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "primary" : "secondary"}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}

        {/* Template Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              style={{
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                padding: "1rem",
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
              <Text size="medium">
                <strong>{template.name}</strong>
              </Text>
              <Text size="small" tone="secondary">
                {template.category}
              </Text>
            </div>
          ))}
        </div>

        <Button variant="secondary" onClick={onBack}>
          {intl.formatMessage({
            defaultMessage: "Back",
            description: "Button to go back to previous screen"
          })}
        </Button>
      </Rows>
    </div>
  );
};

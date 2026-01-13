/**
 * Template Browser Component
 * Displays organization templates organized by categories
 */

import { useState, useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Button,
  Rows,
  Title,
  Text,
  LoadingIndicator,
  Alert,
  Columns,
  Column,
  ImageCard,
} from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import * as styles from "styles/components.css";

// Global variable injected by Webpack
declare const BACKEND_HOST: string;

interface TemplateBrowserProps {
  onBack: () => void;
}

interface Template {
  id: string;
  name: string;
  url: string;
  category: string;
  categoryImage?: string;
}

interface CategoryInfo {
  name: string;
  imageUrl?: string;
  templateCount: number;
}

export const TemplateBrowser = ({
  onBack,
}: TemplateBrowserProps) => {
  const intl = useIntl();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    // Fetch templates from backend
    fetch(`${BACKEND_HOST}/api/canva-templates`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load templates');
        }
        return res.json();
      })
      .then((data) => {
        setTemplates(data);
        setError(null);
      })
      .catch(() => {
        setError('Unable to load templates');
        setTemplates([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleOpenTemplate = async (templateUrl: string) => {
    try {
      await requestOpenExternalUrl({ url: templateUrl });
    } catch {
      // Error handled silently; user will see no action if it fails
    }
  };

  // Group templates by category
  const getCategoryInfo = (): CategoryInfo[] => {
    const categoryMap = new Map<string, CategoryInfo>();
    
    templates.forEach((template) => {
      const existing = categoryMap.get(template.category);
      if (existing) {
        existing.templateCount++;
        // Use the first template's image if available
        if (!existing.imageUrl && template.categoryImage) {
          existing.imageUrl = template.categoryImage;
        }
      } else {
        categoryMap.set(template.category, {
          name: template.category,
          imageUrl: template.categoryImage,
          templateCount: 1,
        });
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  };

  const getTemplatesForCategory = (category: string): Template[] => {
    return templates.filter((t) => t.category === category);
  };

  // Show category selection view
  if (!selectedCategory) {
    const categories = getCategoryInfo();

    return (
      <div className={styles.scrollContainer}>
        <Rows spacing="2u">
          <Title size="medium">
            <FormattedMessage
              defaultMessage="Select a Category"
              description="Title for category selection screen"
            />
          </Title>

          {loading && (
            <Rows spacing="1u" align="center">
              <LoadingIndicator size="medium" />
              <Text>
                <FormattedMessage
                  defaultMessage="Loading templates..."
                  description="Loading message for templates"
                />
              </Text>
            </Rows>
          )}

          {error && (
            <Alert tone="critical">
              <Text>{error}</Text>
            </Alert>
          )}

          {!loading && !error && templates.length === 0 && (
            <Alert tone="info">
              <Text>
                <FormattedMessage
                  defaultMessage="No templates available. Contact your administrator to add templates."
                  description="Message when no templates are available"
                />
              </Text>
            </Alert>
          )}

          {!loading && categories.length > 0 && (
            <Rows spacing="1u">
              {categories.map((category) => (
                <div
                  key={category.name}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setSelectedCategory(category.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedCategory(category.name);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <Rows spacing="0">
                    {category.imageUrl && (
                      <ImageCard
                        alt={category.name}
                        ariaLabel={category.name}
                        thumbnailUrl={category.imageUrl}
                        onClick={() => setSelectedCategory(category.name)}
                      />
                    )}
                    <div style={{ padding: '12px' }}>
                      <Columns spacing="1u" alignY="center">
                        <Column width="fluid">
                          <Text size="medium" tone="primary">
                            {category.name}
                          </Text>
                        </Column>
                        <Column width="content">
                          <Text size="small" tone="tertiary">
                            <FormattedMessage
                              defaultMessage="{count} {count, plural, one {template} other {templates}}"
                              description="Template count in category"
                              values={{ count: category.templateCount }}
                            />
                          </Text>
                        </Column>
                      </Columns>
                    </div>
                  </Rows>
                </div>
              ))}
            </Rows>
          )}

          <Button variant="secondary" onClick={onBack}>
            {intl.formatMessage({
              defaultMessage: "Back",
              description: "Button to go back to previous screen"
            })}
          </Button>
        </Rows>
      </div>
    );
  }

  // Show templates within selected category
  const categoryTemplates = getTemplatesForCategory(selectedCategory);

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Title size="medium">
          {selectedCategory}
        </Title>

        <Text tone="tertiary">
          <FormattedMessage
            defaultMessage="Select a template to open in Canva"
            description="Subtitle for template selection"
          />
        </Text>

        {categoryTemplates.length > 0 && (
          <Rows spacing="1u">
            {categoryTemplates.map((template) => (
              <Button
                key={template.id}
                variant="primary"
                onClick={() => handleOpenTemplate(template.url)}
                stretch
              >
                {template.name}
              </Button>
            ))}
          </Rows>
        )}

        <Columns spacing="1u">
          <Column width="fluid">
            <Button 
              variant="secondary" 
              onClick={() => setSelectedCategory(null)}
              stretch
            >
              {intl.formatMessage({
                defaultMessage: "Back to Categories",
                description: "Button to go back to category selection"
              })}
            </Button>
          </Column>
          <Column width="fluid">
            <Button 
              variant="secondary" 
              onClick={onBack}
              stretch
            >
              {intl.formatMessage({
                defaultMessage: "Exit",
                description: "Button to exit template browser"
              })}
            </Button>
          </Column>
        </Columns>
      </Rows>
    </div>
  );
};

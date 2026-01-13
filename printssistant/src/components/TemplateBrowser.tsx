/**
 * Template Browser Component
 * Displays organization templates for users to select
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
}

export const TemplateBrowser = ({
  onBack,
}: TemplateBrowserProps) => {
  const intl = useIntl();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className={styles.container}>
      <Rows spacing="2u">
        <Title size="medium">
          <FormattedMessage
            defaultMessage="Select a Template"
            description="Title for template selection screen"
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

        {!loading && templates.length > 0 && (
          <>
            {templates.map((template) => (
              <Button
                key={template.id}
                variant="primary"
                onClick={() => handleOpenTemplate(template.url)}
                stretch
              >
                {template.name}
              </Button>
            ))}
          </>
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
};

/**
 * Template Browser Component
 * Allows users to browse organization Canva folders and select templates
 */

import { useState, useEffect, useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  Badge,
  Button,
  Columns,
  Column,
  LoadingIndicator,
  Rows,
  Text,
  Title,
} from "@canva/app-ui-kit";
import type { CanvaFolder, CanvaTemplate } from "@printssistant/shared";
import * as styles from "styles/components.css";

interface TemplateBrowserProps {
  onSelectTemplate: (template: CanvaTemplate) => void;
  onBack: () => void;
}

export const TemplateBrowser = ({
  onSelectTemplate,
  onBack,
}: TemplateBrowserProps) => {
  const intl = useIntl();
  const [folders, setFolders] = useState<CanvaFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<CanvaFolder | null>(
    null
  );
  const [templates, setTemplates] = useState<CanvaTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch folders on component mount
  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const backendHost =
        process.env.CANVA_BACKEND_HOST || "http://localhost:8787";
      const response = await fetch(`${backendHost}/api/folders`);
      if (!response.ok) {
        throw new Error(`Failed to fetch folders: ${response.statusText}`);
      }
      const data = await response.json();
      setFolders(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load folders"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async (folderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const backendHost =
        process.env.CANVA_BACKEND_HOST || "http://localhost:8787";
      const response = await fetch(
        `${backendHost}/api/folders/${folderId}/templates`
      );
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

  const handleFolderClick = useCallback(
    (folder: CanvaFolder) => {
      setSelectedFolder(folder);
      fetchTemplates(folder.id);
    },
    [fetchTemplates]
  );

  const handleBackToFolders = useCallback(() => {
    setSelectedFolder(null);
    setTemplates([]);
  }, []);

  // Render folder list
  if (!selectedFolder) {
    return (
      <div className={styles.scrollContainer}>
        <Rows spacing="2u">
          {/* Header */}
          <Rows spacing="1u">
            <Title size="small">
              <FormattedMessage
                defaultMessage="Browse Templates"
                description="Template browser title"
              />
            </Title>
            <Text>
              <FormattedMessage
                defaultMessage="Select a folder to view available templates"
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
                  defaultMessage="Loading folders..."
                  description="Loading folders message"
                />
              </Text>
            </Rows>
          )}

          {/* Folders List */}
          {!loading && folders.length > 0 && (
            <Rows spacing="1u">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  style={{
                    padding: "12px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onClick={() => handleFolderClick(folder)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleFolderClick(folder);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <Rows spacing="0.5u">
                    <Columns spacing="1u" alignY="center">
                      <Column width="fluid">
                        <Text size="medium" tone="primary">
                          {folder.name}
                        </Text>
                      </Column>
                      <Column width="content">
                        <Badge tone="info">
                          <FormattedMessage
                            defaultMessage="{count} items"
                            description="Folder item count"
                            values={{ count: folder.itemCount }}
                          />
                        </Badge>
                      </Column>
                    </Columns>
                    {folder.description && (
                      <Text size="small" tone="tertiary">
                        {folder.description}
                      </Text>
                    )}
                  </Rows>
                </div>
              ))}
            </Rows>
          )}

          {/* Empty State */}
          {!loading && folders.length === 0 && !error && (
            <Alert tone="info">
              <Text>
                <FormattedMessage
                  defaultMessage="No folders available"
                  description="Empty folders message"
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
  }

  // Render templates in selected folder
  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        {/* Header */}
        <Rows spacing="1u">
          <Title size="small">{selectedFolder.name}</Title>
          <Text>
            <FormattedMessage
              defaultMessage="Select a template to copy and customize"
              description="Templates subtitle"
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

        {/* Templates Grid */}
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
                onClick={() => onSelectTemplate(template)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelectTemplate(template);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <Rows spacing="1u">
                  {/* Template Thumbnail */}
                  {template.thumbnailUrl && (
                    <img
                      src={template.thumbnailUrl}
                      alt={template.name}
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: "4px",
                        maxHeight: "200px",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  
                  {/* Template Info */}
                  <Rows spacing="0.5u">
                    <Text size="medium" tone="primary">
                      {template.name}
                    </Text>
                    {template.widthPx && template.heightPx && (
                      <Text size="small" tone="tertiary">
                        <FormattedMessage
                          defaultMessage="{width} × {height} px"
                          description="Template dimensions"
                          values={{
                            width: template.widthPx,
                            height: template.heightPx,
                          }}
                        />
                      </Text>
                    )}
                  </Rows>
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
                defaultMessage="No templates found in this folder"
                description="Empty templates message"
              />
            </Text>
          </Alert>
        )}

        {/* Actions */}
        <Button variant="secondary" onClick={handleBackToFolders}>
          {intl.formatMessage({
            defaultMessage: "Back to Folders",
            description: "Back to folders button",
          })}
        </Button>
      </Rows>
    </div>
  );
};

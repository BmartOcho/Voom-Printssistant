/**
 * Template Browser Component
 * Displays organization templates from Canva Connect API with hierarchical navigation
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
  ImageCard,
} from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import * as styles from "styles/components.css";

// Global variable injected by Webpack
declare const BACKEND_HOST: string;

interface TemplateBrowserProps {
  onBack: () => void;
  onTemplateSelected?: (designId: string, editUrl: string) => void;
}

interface CanvaFolder {
  id: string;
  name: string;
  itemCount: number;
  description?: string;
}

interface CanvaTemplate {
  id: string;
  name: string;
  folderId: string;
  thumbnailUrl?: string;
  widthPx?: number;
  heightPx?: number;
  createdAt?: string;
  updatedAt?: string;
}

type ViewState = 'root-folders' | 'subfolders' | 'templates' | 'copying';

export const TemplateBrowser = ({
  onBack,
  onTemplateSelected,
}: TemplateBrowserProps) => {
  
  // State management
  const [viewState, setViewState] = useState<ViewState>('root-folders');
  const [allFolders, setAllFolders] = useState<CanvaFolder[]>([]);
  const [rootFolders, setRootFolders] = useState<CanvaFolder[]>([]);
  const [subfolders, setSubfolders] = useState<CanvaFolder[]>([]);
  const [templates, setTemplates] = useState<CanvaTemplate[]>([]);
  const [selectedRootFolder, setSelectedRootFolder] = useState<CanvaFolder | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<CanvaFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  // Fetch folders on mount
  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    setLoading(true);
    setError(null);
    setAuthError(false);
    
    try {
      const response = await fetch(`${BACKEND_HOST}/api/folders`);
      
      if (response.status === 503) {
        // Not authenticated
        setAuthError(true);
        setError('Organization Canva account not authenticated. Please contact your administrator to complete OAuth setup.');
        setAllFolders([]);
        setRootFolders([]);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to load folders: ${response.statusText}`);
      }
      
      const data: CanvaFolder[] = await response.json();
      setAllFolders(data);
      
      // Separate root folders from subfolders
      // Root folders don't have " > " in their name
      const roots = data.filter(f => !f.name.includes(' > '));
      
      setRootFolders(roots);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load folders');
      setAllFolders([]);
      setRootFolders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRootFolderClick = (folder: CanvaFolder) => {
    setSelectedRootFolder(folder);
    
    // Find all subfolders that belong to this root folder
    const folderSubfolders = allFolders.filter(f => 
      f.name.startsWith(folder.name + ' > ')
    );
    
    if (folderSubfolders.length > 0) {
      // Has subfolders, show them
      setSubfolders(folderSubfolders);
      setViewState('subfolders');
    } else {
      // No subfolders, load templates directly
      setSelectedFolder(folder);
      fetchTemplates(folder.id);
    }
  };

  const handleSubfolderClick = (folder: CanvaFolder) => {
    setSelectedFolder(folder);
    fetchTemplates(folder.id);
  };

  const fetchTemplates = async (folderId: string) => {
    setLoading(true);
    setError(null);
    setViewState('templates');
    
    try {
      const response = await fetch(`${BACKEND_HOST}/api/folders/${folderId}/templates`);
      
      if (response.status === 503) {
        setAuthError(true);
        setError('Organization Canva account not authenticated.');
        setTemplates([]);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to load templates: ${response.statusText}`);
      }
      
      const data: CanvaTemplate[] = await response.json();
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateCopy = async (template: CanvaTemplate) => {
    setViewState('copying');
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_HOST}/api/templates/${template.id}/copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 503) {
        setAuthError(true);
        setError('Organization Canva account not authenticated.');
        setViewState('templates');
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to copy template');
      }
      
      const result = await response.json();
      
      // Open the new design in Canva
      if (result.editUrl) {
        await requestOpenExternalUrl({ url: result.editUrl });
      }
      
      // Notify parent component if callback provided
      if (onTemplateSelected && result.designId) {
        onTemplateSelected(result.designId, result.editUrl);
      }
      
      // Return to root folders view
      setViewState('root-folders');
      setSelectedRootFolder(null);
      setSelectedFolder(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy template');
      setViewState('templates');
    }
  };

  const handleBackToRootFolders = () => {
    setViewState('root-folders');
    setSelectedRootFolder(null);
    setSelectedFolder(null);
    setSubfolders([]);
    setTemplates([]);
  };

  const handleBackToSubfolders = () => {
    setViewState('subfolders');
    setSelectedFolder(null);
    setTemplates([]);
  };

  // Render root folders view
  if (viewState === 'root-folders') {
    return (
      <div className={styles.scrollContainer}>
        <Rows spacing="2u">
          <Rows spacing="1u">
            <Title size="small">
              <FormattedMessage
                defaultMessage="Select Template Category"
                description="Title for template browser"
              />
            </Title>
            <Text>
              <FormattedMessage
                defaultMessage="Choose a category to browse templates"
                description="Subtitle for folder selection"
              />
            </Text>
          </Rows>

          {loading && (
            <Rows spacing="1u" align="center">
              <LoadingIndicator size="medium" />
              <Text>
                <FormattedMessage
                  defaultMessage="Loading categories..."
                  description="Loading message for folders"
                />
              </Text>
            </Rows>
          )}

          {error && (
            <Alert tone={authError ? "warn" : "critical"}>
              <Text>{error}</Text>
              {authError && (
                <Text size="small">
                  <FormattedMessage
                    defaultMessage="Administrator: Visit /auth/canva to authenticate"
                    description="Authentication instruction"
                  />
                </Text>
              )}
            </Alert>
          )}

          {!loading && !error && rootFolders.length === 0 && (
            <Alert tone="info">
              <Text>
                <FormattedMessage
                  defaultMessage="No folders found. Create folders in Canva and add templates to them."
                  description="Message when no folders are available"
                />
              </Text>
            </Alert>
          )}

          {!loading && rootFolders.length > 0 && (
            <Rows spacing="1u">
              {rootFolders.map((folder) => (
                <Button
                  key={folder.id}
                  variant="primary"
                  onClick={() => handleRootFolderClick(folder)}
                  stretch
                >
                  {folder.name}
                </Button>
              ))}
            </Rows>
          )}

          <Button variant="secondary" onClick={onBack} stretch>
            Back
          </Button>
        </Rows>
      </div>
    );
  }

  // Render subfolders view
  if (viewState === 'subfolders') {
    return (
      <div className={styles.scrollContainer}>
        <Rows spacing="2u">
          <Rows spacing="1u">
            <Title size="small">
              {selectedRootFolder?.name}
            </Title>
            <Text>
              <FormattedMessage
                defaultMessage="Select a subcategory"
                description="Subtitle for subfolder selection"
              />
            </Text>
          </Rows>

          <Rows spacing="1u">
            {subfolders.map((folder) => {
              // Extract just the subfolder name (after " > ")
              const subfolderName = folder.name.split(' > ')[1] || folder.name;
              return (
                <Button
                  key={folder.id}
                  variant="primary"
                  onClick={() => handleSubfolderClick(folder)}
                  stretch
                >
                  {subfolderName}
                </Button>
              );
            })}
          </Rows>

          <Button variant="secondary" onClick={handleBackToRootFolders} stretch>
            Back to Categories
          </Button>
        </Rows>
      </div>
    );
  }

  // Render templates view
  if (viewState === 'templates') {
    return (
      <div className={styles.scrollContainer}>
        <Rows spacing="2u">
          <Rows spacing="1u">
            <Title size="small">
              {selectedFolder?.name.split(' > ').pop() || selectedFolder?.name}
            </Title>
            <Text>
              <FormattedMessage
                defaultMessage="Select a template to copy"
                description="Subtitle for template selection"
              />
            </Text>
          </Rows>

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
            <Alert tone={authError ? "warn" : "critical"}>
              <Text>{error}</Text>
            </Alert>
          )}

          {!loading && !error && templates.length === 0 && (
            <Alert tone="info">
              <Text>
                <FormattedMessage
                  defaultMessage="No templates found in this folder."
                  description="Message when no templates are available"
                />
              </Text>
            </Alert>
          )}

          {!loading && templates.length > 0 && (
            <Rows spacing="2u">
              {templates.map((template) => (
                <div key={template.id}>
                  {template.thumbnailUrl ? (
                    <ImageCard
                      ariaLabel={template.name}
                      alt={template.name}
                      thumbnailUrl={template.thumbnailUrl}
                      onClick={() => handleTemplateCopy(template)}
                      borderRadius="standard"
                    />
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => handleTemplateCopy(template)}
                      stretch
                    >
                      {template.name}
                    </Button>
                  )}
                  <Text size="small">
                    {template.name}
                  </Text>
                </div>
              ))}
            </Rows>
          )}

          <Button 
            variant="secondary" 
            onClick={selectedRootFolder && subfolders.length > 0 ? handleBackToSubfolders : handleBackToRootFolders} 
            stretch
          >
            Back
          </Button>
        </Rows>
      </div>
    );
  }

  // Render copying state
  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u" align="center">
        <LoadingIndicator size="medium" />
        <Title size="small">
          Copying template...
        </Title>
        <Text>
          Please wait while we create your design
        </Text>
      </Rows>
    </div>
  );
};

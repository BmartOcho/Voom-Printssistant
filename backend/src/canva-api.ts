/**
 * Canva Connect API Service
 * Handles all API calls to Canva Connect with proper error handling and rate limiting
 */

import axios, { AxiosInstance, AxiosError } from "axios";

const CANVA_API_BASE = "https://api.canva.com/rest/v1";

export interface CanvaApiConfig {
  accessToken: string;
  onTokenRefresh?: () => Promise<string>; // Callback to refresh token if needed
}

export interface CanvaFolder {
  id: string;
  name: string;
  type: string;
  created_at?: string;
  updated_at?: string;
}

export interface CanvaDesign {
  id: string;
  title: string;
  width: number;
  height: number;
  thumbnail?: {
    width: number;
    height: number;
    url: string;
  };
  urls?: {
    view_url?: string;
    edit_url?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface CanvaDesignWithSharing extends CanvaDesign {
  is_shared_publicly: boolean;
  sharing?: {
    access?: {
      view_link?: {
        url: string;
        enabled: boolean;
      };
    };
  };
}

export interface BrandTemplate {
  id: string;
  title: string;
  thumbnail?: {
    url: string;
  };
  dataset?: {
    data: any;
  };
}

/**
 * Canva API Client
 */
export class CanvaApiClient {
  private client: AxiosInstance;
  private onTokenRefresh?: () => Promise<string>;

  constructor(config: CanvaApiConfig) {
    this.onTokenRefresh = config.onTokenRefresh;
    
    this.client = axios.create({
      baseURL: CANVA_API_BASE,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 second timeout
    });

    // Add response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // If 401 and we haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry && this.onTokenRefresh) {
          originalRequest._retry = true;
          try {
            const newToken = await this.onTokenRefresh();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            this.client.defaults.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Update access token
   */
  updateToken(accessToken: string) {
    this.client.defaults.headers.Authorization = `Bearer ${accessToken}`;
  }

  /**
   * List folders accessible to the user
   * Note: Canva API doesn't have a direct /folders endpoint.
   * We list items in the root folder and filter for folders.
   */
  async listFolders(): Promise<CanvaFolder[]> {
    try {
      // List items in the root folder, filtering for folder types
      const response = await this.client.get("/folders/root/items", {
        params: {
          item_types: "folder",
          limit: 100, // Get up to 100 folders
        },
      });
      
      const items = response.data.items || [];
      
      // Transform to CanvaFolder format
      // Note: The API returns { type: "folder", folder: { id, name, ... } }
      return items
        .filter((item: any) => item.type === "folder" && item.folder)
        .map((item: any) => ({
          id: item.folder.id,
          name: item.folder.name,
          type: item.type,
          created_at: item.folder.created_at,
          updated_at: item.folder.updated_at,
        }));
    } catch (error) {
      throw this.handleError(error, "Failed to list folders");
    }
  }

  /**
   * List designs in a specific folder
   */
  async listFolderDesigns(folderId: string): Promise<CanvaDesign[]> {
    try {
      const response = await this.client.get(`/folders/${folderId}/items`, {
        params: {
          item_types: "design", // Changed from 'types' to 'item_types'
        },
      });
      
      const items = response.data.items || [];
      
      // Transform to CanvaDesign format
      // Note: The API returns { type: "design", design: { id, title, ... } }
      return items
        .filter((item: any) => item.type === "design" && item.design)
        .map((item: any) => ({
          id: item.design.id,
          title: item.design.title,
          width: item.design.width,
          height: item.design.height,
          thumbnail: item.thumbnail,
          urls: item.design.urls,
          created_at: item.design.created_at,
          updated_at: item.design.updated_at,
        }));
    } catch (error) {
      throw this.handleError(error, `Failed to list designs in folder ${folderId}`);
    }
  }

  /**
   * Get detailed information about a design, including sharing settings
   */
  async getDesignDetails(designId: string): Promise<CanvaDesignWithSharing> {
    try {
      const response = await this.client.get(`/designs/${designId}`);
      const design = response.data.design;

      // Check if design has public sharing enabled
      const isSharedPublicly = design.sharing?.access?.view_link?.enabled || false;

      return {
        ...design,
        is_shared_publicly: isSharedPublicly,
      };
    } catch (error) {
      throw this.handleError(error, `Failed to get design details for ${designId}`);
    }
  }

  /**
   * Check if a design is publicly shared (Anyone with the link)
   */
  async isDesignPubliclyShared(designId: string): Promise<boolean> {
    try {
      const design = await this.getDesignDetails(designId);
      return design.is_shared_publicly;
    } catch (error) {
      // If we can't access the design, assume it's not publicly shared
      console.error(`Error checking if design ${designId} is public:`, error);
      return false;
    }
  }

  /**
   * List brand templates
   */
  async listBrandTemplates(): Promise<BrandTemplate[]> {
    try {
      const response = await this.client.get("/brand-templates");
      return response.data.items || [];
    } catch (error) {
      throw this.handleError(error, "Failed to list brand templates");
    }
  }

  /**
   * Copy a design
   */
  async copyDesign(designId: string, title?: string): Promise<{ designId: string; editUrl: string }> {
    try {
      const response = await this.client.post(`/designs/${designId}/copy`, {
        title: title || undefined,
      });

      const design = response.data.design;
      return {
        designId: design.id,
        editUrl: design.urls?.edit_url || `https://www.canva.com/design/${design.id}/edit`,
      };
    } catch (error) {
      throw this.handleError(error, `Failed to copy design ${designId}`);
    }
  }

  /**
   * Create a design from a brand template
   */
  async createFromBrandTemplate(
    templateId: string,
    data?: any
  ): Promise<{ designId: string; editUrl: string }> {
    try {
      const response = await this.client.post(`/brand-templates/${templateId}/dataset`, {
        data: data || {},
      });

      const design = response.data.design;
      return {
        designId: design.id,
        editUrl: design.urls?.edit_url || `https://www.canva.com/design/${design.id}/edit`,
      };
    } catch (error) {
      throw this.handleError(error, `Failed to create from brand template ${templateId}`);
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<any> {
    try {
      const response = await this.client.get("/users/me");
      return response.data.user;
    } catch (error) {
      throw this.handleError(error, "Failed to get current user");
    }
  }

  /**
   * Handle API errors and provide meaningful messages
   */
  private handleError(error: unknown, defaultMessage: string): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 401:
          return new Error("Authentication failed. Please reconnect your Canva account.");
        case 403:
          return new Error("You don't have permission to access this resource.");
        case 404:
          return new Error("Resource not found.");
        case 429:
          return new Error("Rate limit exceeded. Please try again in a moment.");
        default:
          return new Error(`${defaultMessage}: ${message}`);
      }
    }

    return error instanceof Error ? error : new Error(defaultMessage);
  }
}

/**
 * Filter designs to only include those that are publicly shared
 */
export async function filterPublicDesigns(
  client: CanvaApiClient,
  designs: CanvaDesign[]
): Promise<CanvaDesignWithSharing[]> {
  const results = await Promise.all(
    designs.map(async (design) => {
      try {
        return await client.getDesignDetails(design.id);
      } catch (error) {
        console.error(`Error fetching design ${design.id}:`, error);
        return null;
      }
    })
  );

  return results.filter(
    (design): design is CanvaDesignWithSharing => design !== null && design.is_shared_publicly
  );
}

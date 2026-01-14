import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Template {
  id: string;
  name: string;
  url: string;
  category: string;
  categoryImage?: string; // Optional image URL for category button
  createdAt: string;
  updatedAt: string;
}

const TEMPLATES_FILE = path.join(__dirname, '../templates.json');

export class TemplateManager {
  private async readTemplates(): Promise<Template[]> {
    try {
      const data = await fs.readFile(TEMPLATES_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, return empty array
      return [];
    }
  }

  private async writeTemplates(templates: Template[]): Promise<void> {
    await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf-8');
  }

  async listTemplates(): Promise<Template[]> {
    return this.readTemplates();
  }

  async getTemplate(id: string): Promise<Template | null> {
    const templates = await this.readTemplates();
    return templates.find(t => t.id === id) || null;
  }

  async createTemplate(data: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> {
    const templates = await this.readTemplates();
    const newTemplate: Template = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    templates.push(newTemplate);
    await this.writeTemplates(templates);
    return newTemplate;
  }

  async updateTemplate(id: string, data: Partial<Omit<Template, 'id' | 'createdAt'>>): Promise<Template | null> {
    const templates = await this.readTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) {
      return null;
    }

    templates[index] = {
      ...templates[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await this.writeTemplates(templates);
    return templates[index];
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const templates = await this.readTemplates();
    const filtered = templates.filter(t => t.id !== id);
    
    if (filtered.length === templates.length) {
      return false; // Nothing was deleted
    }

    await this.writeTemplates(filtered);
    return true;
  }

  async getCategories(): Promise<string[]> {
    const templates = await this.readTemplates();
    const categories = new Set(templates.map(t => t.category));
    return Array.from(categories).sort();
  }
}

import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { Injectable } from '@/core/decorators';
import { TemplateData } from '@/types/email.types';

@Injectable()
export class TemplateService {
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();
  private templatesPath: string;

  constructor() {
    this.templatesPath = path.join(process.cwd(), 'src', 'templates', 'emails');
    this.registerHelpers();
  }

  /**
   * Register Handlebars helpers for template rendering
   */
  private registerHelpers(): void {
    // Format currency as VND
    Handlebars.registerHelper('formatCurrency', (amount: number | string): string => {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(numAmount);
    });

    // Format date as Vietnamese format
    Handlebars.registerHelper('formatDate', (date: Date | string): string => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(dateObj);
    });

    // Format date time
    Handlebars.registerHelper('formatDateTime', (date: Date | string): string => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    });

    // Format short date
    Handlebars.registerHelper('formatShortDate', (date: Date | string): string => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(dateObj);
    });

    // Calculate nights between dates
    Handlebars.registerHelper('calculateNights', (checkIn: Date, checkOut: Date): number => {
      const checkInDate = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
      const checkOutDate = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
      const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    });
  }

  /**
   * Compile and cache a template
   */
  private compileTemplate(templateName: string): HandlebarsTemplateDelegate {
    // Check cache first
    const cached = this.templateCache.get(templateName);
    if (cached) {
      return cached;
    }

    // Load and compile template
    const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);

    // Cache the compiled template
    this.templateCache.set(templateName, template);

    return template;
  }

  /**
   * Render a template with data
   */
  public render(templateName: string, data: TemplateData): string {
    const template = this.compileTemplate(templateName);
    return template(data);
  }

  /**
   * Clear template cache (useful for development)
   */
  public clearCache(): void {
    this.templateCache.clear();
  }
}

export default TemplateService;

import {
  initializeB24Frame,
  LoggerBrowser,
  B24Frame
} from '@bitrix24/b24jssdk';

import { Transaction, FilterState } from '@/types/financial';

class Bitrix24Service {
  private b24: B24Frame | null = null;
  private logger = LoggerBrowser.build('JiggleCRM', import.meta.env?.DEV === true);
  private isInitialized = false;

  /**
   * Initialize the Bitrix24 frame
   */
  async initialize(): Promise<B24Frame | null> {
    try {
      if (this.isInitialized && this.b24) {
        return this.b24;
      }

      this.logger.info('Initializing Bitrix24 Frame...');
      this.b24 = await initializeB24Frame();
      this.isInitialized = true;
      
      this.logger.info('Bitrix24 Frame initialized successfully', {
        lang: this.b24.getLang(),
        isFirstRun: this.b24.isFirstRun,
        isInstallMode: this.b24.isInstallMode
      });

      return this.b24;
    } catch (error) {
      this.logger.error('Failed to initialize Bitrix24 Frame:', error);
      return null;
    }
  }

  /**
   * Check if Bitrix24 is available and initialized
   */
  isAvailable(): boolean {
    return this.isInitialized && this.b24 !== null;
  }

  /**
   * Check if running in Bitrix24 environment
   */
  isInBitrix24(): boolean {
    return typeof window !== 'undefined' && 
           window.parent !== window && 
           (window.location.search.includes('DOMAIN') || window.location.search.includes('AUTH_ID'));
  }

  /**
   * Get current user info from Bitrix24
   */
  async getCurrentUser() {
    if (!this.b24) {
      throw new Error('Bitrix24 not initialized');
    }

    try {
      const result = await this.b24.callMethod('user.current');
      return result.getData();
    } catch (error) {
      this.logger.error('Failed to get current user:', error);
      throw error;
    }
  }

  /**
   * Sync transactions to Bitrix24 CRM as deals
   */
  async syncTransactionsToCRM(transactions: Transaction[]): Promise<boolean> {
    if (!this.b24) {
      throw new Error('Bitrix24 not initialized');
    }

    try {
      this.logger.info(`Syncing ${transactions.length} transactions to Bitrix24 CRM...`);

      // Process transactions one by one to avoid batch complexity
      let successCount = 0;
      
      for (const transaction of transactions) {
        try {
          await this.b24.callMethod('crm.deal.add', {
            fields: {
              TITLE: `Commission: ${transaction.dba} - ${transaction.statementMonth}`,
              STAGE_ID: 'NEW',
              CURRENCY_ID: 'GBP',
              OPPORTUNITY: transaction.earnings,
              COMMENTS: `MID: ${transaction.mid}\nSales Volume: £${transaction.salesVolume}\nSales Transactions: ${transaction.salesTxn}\nResponsible: ${transaction.responsible}`,
            }
          });
          successCount++;
        } catch (error) {
          this.logger.error(`Failed to sync transaction for ${transaction.dba}:`, error);
        }
      }
      
      this.logger.info(`Successfully synced ${successCount}/${transactions.length} transactions to CRM`);
      return successCount > 0;
    } catch (error) {
      this.logger.error('Failed to sync transactions to CRM:', error);
      throw error;
    }
  }

  /**
   * Create or update a company in Bitrix24 CRM
   */
  async syncCompanyToCRM(dba: string, mid: string, responsible?: string): Promise<string | null> {
    if (!this.b24) {
      throw new Error('Bitrix24 not initialized');
    }

    try {
      // First, search for existing company
      const searchResult = await this.b24.callMethod('crm.company.list', {
        filter: {
          TITLE: dba
        },
        select: ['ID', 'TITLE']
      });

      const companies = searchResult.getData() as unknown;
      
      if (companies && Array.isArray(companies) && companies.length > 0) {
        return (companies[0] as any).ID;
      }

      // Create new company
      const createResult = await this.b24.callMethod('crm.company.add', {
        fields: {
          TITLE: dba,
          COMPANY_TYPE: 'CUSTOMER',
          COMMENTS: `MID: ${mid}${responsible ? `\nResponsible: ${responsible}` : ''}`
        }
      });

      const companyId = createResult.getData() as unknown as string;
      this.logger.info(`Created company in CRM: ${dba} (ID: ${companyId})`);
      
      return companyId;
    } catch (error) {
      this.logger.error('Failed to sync company to CRM:', error);
      throw error;
    }
  }

  /**
   * Get deals from Bitrix24 CRM with filters
   */
  async getDealsFromCRM(filters: FilterState): Promise<any[]> {
    if (!this.b24) {
      throw new Error('Bitrix24 not initialized');
    }

    try {
      const filterParams: Record<string, any> = {};
      
      if (filters.mid) {
        filterParams['%COMMENTS'] = filters.mid;
      }
      
      if (filters.dba) {
        filterParams['%TITLE'] = filters.dba;
      }

      const result = await this.b24.callMethod('crm.deal.list', {
        filter: filterParams,
        select: [
          'ID',
          'TITLE',
          'OPPORTUNITY',
          'CURRENCY_ID',
          'STAGE_ID',
          'DATE_CREATE',
          'COMMENTS'
        ],
        order: { 'DATE_CREATE': 'DESC' }
      });

      return result.getData() as unknown as any[];
    } catch (error) {
      this.logger.error('Failed to get deals from CRM:', error);
      throw error;
    }
  }

  /**
   * Show Bitrix24 notification using console fallback
   */
  async showNotification(message: string, type: 'success' | 'error' = 'success') {
    console.info(`Bitrix24 Message (${type}):`, message);
    
    if (!this.b24) {
      return;
    }

    try {
      // Try to show notification using available methods
      await this.b24.callMethod('app.info', {
        message,
        type: type === 'success' ? 'message' : 'error'
      });
    } catch (error) {
      this.logger.warn('Bitrix24 notification not available, using console:', error);
    }
  }

  /**
   * Close current Bitrix24 app
   */
  closeApp() {
    if (!this.b24 || !this.b24.parent) {
      return;
    }

    try {
      this.b24.parent.closeApplication();
    } catch (error) {
      this.logger.error('Failed to close app:', error);
    }
  }

  /**
   * Install finish for Bitrix24 app
   */
  async installFinish() {
    if (!this.b24) {
      return;
    }

    try {
      await this.b24.installFinish();
      this.logger.info('App installation finished');
    } catch (error) {
      this.logger.error('Failed to finish installation:', error);
    }
  }

  /**
   * Get app placement info
   */
  getPlacementInfo() {
    if (!this.b24) {
      return null;
    }

    try {
      return {
        placement: 'DEFAULT',
        options: this.b24.options || {}
      };
    } catch (error) {
      this.logger.error('Failed to get placement info:', error);
      return null;
    }
  }

  /**
   * Destroy Bitrix24 instance
   */
  destroy() {
    if (this.b24) {
      this.b24.destroy();
      this.b24 = null;
      this.isInitialized = false;
      this.logger.info('Bitrix24 Frame destroyed');
    }
  }

  /**
   * Get Bitrix24 instance (for advanced usage)
   */
  getInstance(): B24Frame | null {
    return this.b24;
  }

  /**
   * Calculate total commission from CRM deals
   */
  async calculateCommissionFromCRM(filters: FilterState): Promise<number> {
    try {
      const deals = await this.getDealsFromCRM(filters);
      return deals.reduce((total, deal) => total + (parseFloat(deal.OPPORTUNITY) || 0), 0);
    } catch (error) {
      this.logger.error('Failed to calculate commission from CRM:', error);
      return 0;
    }
  }

  /**
   * Get application ID for Bitrix24
   */
  getAppSid(): string {
    if (!this.b24) {
      return '';
    }

    try {
      return this.b24.getAppSid();
    } catch (error) {
      this.logger.error('Failed to get app SID:', error);
      return '';
    }
  }
}

// Export singleton instance
export const bitrix24Service = new Bitrix24Service();
export default bitrix24Service; 
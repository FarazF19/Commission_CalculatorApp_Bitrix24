import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Users, Building2, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useBitrix24 } from '@/contexts/Bitrix24Context';
import { Transaction } from '@/types/financial';

interface Bitrix24IntegrationProps {
  transactions: Transaction[];
  onSyncComplete?: () => void;
}

export const Bitrix24Integration: React.FC<Bitrix24IntegrationProps> = ({ 
  transactions, 
  onSyncComplete 
}) => {
  const {
    isAvailable,
    isInitialized,
    isInBitrix24,
    currentUser,
    error,
    syncTransactionsToCRM,
    showNotification,
    closeApp,
    installFinish
  } = useBitrix24();

  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleSyncTransactions = async () => {
    if (!isAvailable) {
      await showNotification('Bitrix24 not available', 'error');
      return;
    }

    setIsLoading(true);
    setSyncStatus(null);

    try {
      const success = await syncTransactionsToCRM(transactions);
      
      if (success) {
        setSyncStatus('success');
        await showNotification(`Successfully synced ${transactions.length} transactions to Bitrix24 CRM!`, 'success');
        onSyncComplete?.();
      } else {
        setSyncStatus('partial');
        await showNotification('Some transactions could not be synced. Check the logs for details.', 'error');
      }
    } catch (error) {
      setSyncStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync transactions';
      await showNotification(`Sync failed: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstallComplete = async () => {
    try {
      await installFinish();
      await showNotification('Jiggle CRM App installed successfully!', 'success');
    } catch (error) {
      await showNotification('Installation completion failed', 'error');
    }
  };

  if (!isInitialized) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Initializing Bitrix24 integration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Bitrix24 Integration</span>
            </CardTitle>
            <CardDescription>
              Sync your commission data with Bitrix24 CRM
            </CardDescription>
          </div>
          <Badge variant={isAvailable ? "default" : "secondary"}>
            {isAvailable ? "Connected" : isInBitrix24 ? "Limited" : "Not Available"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {isInBitrix24 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-sm font-medium">
                Environment: {isInBitrix24 ? 'Bitrix24 App' : 'Standalone'}
              </span>
            </div>
            
            {currentUser && (
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm">
                  User: {currentUser.NAME || currentUser.LOGIN || 'Unknown'}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Transactions:</strong> {transactions.length}
            </div>
            {isAvailable && (
              <div className="text-sm text-muted-foreground">
                Ready to sync to CRM deals
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Sync Status */}
        {syncStatus && (
          <Alert variant={syncStatus === 'success' ? 'default' : 'destructive'}>
            {syncStatus === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {syncStatus === 'success' && 'Transactions successfully synced to Bitrix24 CRM!'}
              {syncStatus === 'partial' && 'Some transactions were synced, but there were errors.'}
              {syncStatus === 'error' && 'Failed to sync transactions to Bitrix24 CRM.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {isAvailable ? (
            <>
              <Button 
                onClick={handleSyncTransactions}
                disabled={isLoading || transactions.length === 0}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>
                  {isLoading ? 'Syncing...' : `Sync ${transactions.length} Transactions`}
                </span>
              </Button>

              {/* Install completion button for installation mode */}
              {isInBitrix24 && currentUser && (
                <Button 
                  variant="outline" 
                  onClick={handleInstallComplete}
                  className="flex items-center space-x-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Complete Installation</span>
                </Button>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              {isInBitrix24 ? (
                "Limited functionality - some Bitrix24 features may not be available"
              ) : (
                "Not running in Bitrix24 environment. App works in standalone mode."
              )}
            </div>
          )}

          {/* Close app button when in Bitrix24 */}
          {isInBitrix24 && (
            <Button 
              variant="outline" 
              onClick={closeApp}
              className="flex items-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Close App</span>
            </Button>
          )}
        </div>

        {/* Help Text */}
        {!isInBitrix24 && (
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <strong>Note:</strong> To use full Bitrix24 integration features, install this app in your Bitrix24 portal. 
            The app will work in standalone mode with limited CRM functionality.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Bitrix24Integration; 
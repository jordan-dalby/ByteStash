import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface CreditsDisplayProps {
  className?: string;
}

interface CreditsData {
  balance: number;
  estimatedUsage: number;
  lastUpdated: string;
  isLiveData: boolean;
  fetchError?: string | null;
}

export const CreditsDisplay: React.FC<CreditsDisplayProps> = ({ className = '' }) => {
  const [credits, setCredits] = useState<CreditsData>({
    balance: 0,
    estimatedUsage: 0,
    lastUpdated: new Date().toISOString(),
    isLiveData: false,
    fetchError: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [extensionAvailable, setExtensionAvailable] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if Chrome extension API is available
    const chromeApi = (window as any).chrome;
    if (typeof chromeApi !== 'undefined' && chromeApi.storage && chromeApi.storage.local) {
      console.log('Chrome storage API detected!');
      setExtensionAvailable(true);
      
      // Try to read stored credits
      try {
        chromeApi.storage.local.get(['anthropicCredits', 'lastFetched'], (result: any) => {
          if (result.anthropicCredits) {
            console.log('Found stored credits:', result.anthropicCredits);
            setCredits(prev => ({
              ...prev,
              balance: result.anthropicCredits,
              isLiveData: true,
              fetchError: null,
              lastUpdated: result.lastFetched || new Date().toISOString()
            }));
          }
        });
      } catch (err) {
        console.log('Could not read from chrome storage:', err);
      }
    }
    
    // Check if extension is available via messaging
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message:', event.data);
      if (event.data.type === 'BYTESTASH_EXTENSION_READY') {
        console.log('Extension detected via message!');
        setExtensionAvailable(true);
      } else if (event.data.type === 'ANTHROPIC_CREDITS_RESPONSE') {
        console.log('Credits response received:', event.data);
        if (event.data.success) {
          const liveBalance = event.data.data.dollars;
          setCredits(prev => ({
            ...prev,
            balance: liveBalance,
            isLiveData: true,
            fetchError: null
          }));
          
          // Update backend with live data
          const token = localStorage.getItem('token');
          fetch('/api/v2/ai/credits', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'bytestashauth': `Bearer ${token}`
            },
            body: JSON.stringify({ balance: liveBalance })
          }).catch(err => console.error('Failed to update backend:', err));
        } else {
          setCredits(prev => ({
            ...prev,
            fetchError: event.data.error,
            isLiveData: false
          }));
        }
        setIsLoading(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    fetchCreditsData();
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDetails(false);
      }
    };

    if (showDetails) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDetails]);

  const fetchCreditsData = async () => {
    setIsLoading(true);
    console.log('Fetching credits, extension available:', extensionAvailable);
    try {
      // Check if extension is available and try to fetch via extension
      if (extensionAvailable) {
        console.log('Requesting credits from extension...');
        window.postMessage({ type: 'FETCH_ANTHROPIC_CREDITS' }, '*');
        // The response will be handled by the message listener
      }
      
      // Always fetch usage data from our backend
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v2/ai/credits', {
        cache: 'no-cache',
        headers: {
          'bytestashauth': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCredits(prev => ({
          ...data,
          balance: extensionAvailable ? prev.balance : data.balance,
          isLiveData: extensionAvailable ? prev.isLiveData : false,
          fetchError: extensionAvailable ? prev.fetchError : null
        }));
        
        // If not using extension, stop loading
        if (!extensionAvailable) {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
      setCredits(prev => ({
        ...prev,
        fetchError: 'Failed to fetch credits',
        isLiveData: false
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const balance = Number(credits.balance) || 0;
  const estimatedUsage = Number(credits.estimatedUsage) || 0;
  const remainingCredits = balance - estimatedUsage;
  const isLow = remainingCredits < 5; // Alert when under $5
  const isCritical = remainingCredits < 1; // Critical when under $1

  const getStatusColor = () => {
    if (isCritical) return 'text-red-400';
    if (isLow) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusIcon = () => {
    if (isCritical || isLow) return <AlertTriangle className="w-3 h-3" />;
    return null;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-800 rounded-lg px-2 py-1 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
          {getStatusIcon() && (
            <>
              {getStatusIcon()}
              <span className="mr-1"></span>
            </>
          )}
          <span className="text-sm font-medium">
            ${remainingCredits.toFixed(2)}
          </span>
        </div>
        {isLoading && <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />}
      </div>

      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-200">Anthropic Credits</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fetchCreditsData();
                }}
                className="text-gray-400 hover:text-gray-200 transition-colors"
                disabled={isLoading}
                title="Refresh credits"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Balance:</span>
                <span className="text-gray-200">${balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Used (est.):</span>
                <span className="text-gray-200">${estimatedUsage.toFixed(4)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-2">
                <span className="text-gray-400">Remaining:</span>
                <span className={`font-medium ${getStatusColor()}`}>
                  ${remainingCredits.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">
              {extensionAvailable ? (
                credits.isLiveData ? (
                  <span className="text-green-400">✅ Live balance via extension</span>
                ) : credits.fetchError ? (
                  <span className="text-yellow-400">⚠️ {credits.fetchError}</span>
                ) : (
                  <span className="text-gray-400">Extension detected, fetching...</span>
                )
              ) : (
                <span className="text-gray-400">📦 Install extension for live credits</span>
              )}
            </div>

            {(isLow || isCritical) && (
              <div className={`text-xs p-2 rounded ${isCritical ? 'bg-red-900/20 text-red-300' : 'bg-yellow-900/20 text-yellow-300'}`}>
                {isCritical ? '⚠️ Critical: Add credits soon!' : '⚠️ Low balance: Consider adding credits'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditsDisplay; 
// types/netinfo.tsx

// Network connection types
export type NetInfoConnectionType =
  | 'bluetooth'
  | 'cellular'
  | 'ethernet'
  | 'wifi'
  | 'wimax'
  | 'vpn'
  | 'other'
  | 'unknown'
  | 'none';

// Cellular generation types
export type NetInfoCellularGeneration = '2g' | '3g' | '4g' | '5g' | null;

// Detailed information about the connection
export interface NetInfoDetails {
  isConnectionExpensive?: boolean;
  cellularGeneration?: NetInfoCellularGeneration;
  carrier?: string;
  ssid?: string;
  bssid?: string;
  strength?: number;
  ipAddress?: string;
  subnet?: string;
  frequency?: number;
  [key: string]: any; // For any additional properties
}

// Basic NetInfo state type definition
export interface NetInfoState {
  type: NetInfoConnectionType;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  details: NetInfoDetails | null;
}

// Type for the NetInfo subscription function
export type NetInfoSubscription = () => void;

// Type for the addEventListener function
export type NetInfoEventListenerCallback = (state: NetInfoState) => void;

// NetInfo fetch return type
export interface NetInfoFetchResult extends NetInfoState {}

// Additional utilities
export interface NetInfoUtils {
  // Check if the current connection is good enough for high-bandwidth activities
  isConnectionFast: (state: NetInfoState) => boolean;
  
  // Get a readable description of the current connection
  getConnectionDescription: (state: NetInfoState) => string;
}
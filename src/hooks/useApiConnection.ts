import { useState, useCallback, useEffect } from "react";
import { NetworkData, Drug, DrugSimilarity } from "@/types/drug";
import { mockDrugs, generateNetworkData, getSimilarDrugs } from "@/data/mockData";

const DEFAULT_API_URL = "http://127.0.0.1:8000";

interface ApiState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  baseUrl: string | null;
}

export function useApiConnection() {
  const [state, setState] = useState<ApiState>({
    isConnected: false,
    isLoading: true, // Start loading while attempting auto-connect
    error: null,
    baseUrl: null,
  });

  // Test connection to the API
  const connect = useCallback(async (url: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Test the API by fetching drugs list
      const response = await fetch(`${url}/api/drugs`);
      if (!response.ok) throw new Error("Failed to connect to API");
      
      setState({ isConnected: true, isLoading: false, error: null, baseUrl: url });
      return true;
    } catch (err) {
      setState({
        isConnected: false,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to connect",
        baseUrl: null,
      });
      return false;
    }
  }, []);

  // Disconnect from API (fall back to mock data)
  const disconnect = useCallback(() => {
    setState({ isConnected: false, isLoading: false, error: null, baseUrl: null });
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect(DEFAULT_API_URL);
  }, []);

  // Fetch network data
  const fetchNetworkData = useCallback(
    async (threshold: number): Promise<NetworkData> => {
      if (state.baseUrl) {
        const response = await fetch(
          `${state.baseUrl}/api/network?threshold=${threshold}`
        );
        if (!response.ok) throw new Error("Failed to fetch network data");
        return response.json();
      }
      
      // Fall back to mock data
      return generateNetworkData(threshold);
    },
    [state.baseUrl]
  );

  // Fetch drugs list
  const fetchDrugs = useCallback(async (): Promise<Drug[]> => {
    if (state.baseUrl) {
      const response = await fetch(`${state.baseUrl}/api/drugs`);
      if (!response.ok) throw new Error("Failed to fetch drugs");
      return response.json();
    }
    
    return mockDrugs;
  }, [state.baseUrl]);

  // Fetch single drug by ID
  const fetchDrug = useCallback(async (drugId: string): Promise<Drug | null> => {
    if (state.baseUrl) {
      const response = await fetch(`${state.baseUrl}/api/drugs/${drugId}`);
      if (!response.ok) return null;
      return response.json();
    }
    
    return mockDrugs.find(d => d.id === drugId) || null;
  }, [state.baseUrl]);

  // Fetch similar drugs for a given drug
  const fetchSimilarDrugs = useCallback(
    async (drugId: string, threshold: number): Promise<DrugSimilarity[]> => {
      if (state.baseUrl) {
        const response = await fetch(
          `${state.baseUrl}/api/similar/${drugId}?threshold=${threshold}`
        );
        if (!response.ok) throw new Error("Failed to fetch similarities");
        return response.json();
      }
      
      return getSimilarDrugs(drugId, threshold);
    },
    [state.baseUrl]
  );

  return {
    ...state,
    connect,
    disconnect,
    fetchNetworkData,
    fetchDrugs,
    fetchDrug,
    fetchSimilarDrugs,
  };
}

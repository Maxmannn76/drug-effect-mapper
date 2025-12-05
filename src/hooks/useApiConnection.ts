import { useState, useCallback } from "react";
import { ApiConfig, NetworkData, Drug, DrugSimilarity } from "@/types/drug";
import { mockDrugs, generateNetworkData, getSimilarDrugs } from "@/data/mockData";

// Hook to manage API connection state
// Currently uses mock data, but structured to easily swap in real API calls

interface ApiState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useApiConnection(config?: ApiConfig) {
  const [state, setState] = useState<ApiState>({
    isConnected: false, // Set to true when using mock data
    isLoading: false,
    error: null,
  });

  // Simulate API connection
  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // In real implementation, this would ping the API
      // For now, we just simulate a successful connection
      await new Promise((resolve) => setTimeout(resolve, 500));
      setState({ isConnected: true, isLoading: false, error: null });
      return true;
    } catch (err) {
      setState({
        isConnected: false,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to connect",
      });
      return false;
    }
  }, []);

  // Fetch network data
  const fetchNetworkData = useCallback(
    async (threshold: number): Promise<NetworkData> => {
      if (config?.baseUrl) {
        // Real API call
        const response = await fetch(
          `${config.baseUrl}${config.endpoints.network}?threshold=${threshold}`
        );
        if (!response.ok) throw new Error("Failed to fetch network data");
        return response.json();
      }
      
      // Mock data
      return generateNetworkData(threshold);
    },
    [config]
  );

  // Fetch drugs list
  const fetchDrugs = useCallback(async (): Promise<Drug[]> => {
    if (config?.baseUrl) {
      const response = await fetch(`${config.baseUrl}${config.endpoints.drugs}`);
      if (!response.ok) throw new Error("Failed to fetch drugs");
      return response.json();
    }
    
    return mockDrugs;
  }, [config]);

  // Fetch similar drugs for a given drug
  const fetchSimilarDrugs = useCallback(
    async (drugId: string, threshold: number): Promise<DrugSimilarity[]> => {
      if (config?.baseUrl) {
        const response = await fetch(
          `${config.baseUrl}${config.endpoints.similarities}?drugId=${drugId}&threshold=${threshold}`
        );
        if (!response.ok) throw new Error("Failed to fetch similarities");
        return response.json();
      }
      
      return getSimilarDrugs(drugId, threshold);
    },
    [config]
  );

  return {
    ...state,
    connect,
    fetchNetworkData,
    fetchDrugs,
    fetchSimilarDrugs,
  };
}

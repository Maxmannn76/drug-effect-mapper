export interface Drug {
  id: string;
  name: string;
  mechanism?: string;
  cellTypes?: string[];
}

export interface DrugSimilarity {
  drugId: string;
  similarity: number;
}

export interface NetworkNode {
  id: string;
  name: string;
  x?: number;
  y?: number;
  size?: number;
  mechanism?: string;
}

export interface NetworkEdge {
  source: string;
  target: string;
  similarity: number;
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface ApiConfig {
  baseUrl: string;
  endpoints: {
    drugs: string;
    similarities: string;
    network: string;
  };
}

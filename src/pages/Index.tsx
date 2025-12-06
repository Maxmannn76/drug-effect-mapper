import { useState, useEffect, useMemo, useCallback } from "react";
import { NetworkGraph } from "@/components/NetworkGraph";
import { DrugSearch } from "@/components/DrugSearch";
import { SimilaritySlider } from "@/components/SimilaritySlider";
import { DrugDetailsPanel } from "@/components/DrugDetailsPanel";
import { StatsBar } from "@/components/StatsBar";
import { ApiConnectionBanner } from "@/components/ApiConnectionBanner";
import { ChatBot } from "@/components/ChatBot";
import { useApiConnection } from "@/hooks/useApiConnection";
import { Drug, NetworkData, DrugSimilarity } from "@/types/drug";
import { mockDrugs, generateNetworkData, getSimilarDrugs, getDrugById } from "@/data/mockData";
import { Dna, Share2 } from "lucide-react";

const Index = () => {
  const [threshold, setThreshold] = useState(0.5);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [drugs, setDrugs] = useState<Drug[]>(mockDrugs);
  const [networkData, setNetworkData] = useState<NetworkData>(() => generateNetworkData(0.5));
  const [similarDrugs, setSimilarDrugs] = useState<DrugSimilarity[]>([]);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(false);
  
  const api = useApiConnection();

  // Load drugs list
  useEffect(() => {
    const loadDrugs = async () => {
      try {
        const data = await api.fetchDrugs();
        setDrugs(data);
      } catch (err) {
        console.error("Failed to load drugs:", err);
      }
    };
    loadDrugs();
  }, [api.isConnected]);

  // Load network data when threshold changes or API connects
  useEffect(() => {
    const loadNetwork = async () => {
      setIsLoadingNetwork(true);
      try {
        const data = await api.fetchNetworkData(threshold);
        setNetworkData(data);
      } catch (err) {
        console.error("Failed to load network:", err);
        // Fall back to mock data
        setNetworkData(generateNetworkData(threshold));
      } finally {
        setIsLoadingNetwork(false);
      }
    };
    loadNetwork();
  }, [threshold, api.isConnected]);

  // Load similar drugs when selection or threshold changes
  useEffect(() => {
    const loadSimilar = async () => {
      if (!selectedDrug) {
        setSimilarDrugs([]);
        return;
      }
      try {
        const data = await api.fetchSimilarDrugs(selectedDrug.id, threshold);
        setSimilarDrugs(data);
      } catch (err) {
        console.error("Failed to load similar drugs:", err);
        setSimilarDrugs(getSimilarDrugs(selectedDrug.id, threshold));
      }
    };
    loadSimilar();
  }, [selectedDrug, threshold, api.isConnected]);

  // Sync selected drug with node selection
  useEffect(() => {
    if (selectedNodeId) {
      const drug = drugs.find(d => d.id === selectedNodeId);
      if (drug) setSelectedDrug(drug);
    }
  }, [selectedNodeId, drugs]);

  useEffect(() => {
    if (selectedDrug) {
      setSelectedNodeId(selectedDrug.id);
    }
  }, [selectedDrug]);

  const handleSelectNode = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (!nodeId) setSelectedDrug(null);
  };

  const handleSelectSimilar = (drugId: string) => {
    const drug = drugs.find(d => d.id === drugId);
    if (drug) {
      setSelectedDrug(drug);
      setSelectedNodeId(drugId);
    }
  };

  const handleApiConnect = async (url: string) => {
    return api.connect(url);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Main Dashboard */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <div className="max-w-[1200px] mx-auto space-y-6">
          {/* Header */}
          <header className="space-y-2 animate-fade-in">
            <div className="flex items-center gap-4">
              {/* Stylized DrugDruid Logo */}
              <div className="flex items-center">
                <span className="text-5xl md:text-6xl font-bold text-gradient-primary leading-none">D</span>
                <div className="flex flex-col -ml-0.5 leading-tight">
                  <span className="text-xl md:text-2xl font-bold text-gradient-primary">rug</span>
                  <span className="text-xl md:text-2xl font-bold text-gradient-primary">ruid</span>
                </div>
              </div>
              <div className="hidden sm:block h-10 w-px bg-border/50" />
              <p className="hidden sm:block text-sm text-muted-foreground max-w-xs">
                Discover drugs with similar cellular responses via Tahoe-x1 embeddings
              </p>
            </div>
          </header>

          {/* API Connection Banner */}
          <div className="animate-fade-in-delay-1">
            <ApiConnectionBanner isConnected={api.isConnected} onConnect={handleApiConnect} />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel: Controls */}
            <div className="space-y-4 animate-fade-in-delay-2">
              {/* Search */}
              <div className="glass-panel rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Query Drug
                </h3>
                <DrugSearch
                  drugs={drugs}
                  selectedDrug={selectedDrug}
                  onSelectDrug={setSelectedDrug}
                />
              </div>

              {/* Threshold Slider */}
              <div className="glass-panel rounded-xl p-4">
                <SimilaritySlider value={threshold} onChange={setThreshold} />
              </div>

              {/* Stats */}
              <div className="glass-panel rounded-xl p-4">
                <StatsBar data={networkData} threshold={threshold} />
              </div>

            </div>

            {/* Center Panel: Network Graph */}
            <div className="lg:col-span-2 animate-fade-in-delay-3 relative">
              {isLoadingNetwork && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-xl">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}
              <NetworkGraph
                data={networkData}
                selectedNodeId={selectedNodeId}
                onSelectNode={handleSelectNode}
                className="h-[500px] md:h-[600px] lg:h-[700px]"
              />
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-xs text-muted-foreground pt-8 pb-4">
            <p>
              Built for drug repurposing research • Delta embeddings computed via Tahoe-x1
            </p>
          </footer>
        </div>
      </div>

      {/* Right Column - Drug Details + Chatbot */}
      <div className="w-full md:w-1/4 md:min-w-[300px] md:max-w-[420px] md:h-full border-t md:border-t-0 md:border-l border-border/50 bg-card/30 flex flex-col overflow-hidden">
        {/* Top: Drug Details */}
        <div className="shrink-0 p-4 border-b border-border/50 overflow-auto max-h-[40%]">
          {selectedDrug ? (
            <DrugDetailsPanel
              drug={selectedDrug}
              similarDrugs={similarDrugs}
              onSelectSimilar={handleSelectSimilar}
            />
          ) : (
            <div className="glass-panel rounded-xl p-4 text-center text-muted-foreground">
              <p className="text-sm">Select a drug from the network to view details</p>
            </div>
          )}
        </div>
        
        {/* Bottom: Chatbot */}
        <div className="flex-1 p-4 min-h-0 overflow-hidden">
          <ChatBot />
        </div>
      </div>
    </div>
  );
};

export default Index;

import { useState, useEffect, useMemo } from "react";
import { NetworkGraph } from "@/components/NetworkGraph";
import { DrugSearch } from "@/components/DrugSearch";
import { SimilaritySlider } from "@/components/SimilaritySlider";
import { DrugDetailsPanel } from "@/components/DrugDetailsPanel";
import { StatsBar } from "@/components/StatsBar";
import { ApiConnectionBanner } from "@/components/ApiConnectionBanner";
import { ChatBot } from "@/components/ChatBot";
import { useApiConnection } from "@/hooks/useApiConnection";
import { Drug } from "@/types/drug";
import { mockDrugs, generateNetworkData, getSimilarDrugs, getDrugById } from "@/data/mockData";
import { Dna, Share2 } from "lucide-react";

const Index = () => {
  const [threshold, setThreshold] = useState(0.5);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const api = useApiConnection();

  // Generate network data based on threshold
  const networkData = useMemo(() => generateNetworkData(threshold), [threshold]);

  // Get similar drugs for selected drug
  const similarDrugs = useMemo(() => {
    if (!selectedDrug) return [];
    return getSimilarDrugs(selectedDrug.id, threshold);
  }, [selectedDrug, threshold]);

  // Sync selected drug with node selection
  useEffect(() => {
    if (selectedNodeId) {
      const drug = getDrugById(selectedNodeId);
      if (drug) setSelectedDrug(drug);
    }
  }, [selectedNodeId]);

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
    const drug = getDrugById(drugId);
    if (drug) {
      setSelectedDrug(drug);
      setSelectedNodeId(drugId);
    }
  };

  const handleApiConnect = async (url: string) => {
    // In real implementation, configure and test the API connection
    console.log("Connecting to:", url);
    return api.connect();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Main Dashboard */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <div className="max-w-[1200px] mx-auto space-y-6">
          {/* Header */}
          <header className="space-y-2 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Dna className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary">
                  Drug Repurposing Engine
                </h1>
                <p className="text-sm text-muted-foreground">
                  Discover drugs with similar cellular responses via Tahoe-x1 embeddings
                </p>
              </div>
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
                  drugs={mockDrugs}
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
            <div className="lg:col-span-2 animate-fade-in-delay-3">
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
      <div className="w-full md:w-1/4 md:min-w-[300px] md:max-w-[420px] h-[600px] md:h-auto border-t md:border-t-0 md:border-l border-border/50 bg-card/30 flex flex-col">
        {/* Top: Drug Details */}
        <div className="flex-shrink-0 p-4 border-b border-border/50 overflow-auto max-h-[45%]">
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
        <div className="flex-1 p-4 min-h-0">
          <ChatBot />
        </div>
      </div>
    </div>
  );
};

export default Index;

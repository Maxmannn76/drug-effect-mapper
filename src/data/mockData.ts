import { Drug, NetworkData, DrugSimilarity } from "@/types/drug";

// Mock drugs with varied mechanisms for demo
export const mockDrugs: Drug[] = [
  { id: "drug_001", name: "Imatinib", mechanism: "Tyrosine kinase inhibitor", cellTypes: ["K562", "MCF7"] },
  { id: "drug_002", name: "Gefitinib", mechanism: "EGFR inhibitor", cellTypes: ["A549", "MCF7"] },
  { id: "drug_003", name: "Metformin", mechanism: "AMPK activator", cellTypes: ["HepG2", "MCF7"] },
  { id: "drug_004", name: "Rapamycin", mechanism: "mTOR inhibitor", cellTypes: ["HeLa", "K562"] },
  { id: "drug_005", name: "Doxorubicin", mechanism: "Topoisomerase II inhibitor", cellTypes: ["MCF7", "HeLa"] },
  { id: "drug_006", name: "Paclitaxel", mechanism: "Microtubule stabilizer", cellTypes: ["A549", "MCF7"] },
  { id: "drug_007", name: "Vorinostat", mechanism: "HDAC inhibitor", cellTypes: ["K562", "HeLa"] },
  { id: "drug_008", name: "Erlotinib", mechanism: "EGFR inhibitor", cellTypes: ["A549", "HepG2"] },
  { id: "drug_009", name: "Sorafenib", mechanism: "Multi-kinase inhibitor", cellTypes: ["HepG2", "K562"] },
  { id: "drug_010", name: "Lapatinib", mechanism: "HER2/EGFR inhibitor", cellTypes: ["MCF7", "A549"] },
  { id: "drug_011", name: "Nilotinib", mechanism: "Tyrosine kinase inhibitor", cellTypes: ["K562", "HeLa"] },
  { id: "drug_012", name: "Dasatinib", mechanism: "Tyrosine kinase inhibitor", cellTypes: ["K562", "MCF7"] },
  { id: "drug_013", name: "Temsirolimus", mechanism: "mTOR inhibitor", cellTypes: ["HeLa", "A549"] },
  { id: "drug_014", name: "Everolimus", mechanism: "mTOR inhibitor", cellTypes: ["MCF7", "HepG2"] },
  { id: "drug_015", name: "Belinostat", mechanism: "HDAC inhibitor", cellTypes: ["K562", "A549"] },
];

// Pre-computed similarity matrix (cosine similarities between delta embeddings)
const similarityMatrix: Record<string, Record<string, number>> = {
  drug_001: { drug_011: 0.94, drug_012: 0.91, drug_009: 0.72, drug_002: 0.68 },
  drug_002: { drug_008: 0.96, drug_010: 0.89, drug_001: 0.68, drug_006: 0.55 },
  drug_003: { drug_004: 0.61, drug_014: 0.58, drug_009: 0.42 },
  drug_004: { drug_013: 0.97, drug_014: 0.93, drug_003: 0.61 },
  drug_005: { drug_006: 0.73, drug_007: 0.52 },
  drug_006: { drug_005: 0.73, drug_002: 0.55 },
  drug_007: { drug_015: 0.95, drug_005: 0.52 },
  drug_008: { drug_002: 0.96, drug_010: 0.87 },
  drug_009: { drug_001: 0.72, drug_011: 0.69, drug_003: 0.42 },
  drug_010: { drug_002: 0.89, drug_008: 0.87 },
  drug_011: { drug_001: 0.94, drug_012: 0.88, drug_009: 0.69 },
  drug_012: { drug_001: 0.91, drug_011: 0.88 },
  drug_013: { drug_004: 0.97, drug_014: 0.92 },
  drug_014: { drug_004: 0.93, drug_013: 0.92, drug_003: 0.58 },
  drug_015: { drug_007: 0.95 },
};

export function getSimilarDrugs(drugId: string, threshold: number = 0.5): DrugSimilarity[] {
  const similarities = similarityMatrix[drugId] || {};
  return Object.entries(similarities)
    .filter(([_, sim]) => sim >= threshold)
    .map(([id, similarity]) => ({ drugId: id, similarity }))
    .sort((a, b) => b.similarity - a.similarity);
}

export function generateNetworkData(threshold: number = 0.5): NetworkData {
  const nodes: NetworkData["nodes"] = mockDrugs.map((drug, index) => {
    // Position nodes in a circular layout
    const angle = (2 * Math.PI * index) / mockDrugs.length;
    const radius = 300;
    return {
      id: drug.id,
      name: drug.name,
      x: 400 + radius * Math.cos(angle),
      y: 350 + radius * Math.sin(angle),
      size: 20,
      mechanism: drug.mechanism,
    };
  });

  const edges: NetworkData["edges"] = [];
  const addedEdges = new Set<string>();

  Object.entries(similarityMatrix).forEach(([source, targets]) => {
    Object.entries(targets).forEach(([target, similarity]) => {
      if (similarity >= threshold) {
        const edgeKey = [source, target].sort().join("-");
        if (!addedEdges.has(edgeKey)) {
          edges.push({ source, target, similarity });
          addedEdges.add(edgeKey);
        }
      }
    });
  });

  return { nodes, edges };
}

export function getDrugById(id: string): Drug | undefined {
  return mockDrugs.find((d) => d.id === id);
}

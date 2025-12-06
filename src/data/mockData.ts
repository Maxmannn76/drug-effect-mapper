import { Drug, NetworkData, DrugSimilarity } from "@/types/drug";

// Mock drugs with Qdrant-compatible structure
export const mockDrugs: Drug[] = [
  { id: "drug_001", drug: "Imatinib", cell_line: "CVCL_0023", mechanism: "Tyrosine kinase inhibitor", samples_aggregated: 450 },
  { id: "drug_002", drug: "Gefitinib", cell_line: "CVCL_0023", mechanism: "EGFR inhibitor", samples_aggregated: 380 },
  { id: "drug_003", drug: "Metformin", cell_line: "CVCL_0023", mechanism: "AMPK activator", samples_aggregated: 520 },
  { id: "drug_004", drug: "Rapamycin", cell_line: "CVCL_0023", mechanism: "mTOR inhibitor", samples_aggregated: 290 },
  { id: "drug_005", drug: "Doxorubicin", cell_line: "CVCL_0023", mechanism: "Topoisomerase II inhibitor", samples_aggregated: 410 },
  { id: "drug_006", drug: "Paclitaxel", cell_line: "CVCL_0023", mechanism: "Microtubule stabilizer", samples_aggregated: 350 },
  { id: "drug_007", drug: "Vorinostat", cell_line: "CVCL_0023", mechanism: "HDAC inhibitor", samples_aggregated: 280 },
  { id: "drug_008", drug: "Erlotinib", cell_line: "CVCL_0023", mechanism: "EGFR inhibitor", samples_aggregated: 390 },
  { id: "drug_009", drug: "Sorafenib", cell_line: "CVCL_0023", mechanism: "Multi-kinase inhibitor", samples_aggregated: 310 },
  { id: "drug_010", drug: "Lapatinib", cell_line: "CVCL_0023", mechanism: "HER2/EGFR inhibitor", samples_aggregated: 420 },
  { id: "drug_011", drug: "Nilotinib", cell_line: "CVCL_0023", mechanism: "Tyrosine kinase inhibitor", samples_aggregated: 340 },
  { id: "drug_012", drug: "Dasatinib", cell_line: "CVCL_0023", mechanism: "Tyrosine kinase inhibitor", samples_aggregated: 370 },
  { id: "drug_013", drug: "Temsirolimus", cell_line: "CVCL_0023", mechanism: "mTOR inhibitor", samples_aggregated: 260 },
  { id: "drug_014", drug: "Everolimus", cell_line: "CVCL_0023", mechanism: "mTOR inhibitor", samples_aggregated: 330 },
  { id: "drug_015", drug: "Belinostat", cell_line: "CVCL_0023", mechanism: "HDAC inhibitor", samples_aggregated: 240 },
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
      drug: drug.drug,
      cell_line: drug.cell_line,
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

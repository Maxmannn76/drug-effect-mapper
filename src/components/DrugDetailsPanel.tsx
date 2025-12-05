import { Drug, DrugSimilarity } from "@/types/drug";
import { getDrugById, mockDrugs } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, Dna, FlaskConical, Microscope } from "lucide-react";

interface DrugDetailsPanelProps {
  drug: Drug;
  similarDrugs: DrugSimilarity[];
  onSelectSimilar: (drugId: string) => void;
}

export function DrugDetailsPanel({
  drug,
  similarDrugs,
  onSelectSimilar,
}: DrugDetailsPanelProps) {
  return (
    <div className="glass-panel rounded-xl p-5 space-y-5 animate-fade-in">
      {/* Drug Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold text-gradient-primary">{drug.name}</h2>
          <Badge variant="secondary" className="font-mono text-xs">
            {drug.id}
          </Badge>
        </div>

        {drug.mechanism && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FlaskConical className="h-4 w-4 text-primary" />
            <span>{drug.mechanism}</span>
          </div>
        )}

        {drug.cellTypes && drug.cellTypes.length > 0 && (
          <div className="flex items-center gap-2">
            <Microscope className="h-4 w-4 text-primary" />
            <div className="flex flex-wrap gap-1">
              {drug.cellTypes.map((ct) => (
                <Badge key={ct} variant="outline" className="text-xs">
                  {ct}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Similar Drugs */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Dna className="h-4 w-4" />
          Similar Cellular Response ({similarDrugs.length})
        </h3>

        {similarDrugs.length > 0 ? (
          <div className="space-y-2">
            {similarDrugs.map(({ drugId, similarity }) => {
              const similarDrug = getDrugById(drugId);
              if (!similarDrug) return null;

              return (
                <button
                  key={drugId}
                  onClick={() => onSelectSimilar(drugId)}
                  className={cn(
                    "w-full p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50",
                    "flex items-center justify-between gap-3 group transition-all",
                    "border border-transparent hover:border-primary/30"
                  )}
                >
                  <div className="flex-1 text-left">
                    <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {similarDrug.name}
                    </div>
                    {similarDrug.mechanism && (
                      <div className="text-xs text-muted-foreground truncate">
                        {similarDrug.mechanism}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <SimilarityBar value={similarity} />
                    <span className="font-mono text-sm text-primary">
                      {(similarity * 100).toFixed(0)}%
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No similar drugs found at current threshold
          </div>
        )}
      </div>
    </div>
  );
}

function SimilarityBar({ value }: { value: number }) {
  return (
    <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-500"
        style={{ width: `${value * 100}%` }}
      />
    </div>
  );
}

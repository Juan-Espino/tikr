"use client";
import type { Dispatch, SetStateAction } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { Portfolio } from "~/lib/demo";
import { comparisonRank, comparisonColors } from "./comparison-colors";
export function PortfolioComparisons({
  portfolios,
  draftId,
  comparison,
  setComparison,
}: {
  portfolios: Portfolio[];
  draftId: string;
  comparison: string[];
  setComparison: Dispatch<SetStateAction<string[]>>;
}) {
  return (
    <fieldset
      className="border-border mt-6 min-w-0 border-t pt-4"
      aria-describedby="comparison-help"
    >
      <legend className="pr-3 text-base font-semibold">
        Compare portfolios
      </legend>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id="comparison-help" className="text-muted-foreground text-sm">
          Choose up to two. Same dates and starting amount.
        </p>
        <span className="text-muted-foreground text-sm" role="status">
          {comparison.length} / 2 selected
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {portfolios
          .filter((p) => p.id !== draftId)
          .sort(
            (a, b) =>
              comparisonRank(a.id) - comparisonRank(b.id) ||
              a.id.localeCompare(b.id),
          )
          .map((p, index) => {
            const selected = comparison.includes(p.id);
            return (
              <Button
                key={p.id}
                variant="outline"
                aria-pressed={selected}
                disabled={!selected && comparison.length >= 2}
                onClick={() =>
                  setComparison((old) =>
                    old.includes(p.id)
                      ? old.filter((id) => id !== p.id)
                      : old.length < 2
                        ? [...old, p.id]
                        : old,
                  )
                }
                className={`h-auto min-h-10 max-w-full gap-2 px-3 py-2 text-left whitespace-normal ${selected ? "!bg-card hover:!bg-muted border-stone-500" : "!bg-background hover:!bg-muted"}`}
              >
                <span
                  className="min-w-0 break-words"
                  style={{
                    color: comparisonColors[index % comparisonColors.length],
                  }}
                >
                  {p.name}
                </span>
                {selected ? (
                  <Check aria-hidden="true" className="size-4" />
                ) : (
                  <Plus aria-hidden="true" className="size-4" />
                )}
              </Button>
            );
          })}
      </div>
      {!portfolios.some((p) => p.id !== draftId) && (
        <p className="text-muted-foreground mt-3 text-sm">
          Save another portfolio to compare it here.
        </p>
      )}
    </fieldset>
  );
}

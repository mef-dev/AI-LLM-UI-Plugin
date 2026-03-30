import { Component } from '@angular/core';

interface VectorResult {
  title: string;
  source: string;
  score: number;
  snippet: string;
}

@Component({
  selector: 'app-vector-workspace',
  standalone: false,
  templateUrl: './vector-workspace.component.html',
  styleUrls: ['./vector-workspace.component.scss']
})
export class VectorWorkspaceComponent {
  query = 'How do we detect billing regressions after a pricing update?';
  collection = 'billing_knowledge';
  limit = 3;

  readonly collections = ['billing_knowledge', 'support_cases', 'release_notes'];

  readonly dataset: VectorResult[] = [
    {
      title: 'Billing regression rollback guide',
      source: 'release_notes/march-rollback.md',
      score: 0.94,
      snippet: 'Use the rollback guide when invoice totals changed after tariff recalculation and customer-facing totals no longer match the preview.'
    },
    {
      title: 'Invoice discrepancy troubleshooting',
      source: 'support_cases/case-1842',
      score: 0.91,
      snippet: 'Support used semantic search to locate prior incidents where usage bundles were re-rated after a configuration import.'
    },
    {
      title: 'Tariff change validation checklist',
      source: 'billing_knowledge/tariff-validation',
      score: 0.88,
      snippet: 'Validate expected invoice totals, tax logic, and discount carry-over before promoting pricing changes to stage.'
    },
  ];

  results = [...this.dataset];

  runSearch(): void {
    const lowered = this.query.trim().toLowerCase();

    this.results = this.dataset
      .filter((item) => {
        if (!lowered) {
          return true;
        }

        return `${item.title} ${item.snippet} ${item.source}`.toLowerCase().includes(lowered);
      })
      .slice(0, this.limit);
  }

  get requestJson(): string {
    return JSON.stringify(
      {
        collection: this.collection,
        query: this.query,
        limit: this.limit,
        metric: 'cosine',
      },
      null,
      2
    );
  }
}

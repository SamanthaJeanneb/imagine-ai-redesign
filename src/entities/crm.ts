/**
 * CRM mirrors, trimmed to what the pipeline line reads. Follows the shared
 * CRM columns in SCHEMA.md plus the per-table ones for contacts and deals.
 */
import type { CrmContactRow, CrmOpportunityRow } from "@/entities/rows";

export interface CrmContact {
  id: string;
  mergeId: string;
  name: string;
  company: string | null;
  linkedinSlug: string | null;
  /** `post_engagement` when the match came from someone engaging a post. */
  source: string | null;
  createdAt: string;
}

export interface CrmOpportunity {
  id: string;
  mergeId: string;
  name: string;
  amount: number;
  status: string;
  stage: string;
  contactMergeIds: readonly string[];
  createdAt: string;
}

/** Contacts the content program can claim. */
export const CONTENT_SOURCE = "post_engagement";

export function transformCrmContactRow(row: CrmContactRow): CrmContact {
  return {
    id: row.id,
    mergeId: row.merge_id,
    name: row.name ?? "Unknown contact",
    company: row.company_name,
    linkedinSlug: row.linkedin_slug,
    source: row.linkedin_source,
    createdAt: row.remote_created_at ?? "",
  };
}

export function transformCrmOpportunityRow(
  row: CrmOpportunityRow,
): CrmOpportunity {
  return {
    id: row.id,
    mergeId: row.merge_id,
    name: row.name ?? "Untitled deal",
    amount: row.amount ?? 0,
    status: row.status ?? "open",
    stage: row.stage_name ?? "",
    contactMergeIds: row.contact_merge_ids,
    createdAt: row.remote_created_at ?? "",
  };
}

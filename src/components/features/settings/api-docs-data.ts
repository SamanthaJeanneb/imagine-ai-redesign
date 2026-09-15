export const API_BASE = "https://app.imagineai.me";

export interface Param {
  name: string;
  type: string;
  description: string;
}

export interface Endpoint {
  id: string;
  method: string;
  path: string;
  title: string;
  description: string;
  params: readonly Param[];
  exampleRequest: string;
  exampleResponse: string;
  notes?: readonly string[];
}

const DATE_PARAMS: readonly Param[] = [
  {
    name: "start_date",
    type: "string (ISO 8601)",
    description:
      "Start of the date range, inclusive. Defaults to 180 days before end_date.",
  },
  {
    name: "end_date",
    type: "string (ISO 8601)",
    description: "End of the date range, inclusive. Defaults to now.",
  },
  {
    name: "client_ids",
    type: "string (comma-separated UUIDs)",
    description:
      "Filter to specific clients. All ids must belong to your organization (else 400). Defaults to all clients.",
  },
];

const PAGE_PARAMS: readonly Param[] = [
  {
    name: "limit",
    type: "integer",
    description: "Page size, 1-100. Defaults to 50.",
  },
  {
    name: "offset",
    type: "integer",
    description: "Number of rows to skip. Defaults to 0.",
  },
];

export const ENDPOINTS: readonly Endpoint[] = [
  {
    id: "clients",
    method: "GET",
    path: "/api/v1/clients",
    title: "List clients",
    description:
      "Lists the clients in your organization. Use the returned ids for the client_ids filter on the analytics endpoints.",
    params: [],
    exampleRequest: `curl "${API_BASE}/api/v1/clients" \\
  -H "Authorization: Bearer $IMAGINE_API_KEY"`,
    exampleResponse: `{
  "data": [
    {
      "id": "9b2f6c3e-1a45-4f7b-9d2c-6c1f0e8a7b21",
      "name": "Jane Doe",
      "is_company": false,
      "linkedin_id": "jane-doe-123"
    }
  ]
}`,
  },
  {
    id: "summary",
    method: "GET",
    path: "/api/v1/analytics/summary",
    title: "Analytics summary",
    description:
      "Aggregate metrics across all posts in the date range. Matches the summary cards on the analytics dashboard.",
    params: DATE_PARAMS,
    exampleRequest: `curl "${API_BASE}/api/v1/analytics/summary?start_date=2026-02-01&end_date=2026-08-01" \\
  -H "Authorization: Bearer $IMAGINE_API_KEY"`,
    exampleResponse: `{
  "data": {
    "total_impressions": 152340,
    "avg_engagement_rate": 4.7,
    "total_followers_gained": 312,
    "total_profile_views": 1893,
    "total_posts": 42
  },
  "meta": {
    "start_date": "2026-02-01T00:00:00.000Z",
    "end_date": "2026-08-01T00:00:00.000Z",
    "client_ids": ["9b2f6c3e-1a45-4f7b-9d2c-6c1f0e8a7b21"]
  }
}`,
    notes: [
      "To compare against a previous period, make a second call with shifted dates.",
    ],
  },
  {
    id: "posts",
    method: "GET",
    path: "/api/v1/analytics/posts",
    title: "List posts with metrics",
    description:
      "Published posts in the date range with their per-post LinkedIn metrics, sorted by post date descending.",
    params: [...DATE_PARAMS, ...PAGE_PARAMS],
    exampleRequest: `curl "${API_BASE}/api/v1/analytics/posts?limit=50&offset=0" \\
  -H "Authorization: Bearer $IMAGINE_API_KEY"`,
    exampleResponse: `{
  "data": [
    {
      "id": "c049e7ce-2b13-4a89-b7d1-3f4a8e9c0d12",
      "client_id": "9b2f6c3e-1a45-4f7b-9d2c-6c1f0e8a7b21",
      "posted_at": "2026-07-14T15:30:00Z",
      "content": "Full post text...",
      "linkedin_url": "https://www.linkedin.com/feed/update/urn:li:activity:7350...",
      "metrics": {
        "impressions": 12403,
        "members_reached": 9110,
        "engagements": 587,
        "engagement_rate": 4.7,
        "reactions": 430,
        "comments": 112,
        "reposts": 45,
        "clicks": 210,
        "clickthrough_rate": 1.7,
        "profile_views": 89,
        "followers_gained": 23
      }
    }
  ],
  "meta": {
    "start_date": "2026-02-01T00:00:00.000Z",
    "end_date": "2026-08-01T00:00:00.000Z",
    "client_ids": ["9b2f6c3e-1a45-4f7b-9d2c-6c1f0e8a7b21"],
    "limit": 50,
    "offset": 0,
    "returned": 50,
    "total": 172,
    "has_more": true
  }
}`,
    notes: [
      "metrics is null for posts whose analytics have not been collected yet.",
      "posted_at is the scheduled publish time when available, otherwise the creation time.",
    ],
  },
  {
    id: "engagers",
    method: "GET",
    path: "/api/v1/analytics/engagers",
    title: "List engagers (aggregated)",
    description:
      "One row per unique person who reacted to or commented on your posts in the date range, sorted by total engagements descending.",
    params: [...DATE_PARAMS, ...PAGE_PARAMS],
    exampleRequest: `curl "${API_BASE}/api/v1/analytics/engagers?limit=50&offset=0" \\
  -H "Authorization: Bearer $IMAGINE_API_KEY"`,
    exampleResponse: `{
  "data": [
    {
      "profile_id": "5d8e2f1a-7c3b-4e9d-a1f2-8b6c4d0e9a37",
      "name": "John Smith",
      "headline": "VP Engineering at Acme",
      "linkedin_url": "https://www.linkedin.com/in/john-smith",
      "follower_count": 8200,
      "reaction_count": 14,
      "comment_count": 3,
      "total_engagements": 17,
      "engaged_posts_count": 9,
      "per_client": {
        "9b2f6c3e-1a45-4f7b-9d2c-6c1f0e8a7b21": {
          "reaction_count": 10,
          "comment_count": 2,
          "total_engagements": 12,
          "engaged_posts_count": 6
        }
      }
    }
  ],
  "meta": {
    "start_date": "2026-02-01T00:00:00.000Z",
    "end_date": "2026-08-01T00:00:00.000Z",
    "client_ids": ["9b2f6c3e-1a45-4f7b-9d2c-6c1f0e8a7b21"],
    "limit": 50,
    "offset": 0,
    "returned": 50,
    "has_more": true
  }
}`,
    notes: [
      "name, headline, linkedin_url, and follower_count are nullable; profile enrichment is best-effort.",
      "per_client breaks counts down by client, keyed by the same ids returned from /api/v1/clients.",
      "meta has no total for this endpoint; page until has_more is false.",
    ],
  },
  {
    id: "post-engagers",
    method: "GET",
    path: "/api/v1/analytics/posts/{post_id}/engagers",
    title: "List engagers for one post",
    description:
      "Everyone who reacted to or commented on a specific post, sorted by total engagements descending. The post must belong to your organization, otherwise the API responds with 404.",
    params: PAGE_PARAMS,
    exampleRequest: `curl "${API_BASE}/api/v1/analytics/posts/c049e7ce-2b13-4a89-b7d1-3f4a8e9c0d12/engagers?limit=50&offset=0" \\
  -H "Authorization: Bearer $IMAGINE_API_KEY"`,
    exampleResponse: `{
  "data": [
    {
      "profile_id": "5d8e2f1a-7c3b-4e9d-a1f2-8b6c4d0e9a37",
      "name": "John Smith",
      "headline": "VP Engineering at Acme",
      "linkedin_url": "https://www.linkedin.com/in/john-smith",
      "follower_count": 8200,
      "reaction_count": 1,
      "comment_count": 2,
      "total_engagements": 3
    }
  ],
  "meta": {
    "limit": 50,
    "offset": 0,
    "returned": 50,
    "has_more": true
  }
}`,
    notes: [
      "Counts are scoped to this single post. Comment text is not exposed.",
    ],
  },
];

export const ERROR_ROWS = [
  {
    code: "invalid_api_key",
    status: "401",
    description:
      "The Authorization header is missing, malformed, or the key is invalid (e.g. it was rotated).",
  },
  {
    code: "invalid_request",
    status: "400",
    description:
      "A query parameter failed validation, e.g. a bad date or a client_id outside your organization.",
  },
  {
    code: "not_found",
    status: "404",
    description:
      "The requested resource does not exist or does not belong to your organization.",
  },
  {
    code: "internal_error",
    status: "500",
    description: "Something went wrong on our side. Retry later.",
  },
] as const;

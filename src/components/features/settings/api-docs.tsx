import Link from "next/link";
import { cn } from "cn";

import {
  API_BASE,
  ENDPOINTS,
  ERROR_ROWS,
  type Endpoint,
  type Param,
} from "@/components/features/settings/api-docs-data";
import { Badge } from "@/components/ui/badge";

const linkClass = "text-imagine-secondary underline-offset-4 hover:underline";

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-panel border border-imagine-border bg-imagine-surface-raised p-m type-small leading-relaxed">
      <code className="font-mono">{code}</code>
    </pre>
  );
}

function DocsTable({
  columns,
  rows,
}: {
  columns: readonly string[];
  rows: readonly (readonly string[])[];
}) {
  return (
    <div className="overflow-x-auto rounded-panel border border-imagine-border">
      <table className="w-full text-left type-small">
        <thead>
          <tr className="border-b border-imagine-border bg-imagine-surface-raised type-caption text-imagine-foreground-muted">
            {columns.map((column) => (
              <th key={column} className="px-m py-s font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[0]}
              className="border-b border-imagine-border last:border-b-0"
            >
              {row.map((cell, index) => (
                <td
                  key={`${String(row[0])}-${String(index)}`}
                  className={cn(
                    "px-m py-s text-imagine-foreground-muted",
                    index === 0 && "font-mono text-xs text-imagine-foreground",
                    index === 1 && "whitespace-nowrap",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ParamsTable({ params }: { params: readonly Param[] }) {
  if (params.length === 0) {
    return (
      <p className="type-small text-imagine-foreground-muted">
        No query parameters.
      </p>
    );
  }

  return (
    <DocsTable
      columns={["Parameter", "Type", "Description"]}
      rows={params.map((param) => [param.name, param.type, param.description])}
    />
  );
}

function EndpointSection({ endpoint }: { endpoint: Endpoint }) {
  return (
    <section id={endpoint.id} className="flex scroll-mt-xl flex-col gap-m">
      <div className="flex flex-col gap-xs">
        <h2 className="type-heading">{endpoint.title}</h2>
        <div className="flex flex-wrap items-center gap-s">
          <Badge variant="success">{endpoint.method}</Badge>
          <code className="font-mono type-small break-all">
            {endpoint.path}
          </code>
        </div>
      </div>
      <p className="type-body text-imagine-foreground-muted">
        {endpoint.description}
      </p>
      <div className="flex flex-col gap-s">
        <h3 className="type-small font-semibold">Query parameters</h3>
        <ParamsTable params={endpoint.params} />
      </div>
      <div className="flex flex-col gap-s">
        <h3 className="type-small font-semibold">Example request</h3>
        <CodeBlock code={endpoint.exampleRequest} />
      </div>
      <div className="flex flex-col gap-s">
        <h3 className="type-small font-semibold">Example response</h3>
        <CodeBlock code={endpoint.exampleResponse} />
      </div>
      {endpoint.notes === undefined ? null : (
        <ul className="flex list-disc flex-col gap-xxs pl-l type-small text-imagine-foreground-muted">
          {endpoint.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Public analytics API reference. Linked from Settings, API.
 */
export function ApiDocs() {
  return (
    <div className="flex min-h-svh flex-col bg-imagine-surface">
      <header className="border-b border-imagine-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-l py-m">
          <Link
            href="/"
            aria-label="Imagine AI"
            className="block aspect-[138/43] w-28 bg-imagine-foreground mask-[url(/brand/imagine-logo.png)] mask-contain mask-center mask-no-repeat"
          />
          <span className="type-small text-imagine-foreground-muted">
            API Reference
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-xxl px-l py-xl">
        <section className="flex flex-col gap-m">
          <h1 className="type-title">Analytics API</h1>
          <p className="type-body text-imagine-foreground-muted">
            A read-only REST API for the analytics shown in your Imagine AI
            dashboard: summary metrics, per-post performance, and the people
            engaging with your content. All endpoints are versioned under{" "}
            <code className="font-mono type-small">/api/v1</code> and return
            JSON with snake_case fields.
          </p>
          <CodeBlock code={`Base URL: ${API_BASE}/api/v1`} />
          <nav className="flex flex-wrap gap-x-l gap-y-xs type-small">
            {ENDPOINTS.map((endpoint) => (
              <a
                key={endpoint.id}
                href={`#${endpoint.id}`}
                className={linkClass}
              >
                {endpoint.title}
              </a>
            ))}
            <a href="#errors" className={linkClass}>
              Errors
            </a>
          </nav>
        </section>

        <section
          id="authentication"
          className="flex scroll-mt-xl flex-col gap-m"
        >
          <h2 className="type-heading">Authentication</h2>
          <p className="type-body text-imagine-foreground-muted">
            Authenticate every request with your organization&apos;s API key in
            the Authorization header. You can generate, copy, and rotate your
            key in{" "}
            <Link href="/settings/api" className={linkClass}>
              Settings → API
            </Link>
            {". Keys look like "}
            <code className="font-mono type-small">imga_...</code> and there is
            one key per organization.
          </p>
          <CodeBlock
            code={`curl "${API_BASE}/api/v1/clients" \\
  -H "Authorization: Bearer imga_your_api_key"`}
          />
          <ul className="flex list-disc flex-col gap-xxs pl-l type-small text-imagine-foreground-muted">
            <li>
              Rotating a key invalidates the old one immediately; update your
              integrations right after rotating.
            </li>
            <li>
              Keep the key secret. Treat it like a password: server-side only,
              never in client-side code or public repositories.
            </li>
            <li>Requests without a valid key receive a 401 response.</li>
          </ul>
        </section>

        <section id="conventions" className="flex scroll-mt-xl flex-col gap-m">
          <h2 className="type-heading">Conventions</h2>
          <ul className="flex list-disc flex-col gap-s pl-l type-body text-imagine-foreground-muted">
            <li>
              Successful responses have the shape{" "}
              <code className="font-mono type-small">
                {'{ "data": ..., "meta": { ... } }'}
              </code>
              . Errors have the shape{" "}
              <code className="font-mono type-small">
                {'{ "error": { "code": string, "message": string } }'}
              </code>
              .
            </li>
            <li>
              Dates are ISO 8601. Date filtering matches each post&apos;s
              publish time (scheduled time when available, otherwise creation
              time).
            </li>
            <li>
              Paginated endpoints accept{" "}
              <code className="font-mono type-small">limit</code> (default 50,
              max 100) and <code className="font-mono type-small">offset</code>{" "}
              (default 0), and return{" "}
              <code className="font-mono type-small">returned</code> and{" "}
              <code className="font-mono type-small">has_more</code> in{" "}
              <code className="font-mono type-small">meta</code>. Page until{" "}
              <code className="font-mono type-small">has_more</code> is false.
            </li>
          </ul>
        </section>

        {ENDPOINTS.map((endpoint) => (
          <EndpointSection key={endpoint.id} endpoint={endpoint} />
        ))}

        <section id="errors" className="flex scroll-mt-xl flex-col gap-m">
          <h2 className="type-heading">Errors</h2>
          <p className="type-body text-imagine-foreground-muted">
            All errors share one format:
          </p>
          <CodeBlock
            code={`{
  "error": {
    "code": "invalid_api_key",
    "message": "Invalid or missing API key"
  }
}`}
          />
          <DocsTable
            columns={["Code", "Status", "Description"]}
            rows={ERROR_ROWS.map((row) => [
              row.code,
              row.status,
              row.description,
            ])}
          />
        </section>

        <p className="border-t border-imagine-border pt-l type-small text-imagine-foreground-muted">
          Questions or missing data you need? Contact your Imagine AI account
          manager.
        </p>
      </main>
    </div>
  );
}

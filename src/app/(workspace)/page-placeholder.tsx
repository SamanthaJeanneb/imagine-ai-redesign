/**
 * Stands in for a page until its phase lands, so navigation and transitions can
 * be reviewed early. Each one gets deleted by the phase that builds the page.
 */
export function PagePlaceholder({
  title,
  note,
}: {
  title: string;
  note: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-s">
      <h1 className="type-title">{title}</h1>
      <p className="type-body text-imagine-foreground-muted">{note}</p>
    </div>
  );
}

interface PlaceholderPageProps {
  title: string;
  /** What this page will become — shown instead of the default "Coming soon." */
  description?: string;
}

/** Generic "not built yet" page content for modules mid-port. */
export function PlaceholderPage({ title, description = 'Coming soon.' }: PlaceholderPageProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-foreground-secondary">{description}</p>
    </div>
  );
}

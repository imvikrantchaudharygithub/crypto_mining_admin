type PageHeaderProps = {
  section: string;
  title: string;
  description: string;
};

export function PageHeader({ section, title, description }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="section-tag mb-2">{section}</p>
        <h1 className="font-display text-3xl text-navy-900">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-navy-500">{description}</p>
      </div>

      <button type="button" className="btn-primary">
        <span className="dot" aria-hidden />
        Save Draft
      </button>
    </div>
  );
}

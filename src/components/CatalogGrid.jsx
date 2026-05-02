import ContentCard from './ContentCard.jsx';

function CatalogGrid({ title, items, loading = false }) {
  if (loading) {
    return (
      <section className="py-6">
        <div className="h-6 w-32 bg-sb-surface rounded animate-shimmer mb-4" />
        <div className="content-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-sb-card rounded-xl animate-shimmer" />
          ))}
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <section className="py-6">
      <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
      <div className="content-grid">
        {items.map((item) => (
          <ContentCard key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  );
}

export default CatalogGrid;

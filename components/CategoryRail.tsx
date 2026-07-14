import Link from "next/link";

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface CategoryRailProps {
  categories: Category[];
  activeId?: string;
}

export function CategoryRail({ categories, activeId }: CategoryRailProps) {
  return (
    <div className="filter-rail">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/suppliers?category=${cat.id}`}
          className={`cat-pill${activeId === cat.id ? " active" : ""}`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}

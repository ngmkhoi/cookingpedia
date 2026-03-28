import Link from "next/link";
import { apiGet } from "@/lib/api";

type AuthorPageProps = {
  params: Promise<{ username: string }>;
};

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { username } = await params;
  const { author } = await apiGet<{ author: any }>(`/users/authors/${username}`);

  return (
    <main className="page-shell py-10">
      <section className="panel mb-8 grid gap-4 p-8 md:grid-cols-[120px_1fr]">
        <div className="size-[120px] rounded-full bg-stone-300">
          {author.avatarUrl ? (
            <img
              src={author.avatarUrl}
              alt={author.displayName}
              className="size-full rounded-full object-cover"
            />
          ) : null}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Author profile
          </p>
          <h1 className="mt-2 text-4xl tracking-tight">{author.displayName}</h1>
          <p className="mt-3 max-w-[60ch] leading-relaxed text-[var(--muted)]">
            {author.bio}
          </p>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {author.recipes.map((recipe: any) => (
          <Link
            key={recipe.id}
            href={`/recipes/${recipe.slug}`}
            className="panel overflow-hidden transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="aspect-[4/3] bg-stone-200">
              {recipe.coverImageUrl ? (
                <img
                  src={recipe.coverImageUrl}
                  alt={recipe.title}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="space-y-2 p-5">
              <h2 className="text-2xl tracking-tight">{recipe.title}</h2>
              <p className="text-sm text-[var(--muted)]">
                {recipe.shortDescription}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

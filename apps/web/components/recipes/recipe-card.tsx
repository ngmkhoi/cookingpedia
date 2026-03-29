import Link from "next/link";
import { RecipeSaveButton } from "./recipe-save-button";
import { CardSurface } from "../ui/card-surface";

type RecipeCardProps = {
  recipe: {
    id: string;
    slug: string;
    title: string;
    coverImageUrl?: string | null;
    cookMinutes: number;
    prepMinutes: number;
    ratingAverage: number;
    author: {
      username: string;
      displayName: string;
    };
  };
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <CardSurface className="panel-hover relative overflow-hidden">
      <div className="absolute right-4 top-4 z-10">
        <RecipeSaveButton recipeId={recipe.id} showLabel={false} className="rounded-full px-3" />
      </div>
      <Link href={`/recipes/${recipe.slug}`} className="group block">
        <div className="img-zoom aspect-[4/3]">
          <div
            aria-label={recipe.title}
            className="h-full w-full bg-[linear-gradient(155deg,#d7d2c8,#ece8df)] bg-cover bg-center"
            style={
              recipe.coverImageUrl
                ? {
                    backgroundImage: `linear-gradient(rgba(22, 32, 25, 0.05), rgba(22, 32, 25, 0.10)), url(${recipe.coverImageUrl})`
                  }
                : undefined
            }
          />
        </div>
        <div className="flex flex-col gap-3 p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted-warm)]">
            {recipe.author.displayName}
          </p>
          <h3 className="text-xl tracking-tight">{recipe.title}</h3>
          <div className="flex items-center justify-between text-sm text-[var(--muted-warm)]">
            <span>{recipe.prepMinutes + recipe.cookMinutes} min total</span>
            <span>{recipe.ratingAverage.toFixed(1)} / 5</span>
          </div>
        </div>
      </Link>
    </CardSurface>
  );
}

import { redirect } from "next/navigation";

type LegacyEditRecipePageProps = {
  params: Promise<{ id: string }>;
};

export default async function LegacyEditRecipePage({
  params
}: LegacyEditRecipePageProps) {
  const { id } = await params;
  redirect(`/my-recipes/${id}/edit`);
}

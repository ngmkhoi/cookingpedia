import { redirect } from "next/navigation";

export default function LegacyNewRecipePage() {
  redirect("/my-recipes/new");
}

import { AuthForm } from "../../components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="page-shell py-16">
      <h1 className="mb-8 text-4xl tracking-tight">Sign in to Cookpedia</h1>
      <AuthForm mode="login" />
    </main>
  );
}

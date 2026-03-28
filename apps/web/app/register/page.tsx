import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <main className="page-main-roomy">
      <h1 className="mb-8 text-4xl tracking-tight">Create your Cookpedia account</h1>
      <AuthForm mode="register" />
    </main>
  );
}

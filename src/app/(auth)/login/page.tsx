import { LoginForm } from '@/components/auth/login-form';

export default function Login() {
  return (
    <div
      className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-cover bg-center bg-blue-950"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
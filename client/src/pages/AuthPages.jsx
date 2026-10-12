import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import usePageMeta from '../hooks/usePageMeta';

function Field({ label, error, children }) {
  return <label className="block text-sm font-medium">{label}<div className="mt-1.5">{children}</div>{error && <p className="mt-1 text-xs text-red-700" role="alert">{error}</p>}</label>;
}

function Shell({ title, subtitle, children, footer }) {
  return (
    <div className="container-x flex justify-center py-14">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block font-display text-2xl font-semibold">Lumora<span className="text-wax"> Candles</span></Link>
        </div>
        <div className="card sm:p-9">
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="mt-1.5 text-sm text-stone">{subtitle}</p>
          <div className="mt-6">{children}</div>
          <p className="mt-6 text-center text-sm text-stone">{footer}</p>
        </div>
      </div>
    </div>
  );
}

export function Login() {
  usePageMeta('Log in');
  const { user, login } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const from = useLocation().state?.from || '/';
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={from} replace />;

  const submit = async (d) => {
    setBusy(true);
    try { const u = await login(d.email, d.password); toast(`Welcome back, ${u.name.split(' ')[0]}`); nav(from, { replace: true }); }
    catch (e) { toast(e.userMessage, 'error'); } finally { setBusy(false); }
  };
  return (
    <Shell title="Log in" subtitle="Welcome back. Pick up where you left off." footer={<>New to Lumora? <Link to="/register" className="font-semibold text-fig hover:underline">Create an account</Link></>}>
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <Field label="Email" error={errors.email?.message}><input type="email" autoComplete="email" className="input" {...register('email', { required: 'Enter your email', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })} /></Field>
        <Field label="Password" error={errors.password?.message}><input type="password" autoComplete="current-password" className="input" {...register('password', { required: 'Enter your password' })} /></Field>
        <Link to="/forgot-password" className="block text-right text-xs text-fig hover:underline">Forgot password?</Link>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </Shell>
  );
}

export function Register() {
  usePageMeta('Create account');
  const { user, register: signup } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  const submit = async (d) => {
    setBusy(true);
    try { await signup({ name: d.name, email: d.email, phone: d.phone, password: d.password }); toast('Your account is ready'); nav('/'); }
    catch (e) { toast(e.userMessage, 'error'); } finally { setBusy(false); }
  };
  return (
    <Shell title="Create your account" subtitle="Save your cart, track orders and check out faster." footer={<>Already have an account? <Link to="/login" className="font-semibold text-fig hover:underline">Log in</Link></>}>
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <Field label="Full name" error={errors.name?.message}><input autoComplete="name" className="input" {...register('name', { required: 'Enter your name', minLength: { value: 2, message: 'Name is too short' } })} /></Field>
        <Field label="Email" error={errors.email?.message}><input type="email" autoComplete="email" className="input" {...register('email', { required: 'Enter your email', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })} /></Field>
        <Field label="Phone (optional)" error={errors.phone?.message}><input type="tel" autoComplete="tel" className="input" {...register('phone', { pattern: { value: /^[0-9+\-\s]{10,15}$/, message: 'Enter a valid phone number' } })} /></Field>
        <Field label="Password" error={errors.password?.message}><input type="password" autoComplete="new-password" className="input" {...register('password', { required: 'Choose a password', minLength: { value: 8, message: 'Use at least 8 characters' }, validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || 'Include a letter and a number' })} /></Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
    </Shell>
  );
}

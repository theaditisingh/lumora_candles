import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import usePageMeta from '../hooks/usePageMeta';

const Card = ({ title, children }) => <div className="container-x flex justify-center py-14"><div className="w-full max-w-md rounded-2xl bg-paper p-8"><h1 className="text-3xl">{title}</h1><div className="mt-5">{children}</div></div></div>;

export function ForgotPassword() {
  usePageMeta('Forgot password');
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [done, setDone] = useState(null);
  const submit = async (d) => { try { const r = await api.post('/auth/forgot-password', d); setDone(r.data.data); } catch (e) { toast(e.userMessage, 'error'); } };
  return (
    <Card title="Forgot your password?">
      {done ? <div className="space-y-3 text-sm"><p>If an account exists for that email, we have sent a reset link. It is valid for one hour.</p>
        {done.devResetLink && <p className="rounded-lg bg-oat p-3">Development mode: email sending is not set up yet. <a className="font-semibold text-fig underline" href={done.devResetLink.replace(/^https?:\/\/[^/]+/, '')}>Open the reset link</a></p>}</div> : (
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <label className="block text-sm font-medium">Email<input type="email" className="input mt-1" {...register('email', { required: 'Enter your email', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })} />{errors.email && <span className="text-xs text-red-700">{errors.email.message}</span>}</label>
          <button className="btn-primary w-full">Send reset link</button><Link to="/login" className="block text-center text-sm text-fig">Back to log in</Link>
        </form>)}
    </Card>
  );
}

export function ResetPassword() {
  usePageMeta('Reset password');
  const [p] = useSearchParams();
  const nav = useNavigate();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const submit = async (d) => { try { await api.post('/auth/reset-password', { token: p.get('token'), password: d.password }); toast('Password updated. Please log in.'); nav('/login'); } catch (e) { toast(e.userMessage, 'error'); } };
  if (!p.get('token')) return <Card title="Reset link missing"><p className="text-sm">Open the link from your reset email, or <Link className="text-fig underline" to="/forgot-password">request a new one</Link>.</p></Card>;
  return (
    <Card title="Choose a new password">
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <label className="block text-sm font-medium">New password<input type="password" autoComplete="new-password" className="input mt-1" {...register('password', { required: 'Choose a password', minLength: { value: 8, message: 'Use at least 8 characters' }, validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || 'Include a letter and a number' })} />{errors.password && <span className="text-xs text-red-700">{errors.password.message}</span>}</label>
        <button className="btn-primary w-full">Update password</button>
      </form>
    </Card>
  );
}

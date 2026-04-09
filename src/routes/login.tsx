import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { requestMagicLink } from '@/api/auth';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: requestMagicLink,
    onSuccess: (_, vars) => {
      setSubmittedEmail(vars);
    },
  });

  if (submittedEmail) {
    return (
      <AuthShell>
        <Card>
          <CardHeader>
            <CardTitle>Check your inbox</CardTitle>
            <CardDescription>
              We sent a sign-in link to <strong>{submittedEmail}</strong>. The link expires in
              15 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="ghost"
              onClick={() => {
                setSubmittedEmail(null);
                form.reset();
              }}
            >
              Use a different email
            </Button>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Enter your email address and we&rsquo;ll send you a sign-in link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values.email))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-ph-charcoal">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>

            <Button type="submit" variant="ph" disabled={mutation.isPending}>
              {mutation.isPending ? 'Sending…' : 'Send sign-in link'}
            </Button>

            {mutation.isError && (
              <p className="text-xs text-red-600">
                Something went wrong. Please try again in a moment.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

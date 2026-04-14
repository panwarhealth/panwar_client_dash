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
import { requestMagicLink, resolveLoginMethod } from '@/api/auth';
import { msalInstance, loginRequest } from '@/lib/msal';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const submit = useMutation({
    mutationFn: async (email: string) => {
      const method = await resolveLoginMethod(email);
      if (method === 'magic-link') {
        await requestMagicLink(email);
        return { outcome: 'magic-link-sent', email } as const;
      }
      if (method === 'entra') {
        await msalInstance.initialize();
        await msalInstance.loginRedirect(loginRequest);
        return { outcome: 'entra-redirect' } as const;
      }
      return { outcome: 'denied' } as const;
    },
    onSuccess: (result) => {
      if (result.outcome === 'magic-link-sent') setSentTo(result.email);
      if (result.outcome === 'denied') setDenied(true);
    },
  });

  if (sentTo) {
    return (
      <MagicLinkSentCard
        email={sentTo}
        onReset={() => {
          setSentTo(null);
          form.reset();
        }}
      />
    );
  }

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Enter your email to continue. Clients get an emailed sign-in link; staff
            are taken to Microsoft sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((values) => {
              setDenied(false);
              submit.mutate(values.email);
            })}
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

            <Button type="submit" variant="ph" disabled={submit.isPending}>
              {submit.isPending ? 'Checking…' : 'Continue'}
            </Button>

            {denied && (
              <p className="text-xs text-red-600">
                We couldn&rsquo;t find an account for that email. Contact Panwar Health
                if you believe this is an error.
              </p>
            )}
            {submit.isError && !denied && (
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

function MagicLinkSentCard({ email, onReset }: { email: string; onReset: () => void }) {
  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle>Check your inbox</CardTitle>
          <CardDescription>
            We sent a sign-in link to <strong>{email}</strong>. The link expires in 15 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="ghost" onClick={onReset}>
            Use a different email
          </Button>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

import { useEffect, useRef } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { AuthShell } from '@/components/AuthShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { verifyMagicLink } from '@/api/auth';

const searchSchema = z.object({
  token: z.string().min(1),
});

export const Route = createFileRoute('/auth/verify')({
  validateSearch: searchSchema,
  component: VerifyPage,
});

function VerifyPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const verifiedRef = useRef(false);

  const mutation = useMutation({
    mutationFn: verifyMagicLink,
    onSuccess: (user) => {
      queryClient.setQueryData(['me'], user);
      void navigate({ to: '/dashboard', replace: true });
    },
  });

  // Single-shot verification on mount. The ref guards against React 19
  // strict-mode double-invocation in development.
  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;
    mutation.mutate(token);
  }, [mutation, token]);

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle>Signing you in</CardTitle>
          <CardDescription>
            {mutation.isError
              ? 'That sign-in link is invalid or has expired. Request a new one to continue.'
              : 'Verifying your sign-in link…'}
          </CardDescription>
        </CardHeader>
        {mutation.isError && (
          <CardContent>
            <Button variant="ph" onClick={() => navigate({ to: '/login' })}>
              Back to sign in
            </Button>
          </CardContent>
        )}
      </Card>
    </AuthShell>
  );
}

'use client';
import { GoogleIcon } from '@/features/auth/components/google-icon';
import { useGoogleSignIn } from '@/features/auth/hooks/use-google-sign-in';
import { Button } from '@/shared/components/ui/button';

export const GoogleSignInButton = () => {
  const { signInWithGoogle, pending, error } = useGoogleSignIn();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => void signInWithGoogle()}
        className="h-12 w-full rounded-full text-base font-semibold active:scale-95"
      >
        <GoogleIcon className="size-5" />
        {pending ? 'Redirecting...' : 'Continue with Google'}
      </Button>
      {error && <p className="text-center text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
};

'use client';
import { Component, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BoundaryProps {
  children: ReactNode;
  title: string;
  description: string;
  retryLabel: string;
}

interface State {
  hasError: boolean;
}

class ErrorBoundaryBase extends Component<BoundaryProps, State> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch() {
    // можно логировать в Sentry и т.д.
  }

  render() {
    if (this.state.hasError) {
      const { title, description, retryLabel } = this.props;
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <AlertTriangle className="size-12 text-destructive" />
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground max-w-md">{description}</p>
          <Button onClick={() => this.setState({ hasError: false })}>
            {retryLabel}
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  const t = useTranslations('common');
  return (
    <ErrorBoundaryBase
      title={t('errorTitle')}
      description={t('errorDescription')}
      retryLabel={t('tryAgain')}
    >
      {children}
    </ErrorBoundaryBase>
  );
}

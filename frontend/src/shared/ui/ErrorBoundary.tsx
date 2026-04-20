'use client';
import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
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
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <AlertTriangle className="size-12 text-destructive" />
          <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
          <p className="text-muted-foreground max-w-md">
            Произошла непредвиденная ошибка. Попробуйте обновить страницу.
          </p>
          <Button onClick={() => this.setState({ hasError: false })}>
            Попробовать снова
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

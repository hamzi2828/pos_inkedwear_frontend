// Simple toast utility without external dependencies
export interface ToastOptions {
  duration?: number;
  position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';
}

class SimpleToast {
  private static instance: SimpleToast;
  private container: HTMLElement | null = null;

  public static getInstance(): SimpleToast {
    if (!SimpleToast.instance) {
      SimpleToast.instance = new SimpleToast();
    }
    return SimpleToast.instance;
  }

  private createContainer(): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  private createToast(message: string, type: 'success' | 'error' | 'loading', options: ToastOptions = {}): HTMLElement {
    const toast = document.createElement('div');
    const { duration = 3000 } = options;

    const bgColor = {
      success: '#10b981',
      error: '#ef4444',
      loading: '#6b7280'
    }[type];

    toast.style.cssText = `
      background: ${bgColor};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 400px;
      font-size: 14px;
      font-weight: 500;
    `;

    const icon = type === 'loading' ? '⏳' : type === 'success' ? '✅' : '❌';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

    return toast;
  }

  public success(message: string, options: ToastOptions = {}): void {
    this.show(message, 'success', options);
  }

  public error(message: string, options: ToastOptions = {}): void {
    this.show(message, 'error', options);
  }

  public loading(message: string): { dismiss: () => void } {
    const toast = this.show(message, 'loading', { duration: 0 });
    return {
      dismiss: () => this.dismiss(toast)
    };
  }

  private show(message: string, type: 'success' | 'error' | 'loading', options: ToastOptions = {}): HTMLElement {
    if (typeof window === 'undefined') {
      console.log(`Toast ${type}: ${message}`);
      return document.createElement('div');
    }

    this.createContainer();
    const toast = this.createToast(message, type, options);
    
    if (this.container) {
      this.container.appendChild(toast);
      
      // Animate in
      setTimeout(() => {
        toast.style.transform = 'translateX(0)';
      }, 10);

      // Auto dismiss
      const { duration = 3000 } = options;
      if (duration > 0) {
        setTimeout(() => {
          this.dismiss(toast);
        }, duration);
      }
    }

    return toast;
  }

  private dismiss(toast: HTMLElement): void {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
}

// Export singleton instance
export const toast = SimpleToast.getInstance();

// Mock react-hot-toast API for compatibility
export const mockToast = {
  success: (message: string, options?: ToastOptions) => toast.success(message, options),
  error: (message: string, options?: ToastOptions) => toast.error(message, options),
  loading: (message: string) => toast.loading(message),
  dismiss: () => {} // Not implemented for simplicity
};
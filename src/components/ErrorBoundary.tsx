import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

/**
 * حاجز أخطاء عام يمنع شاشة بيضاء عند وقوع خطأ غير متوقع في أي مكوّن.
 * لا يعرض تفاصيل تقنية للمستخدم، بل رسالة عربية واضحة مع خيار إعادة التحميل.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : undefined,
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8 max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-slate-900">حدث خطأ غير متوقع</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              تعذر عرض هذه الصفحة. يمكنك إعادة تحميل التطبيق والمحاولة مجدداً. إذا تكرر الخطأ،
              تحقق من اتصالك بالإنترنت أو تواصل مع الدعم.
            </p>
          </div>
          <button
            onClick={this.handleReload}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة تحميل التطبيق</span>
          </button>
        </div>
      </div>
    );
  }
}

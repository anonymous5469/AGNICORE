import { Shield } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0e1a]">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" 
            style={{ animationDuration: '1s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm font-medium text-white tracking-wider">
            Initializing Secure Environment
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Loading 3D assets...
          </p>
        </div>
      </div>
    </div>
  );
}

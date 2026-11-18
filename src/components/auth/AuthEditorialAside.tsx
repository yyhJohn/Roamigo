import { Link } from 'react-router-dom';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { RoamigoLogo } from '../ui/RoamigoLogo';

export function AuthEditorialAside() {
  return (
    <div className="hidden flex-col justify-between bg-[#103D3B] p-10 text-white lg:col-span-5 lg:flex">
      <Link to="/" className="inline-block">
        <div className="inline-flex rounded-xl bg-white/95 px-3 py-2">
          <RoamigoLogo showTagline />
        </div>
      </Link>
      <div className="space-y-5">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[#A7F3CF]/15 px-3 py-1 text-xs font-semibold text-[#A7F3CF]">
          <Sparkles className="h-3.5 w-3.5" />
          Collaborative Group Travel Workspace
        </p>
        <h1 className="font-display text-3xl leading-tight font-extrabold">
          Plan trips everyone actually agrees on—without spreadsheet chaos.
        </h1>
        <ul className="space-y-3 text-sm text-emerald-50/90">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#A7F3CF]" />
            <span>Reconcile mixed budgets, pace preferences, and interests.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#A7F3CF]" />
            <span>Vote in real time and preview AI edits before they apply.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#A7F3CF]" />
            <span>Split shared expenses to the exact penny or cent.</span>
          </li>
        </ul>
      </div>
      <p className="text-xs text-emerald-100/70">
        Secure HttpOnly sessions · Per-trip role permissions · Export anytime
      </p>
    </div>
  );
}

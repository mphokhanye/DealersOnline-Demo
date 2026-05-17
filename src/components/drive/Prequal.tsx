import { useState } from "react";
import { TopBar } from "./TopBar";
import { ScoreCircle } from "./ScoreCircle";
import { Lock, Phone } from "lucide-react";
import { HelpWidget, HELP_CONTENT } from "./HelpWidget";

interface PrequalProps {
  query: string;
  answers: Record<string, string>;
  na: Record<string, string>;
  fromCompare?: boolean;
  onNav: (screen: string, data?: Record<string, unknown>) => void;
}

export function Prequal({ query, answers, na, fromCompare, onNav }: PrequalProps) {
  const [phase, setPhase] = useState<"form" | "loading" | "results">("form");
  const [form, setForm] = useState({ name: "Lerato", surname: "Dlamini", id: "9801010001089", income: "22000" });
  const [consent, setConsent] = useState({ thirdParty: false, terms: false });
  const [maxMonthly, setMaxMonthly] = useState("");

  const canSubmit = consent.thirdParty && consent.terms && form.name && form.id && form.income;

  function submit() {
    if (!canSubmit) return;
    setPhase("loading");
    setTimeout(() => setPhase("results"), 2000);
  }

  if (phase === "form") {
    return (
      <div className="bg-background min-h-screen">
        <TopBar title="Pre-qualification" onBack={() => onNav("needs", { query, answers, na })} />
        <div className="px-5 pt-5 pb-8 max-w-md mx-auto">
          <p className="text-sm text-soft leading-relaxed mb-5">
            We just need a few details. This is a <strong className="text-foreground">soft check</strong> — it won't affect your credit score.
          </p>
          {([["Name", "name", "Lerato"], ["Surname", "surname", "Dlamini"], ["ID Number", "id", "980101 0001 089"], ["Net Monthly Income (R)", "income", "22 000"]] as const).map(([label, key, placeholder]) => (
            <div key={key} className="mb-3.5">
              <label className="text-[11px] text-soft block mb-1.5 font-semibold uppercase tracking-wider">{label}</label>
              <input
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl border-[1.5px] border-sand text-sm text-foreground bg-card font-body outline-none focus:border-terra transition-colors"
              />
            </div>
          ))}

          {/* Consent checkboxes */}
          <div className="mb-4 flex flex-col gap-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent.thirdParty}
                onChange={e => setConsent(c => ({ ...c, thirdParty: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded border-sand accent-terra shrink-0"
              />
              <span className="text-xs text-soft leading-relaxed">
                I consent to third-party data sharing for <strong className="text-foreground">credit, affordability, and fraud checks</strong>.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent.terms}
                onChange={e => setConsent(c => ({ ...c, terms: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded border-sand accent-terra shrink-0"
              />
              <span className="text-xs text-soft leading-relaxed">
                I accept the <span className="text-terra underline cursor-pointer">Terms and Conditions</span>.
              </span>
            </label>
          </div>

          <div className="bg-info-bg rounded-lg px-3.5 py-3 mb-5 flex gap-2 items-start">
            <Lock size={14} className="text-info shrink-0 mt-0.5" />
            <p className="text-xs text-info leading-relaxed m-0">Your data is used only to generate your eligibility result. We never sell your information.</p>
          </div>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className={`w-full border-none rounded-full px-6 py-3.5 text-sm font-semibold cursor-pointer font-body transition-opacity ${
              canSubmit ? "bg-terra text-primary-foreground hover:opacity-90" : "bg-sand text-soft cursor-not-allowed"
            }`}
          >
            Check my eligibility →
          </button>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90 animate-spin-slow" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" className="stroke-sand" strokeWidth="3" />
              <circle cx="32" cy="32" r="26" fill="none" className="stroke-terra" strokeWidth="3" strokeLinecap="round" strokeDasharray="163" strokeDashoffset="120" />
            </svg>
          </div>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Checking your eligibility</h2>
          <p className="text-sm text-soft">Running a soft credit check…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <TopBar title="Your results" />
      <div className="px-5 pt-5 pb-8 max-w-md mx-auto">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Hi, {form.name} 👋</h2>
        <p className="text-sm text-soft mb-6">Here's your financial snapshot.</p>

        <div className="flex justify-between mb-6 px-2">
          <ScoreCircle label="Credit Score" value="Good" colorClass="success" percentage={78} animated />
          <ScoreCircle label="Debt Level" value="Manageable" colorClass="warning" percentage={45} animated />
          <ScoreCircle label="Affordability" value="Average" colorClass="info" percentage={60} animated />
        </div>

        <div className="bg-foreground rounded-2xl p-5 mb-4">
          <p className="text-[11px] text-card/60 uppercase tracking-[1.5px] mb-1.5 font-semibold">Estimated Approval Amount</p>
          <p className="font-heading text-4xl font-bold text-terra m-0 mb-1">R285,000</p>
          <div className="flex gap-2 items-baseline">
            <span className="text-2xl text-card font-semibold">R5,450</span>
            <span className="text-sm text-card/60">per month · 72 months</span>
          </div>
          <div className="mt-3 pt-3 border-t border-card/10">
            <span className="text-sm text-terra">🚗 300 cars in your range</span>
          </div>
        </div>

        <button
          onClick={() => {}}
          className="w-full bg-card border-[1.5px] border-sand rounded-xl px-4 py-3.5 mb-4 flex items-center gap-3 cursor-pointer font-body hover:border-terra/40 transition-colors"
        >
          <Phone size={18} className="text-terra" />
          <div className="text-left">
            <div className="text-sm font-semibold text-foreground">Request a callback</div>
            <div className="text-xs text-soft">An advisor will contact you</div>
          </div>
        </button>

        <p className="text-[15px] font-semibold text-foreground mb-3">Are you happy with R5,450/pm?</p>
        <div className="flex flex-col gap-2 mb-5">
          <button
            onClick={() => fromCompare
              ? onNav("compareSelect", { prequalified: true, monthly: 5450 })
              : onNav("vehicleSearch", { query, answers, na, prequalified: true, monthly: 5450 })}
            className="bg-card border-[1.5px] border-sand rounded-xl px-4 py-3.5 text-left cursor-pointer font-body hover:border-success/40 transition-colors"
          >
            <div className="text-sm font-semibold text-success">
              {fromCompare ? "✓ It's perfect — compare cars" : "✓ It's perfect — find my car"}
            </div>
            <div className="text-xs text-soft mt-0.5">
              {fromCompare ? "Pick the two cars to compare" : "Show me 300 cars in this range"}
            </div>
          </button>
          <div className="bg-card border-[1.5px] border-sand rounded-xl px-4 py-3.5">
            <div className="text-sm font-semibold text-foreground mb-2">↓ I'd like to spend less</div>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-soft">R</span>
              <input
                value={maxMonthly}
                onChange={e => setMaxMonthly(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter max monthly"
                className="flex-1 border border-sand rounded-lg px-3 py-2 text-sm font-body outline-none focus:border-terra transition-colors bg-background"
              />
              <button
                onClick={() => {
                  const m = parseInt(maxMonthly);
                  if (!m || m <= 0) return;
                  if (fromCompare) onNav("compareSelect", { prequalified: true, monthly: m });
                  else onNav("vehicleSearch", { query, answers, na, prequalified: true, monthly: m });
                }}
                disabled={!maxMonthly || parseInt(maxMonthly) <= 0}
                className="bg-terra text-primary-foreground border-none rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      </div>
      <HelpWidget context="prequal" topics={HELP_CONTENT.prequal} />
    </div>
  );
}

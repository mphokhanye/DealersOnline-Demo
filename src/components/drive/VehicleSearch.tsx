import { useState } from "react";
import { TopBar } from "./TopBar";
import { BankOffers } from "./BankOffers";
import { ContractScan } from "./ContractScan";
import { Fuel, Tag, ArrowLeftRight, Search, FileCheck, CircleDollarSign, ChevronDown, ChevronUp, Heart, Flame } from "lucide-react";
import { HelpWidget, HELP_CONTENT } from "./HelpWidget";

interface VehicleSearchProps {
  query: string;
  answers: Record<string, string>;
  na: Record<string, string>;
  prequalified: boolean;
  monthly?: number;
  onNav: (screen: string, data?: Record<string, unknown>) => void;
}

const CARS = [
  { id: 1, make: "Toyota", model: "Corolla", year: 2020, mileage: "62,000 km", price: "R219,900", monthly: "R4,890/pm", servicePlan: true, transmission: "Automatic", fuelType: "Petrol", fuel: 6.8, match: 96, tag: "Best match" },
  { id: 2, make: "Honda", model: "Civic", year: 2019, mileage: "54,000 km", price: "R198,500", monthly: "R4,420/pm", servicePlan: true, transmission: "Manual", fuelType: "Petrol", fuel: 7.1, match: 91, tag: "Fuel saver" },
  { id: 3, make: "Mazda", model: "3", year: 2021, mileage: "38,000 km", price: "R249,000", monthly: "R5,380/pm", servicePlan: false, transmission: "Automatic", fuelType: "Petrol", fuel: 6.5, match: 87, tag: "Premium feel" },
  { id: 4, make: "Hyundai", model: "Elantra", year: 2020, mileage: "71,000 km", price: "R179,900", monthly: "R4,010/pm", servicePlan: true, transmission: "Manual", fuelType: "Diesel", fuel: 7.4, match: 83, tag: "Best price" },
  { id: 5, make: "VW", model: "Polo", year: 2021, mileage: "29,000 km", price: "R265,000", monthly: "R5,450/pm", servicePlan: true, transmission: "Automatic", fuelType: "Diesel", fuel: 6.2, match: 79, tag: "Low mileage" },
];

type ModalType = "fuel" | "reduce" | "tradeIn" | "balloon" | null;

function FuelModal({ car, onClose }: { car: typeof CARS[0]; onClose: () => void }) {
  const [commute, setCommute] = useState("same");
  const fuelPrice = 21.5;
  const km = commute === "same" ? 30 * 2 * 22 : 120 * 2 * 22;
  const cost = Math.round((km / 100) * car.fuel * fuelPrice);
  return (
    <div className="fixed inset-0 bg-foreground/40 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-card rounded-t-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="font-heading text-xl font-bold text-foreground mb-1">⛽ Fuel cost estimate</h3>
        <p className="text-[13px] text-soft mb-5">{car.year} {car.make} {car.model} · {car.fuel}L/100km</p>
        <p className="text-[13px] text-foreground font-semibold mb-2.5">Do you live and work in the same city?</p>
        <div className="flex gap-2 mb-5">
          {([["same", "Yes, same city"], ["diff", "Different cities"]] as const).map(([val, label]) => (
            <button key={val} onClick={() => setCommute(val)} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold cursor-pointer border-none transition-colors ${
              commute === val ? "bg-terra text-primary-foreground" : "bg-muted text-soft"
            }`}>{label}</button>
          ))}
        </div>
        <div className="bg-muted rounded-2xl px-5 py-4 text-center">
          <p className="text-xs text-soft mb-1 m-0">Estimated monthly fuel cost</p>
          <p className="font-heading text-4xl font-bold text-terra m-0 mb-1">R{cost.toLocaleString()}</p>
          <p className="text-[11px] text-soft m-0">Based on ~{Math.round(km).toLocaleString()} km/pm · R{fuelPrice}/L</p>
        </div>
        <button onClick={onClose} className="w-full mt-4 py-3 rounded-full bg-muted text-soft border-none text-sm font-semibold cursor-pointer">Close</button>
      </div>
    </div>
  );
}

type TradeMode = "none" | "owned" | "financed";

interface DealChanges {
  discountPct: number;
  deposit: number;
  tradeIn: number;
  balloonPct: number;
  balloonOn: boolean;
  newMonthly: number;
  newPrice: number;
}

function ReducePriceModal({ car, onClose, onApply }: { car: typeof CARS[0]; onClose: () => void; onApply?: (changes: DealChanges) => void }) {
  const basePrice = parseInt(car.price.replace(/\D/g, ""));
  const [discountPct, setDiscountPct] = useState(8);
  const [deposit, setDeposit] = useState(0);
  const [balloonPct, setBalloonPct] = useState(0);
  const [balloonOn, setBalloonOn] = useState(false);

  // Progressive disclosure
  const [step, setStep] = useState(1); // 1=discount, 2=deposit+trade, 3=balloon+value

  // Trade-in flow
  const [tradeMode, setTradeMode] = useState<"none" | "owned" | "financed">("none");
  const [ownedValue, setOwnedValue] = useState(0);
  const [finInstalment, setFinInstalment] = useState(0);
  const [finTerm, setFinTerm] = useState(72);
  const [finPaid, setFinPaid] = useState(0);

  const remainingMonths = Math.max(0, finTerm - finPaid);
  const estSettlement = Math.round(finInstalment * remainingMonths * 0.7);
  const estMarketValue = Math.round(finInstalment * finTerm * 0.55);
  const finEquity = estMarketValue - estSettlement;

  let tradeIn = 0;
  if (tradeMode === "owned") tradeIn = ownedValue;
  else if (tradeMode === "financed") tradeIn = Math.max(0, finEquity);

  const discountAmt = Math.round(basePrice * discountPct / 100);
  const afterDiscount = basePrice - discountAmt;
  const balloonAmt = balloonOn ? Math.round(afterDiscount * balloonPct / 100) : 0;
  const financed = Math.max(0, afterDiscount - deposit - tradeIn - balloonAmt);
  const r = 0.115 / 12;
  const n = 72;
  const monthly = financed > 0 ? Math.round((financed * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)) : 0;
  const originalMonthly = Math.round((basePrice * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  const totalSaving = basePrice - (afterDiscount - deposit - tradeIn);
  const monthlySaving = originalMonthly - monthly;

  // Residual values
  const residual48 = Math.round(basePrice * 0.55);
  const residual60 = Math.round(basePrice * 0.45);
  const residual72 = Math.round(basePrice * 0.38);
  const residuals: Record<number, number> = { 48: residual48, 60: residual60, 72: residual72 };

  // Affordability (assume user income ~R25k from prequal context)
  const assumedIncome = 25000;
  const ratio = monthly / assumedIncome;
  const affordability = ratio <= 0.25 ? { label: "Comfortable", icon: "✅", color: "text-success", bg: "bg-success-bg" }
    : ratio <= 0.35 ? { label: "Stretch", icon: "⚠️", color: "text-warning", bg: "bg-warning-bg" }
    : { label: "Risky", icon: "❌", color: "text-danger", bg: "bg-danger-bg" };

  // Discount likelihood labels
  const discountLabel = discountPct <= 3 ? { text: "High acceptance chance", color: "text-success" }
    : discountPct <= 8 ? { text: "Fair market deal", color: "text-terra" }
    : { text: "Low chance of approval", color: "text-warning" };

  // Deposit impact on monthly
  const depositMonthlyImpact = deposit > 0
    ? Math.round(((deposit) * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1))
    : 0;

  const scarcityCount = 100 + (car.id * 17) % 80;

  // Presets
  function applyPreset(preset: "lowest" | "value" | "norisk") {
    if (preset === "lowest") {
      setDiscountPct(10);
      setDeposit(Math.round(basePrice * 0.1));
      setBalloonOn(true);
      setBalloonPct(30);
      setStep(3);
    } else if (preset === "value") {
      setDiscountPct(5);
      setDeposit(Math.round(basePrice * 0.15));
      setBalloonOn(false);
      setBalloonPct(0);
      setStep(2);
    } else {
      setDiscountPct(5);
      setDeposit(0);
      setBalloonOn(false);
      setBalloonPct(0);
      setStep(1);
    }
  }

  return (
    <div className="fixed inset-0 bg-foreground/40 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-card rounded-t-2xl p-6 w-full max-w-md max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <h3 className="font-heading text-xl font-bold text-foreground mb-0.5">Build a deal you can afford</h3>
        <p className="text-[13px] text-soft mb-1">{car.year} {car.make} {car.model}</p>

        {/* PRIMARY: Monthly payment anchor */}
        <div className="bg-muted rounded-2xl px-5 py-5 text-center mb-4">
          <p className="text-[10px] uppercase tracking-wider text-soft m-0 mb-1 font-semibold">Your monthly payment</p>
          <p className="font-heading text-4xl font-bold text-terra m-0 mb-1">R{monthly.toLocaleString()}<span className="text-lg font-semibold text-soft">/pm</span></p>

          {/* Affordability badge */}
          <div className={`inline-flex items-center gap-1.5 ${affordability.bg} px-3 py-1 rounded-full mt-1 mb-2`}>
            <span className="text-sm">{affordability.icon}</span>
            <span className={`text-[11px] font-semibold ${affordability.color}`}>{affordability.label}</span>
          </div>

          <div className="flex justify-between text-xs text-soft mt-2">
            <span>Total: R{(afterDiscount - deposit - tradeIn).toLocaleString()}</span>
            <span>Save: R{totalSaving > 0 ? totalSaving.toLocaleString() : "0"}</span>
          </div>
          {balloonAmt > 0 && (
            <p className="text-[11px] text-warning mt-1.5 m-0">+ R{balloonAmt.toLocaleString()} balloon due at end</p>
          )}
        </div>

        {/* Quick presets */}
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider text-soft font-semibold mb-2">Not sure? Try a preset</p>
          <div className="flex gap-1.5">
            {[
              { key: "lowest" as const, label: "Lowest monthly" },
              { key: "value" as const, label: "Best long-term" },
              { key: "norisk" as const, label: "No risk" },
            ].map(p => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className="flex-1 py-2 rounded-lg text-[10px] font-semibold cursor-pointer border border-sand bg-card text-soft hover:border-terra hover:text-terra transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* STEP 1: Discount */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <div>
              <label className="text-xs text-foreground font-semibold block">What discount would you like?</label>
              <p className="text-[10px] text-soft m-0">This is the price you negotiate with the dealer</p>
            </div>
            <span className="text-xs font-bold text-success">-R{discountAmt.toLocaleString()}</span>
          </div>
          <input type="range" min={0} max={15} value={discountPct} onChange={e => setDiscountPct(parseInt(e.target.value))} className="w-full accent-terra" />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-soft">0%</span>
            <span className={`text-[10px] font-semibold ${discountLabel.color}`}>{discountPct}% — {discountLabel.text}</span>
            <span className="text-[10px] text-soft">15%</span>
          </div>
        </div>

        {/* Social proof */}
        <div className="bg-danger-bg border border-danger/30 rounded-lg px-3 py-2 mb-4 flex items-start gap-2">
          <Flame size={13} className="text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] text-danger m-0 font-semibold">{scarcityCount} buyers tried to negotiate this car this week</p>
            <p className="text-[10px] text-danger/70 m-0 mt-0.5">Most accepted deals: 5–7% discount</p>
          </div>
        </div>

        {/* STEP 2: Deposit + Trade-in (progressive) */}
        {step < 2 ? (
          <button onClick={() => setStep(2)} className="w-full py-2.5 rounded-lg border border-sand bg-card text-soft text-xs font-semibold cursor-pointer mb-4 hover:border-terra transition-colors">
            + Add deposit or trade-in to lower your payment
          </button>
        ) : (
          <div className="mb-4 border border-sand rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-soft font-semibold mb-3">Adjust your deal</p>

            {/* Deposit */}
            <div className="mb-4">
              <label className="text-xs text-foreground font-semibold block mb-0.5">How much can you pay upfront?</label>
              <p className="text-[10px] text-soft m-0 mb-2">Adding a deposit lowers your monthly payment and interest.</p>
              <input
                type="number"
                value={deposit || ""}
                onChange={e => setDeposit(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Enter cash deposit (e.g. 10000)"
                className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-sand text-sm text-foreground bg-background font-body outline-none focus:border-terra transition-colors"
              />
              {deposit > 0 && (
                <p className="text-[11px] text-success font-semibold m-0 mt-1.5">
                  Adding R{deposit.toLocaleString()} saves you ~R{depositMonthlyImpact.toLocaleString()}/pm
                </p>
              )}
            </div>

            {/* Trade-in */}
            <div>
              <label className="text-xs text-foreground font-semibold block mb-0.5">Do you have a car to trade in?</label>
              <p className="text-[10px] text-soft m-0 mb-2">Your trade-in reduces what you need to finance.</p>
              <div className="flex gap-1.5 mb-2">
                {([
                  ["none", "No"],
                  ["owned", "Yes – fully paid"],
                  ["financed", "Yes – still financed"],
                ] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setTradeMode(val)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-semibold cursor-pointer border-[1.5px] transition-colors ${
                      tradeMode === val ? "bg-terra text-primary-foreground border-terra" : "bg-card text-soft border-sand"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tradeMode === "owned" && (
                <div className="bg-muted/50 rounded-lg p-3 mt-2">
                  <label className="text-[11px] text-soft block mb-1.5 font-semibold">How much do you think your car is worth?</label>
                  <input
                    type="number"
                    value={ownedValue || ""}
                    onChange={e => setOwnedValue(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="e.g. 120000"
                    className="w-full px-3 py-2 rounded-lg border-[1.5px] border-sand text-sm text-foreground bg-background font-body outline-none focus:border-terra transition-colors"
                  />
                  {ownedValue > 0 && (
                    <p className="text-[11px] text-success font-semibold m-0 mt-1.5">
                      Trade-in of R{ownedValue.toLocaleString()} applied to your deal
                    </p>
                  )}
                </div>
              )}

              {tradeMode === "financed" && (
                <div className="bg-muted/50 rounded-lg p-3 mt-2 space-y-2.5">
                  <div>
                    <label className="text-[11px] text-soft block mb-1 font-semibold">What's your current monthly instalment? (R)</label>
                    <input
                      type="number"
                      value={finInstalment || ""}
                      onChange={e => setFinInstalment(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="e.g. 3500"
                      className="w-full px-3 py-2 rounded-lg border-[1.5px] border-sand text-sm text-foreground bg-background font-body outline-none focus:border-terra transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-soft block mb-1 font-semibold">Original term</label>
                    <div className="flex gap-1.5">
                      {[60, 72, 84].map(t => (
                        <button
                          key={t}
                          onClick={() => setFinTerm(t)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-semibold cursor-pointer border transition-colors ${
                            finTerm === t ? "bg-foreground text-card border-foreground" : "bg-card text-soft border-sand"
                          }`}
                        >
                          {t} mo
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-soft block mb-1 font-semibold">Months you've already paid</label>
                    <input
                      type="number"
                      value={finPaid || ""}
                      onChange={e => setFinPaid(Math.max(0, Math.min(finTerm, parseInt(e.target.value) || 0)))}
                      placeholder={`0 – ${finTerm}`}
                      className="w-full px-3 py-2 rounded-lg border-[1.5px] border-sand text-sm text-foreground bg-background font-body outline-none focus:border-terra transition-colors"
                    />
                  </div>
                  {finInstalment > 0 && finPaid > 0 && (
                    <div className={`rounded-lg p-2.5 ${finEquity >= 0 ? "bg-success-bg" : "bg-warning-bg"}`}>
                      <p className={`text-[11px] m-0 font-semibold ${finEquity >= 0 ? "text-success" : "text-warning"}`}>
                        Settlement: R{estSettlement.toLocaleString()} · Market value: R{estMarketValue.toLocaleString()}
                      </p>
                      <p className={`text-xs m-0 mt-0.5 font-bold ${finEquity >= 0 ? "text-success" : "text-warning"}`}>
                        {finEquity >= 0
                          ? `✅ Equity: R${finEquity.toLocaleString()} applied as trade-in`
                          : `⚠ Shortfall: R${Math.abs(finEquity).toLocaleString()} — we'll structure to absorb it`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Balloon + Future value (progressive) */}
        {step < 3 ? (
          step >= 2 && (
            <button onClick={() => setStep(3)} className="w-full py-2.5 rounded-lg border border-sand bg-card text-soft text-xs font-semibold cursor-pointer mb-4 hover:border-terra transition-colors">
              + Explore balloon & future car value (advanced)
            </button>
          )
        ) : (
          <div className="mb-4 border border-sand rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-soft font-semibold mb-3">Understand your future cost</p>

            {/* Balloon toggle */}
            <div className="mb-3">
              <label className="text-xs text-foreground font-semibold block mb-0.5">Lower your monthly payment (balloon option)</label>
              <p className="text-[10px] text-soft m-0 mb-2">A balloon defers part of the cost to a lump sum at the end of your term.</p>

              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => { setBalloonOn(false); setBalloonPct(0); }}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-semibold cursor-pointer border-[1.5px] transition-colors ${
                    !balloonOn ? "bg-terra text-primary-foreground border-terra" : "bg-card text-soft border-sand"
                  }`}
                >
                  No balloon
                </button>
                <button
                  onClick={() => { setBalloonOn(true); setBalloonPct(balloonPct || 20); }}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-semibold cursor-pointer border-[1.5px] transition-colors ${
                    balloonOn ? "bg-terra text-primary-foreground border-terra" : "bg-card text-soft border-sand"
                  }`}
                >
                  Add balloon
                </button>
              </div>

              {!balloonOn && (
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-soft m-0">No large final payment. Higher monthly cost.</p>
                </div>
              )}

              {balloonOn && (
                <>
                  <input type="range" min={5} max={35} step={5} value={balloonPct} onChange={e => setBalloonPct(parseInt(e.target.value))} className="w-full accent-terra" />
                  <div className="flex justify-between mt-0.5 mb-2">
                    <span className="text-[10px] text-soft">5%</span>
                    <span className="text-[10px] font-semibold text-terra">{balloonPct}% · R{balloonAmt.toLocaleString()} due at end</span>
                    <span className="text-[10px] text-soft">35%</span>
                  </div>

                  {/* Visual: monthly ↓ final ↑ */}
                  <div className="bg-muted/50 rounded-lg px-3 py-2.5 mb-2">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-[10px] text-soft m-0">Monthly payments</p>
                        <p className="text-sm font-bold text-success m-0">↓ R{monthly.toLocaleString()}</p>
                      </div>
                      <span className="text-soft text-lg">→</span>
                      <div className="text-center">
                        <p className="text-[10px] text-soft m-0">Final payment</p>
                        <p className="text-sm font-bold text-warning m-0">↑ R{balloonAmt.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-terra/10 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-terra m-0">✅ Good if you plan to sell/trade-in later</p>
                    <p className="text-[10px] text-warning m-0 mt-0.5">⚠️ Risky if you plan to keep the car long-term</p>
                  </div>
                </>
              )}
            </div>

            {/* Predicted car value = decision */}
            <div className="mt-3 bg-muted/60 rounded-lg p-3">
              <p className="text-xs text-foreground font-semibold m-0 mb-0.5">What your car could be worth later</p>
              <p className="text-[10px] text-soft m-0 mb-2">Compare against your balloon to see if you're covered.</p>
              <div className="grid grid-cols-3 gap-2">
                {[48, 60, 72].map(term => {
                  const val = residuals[term];
                  const safe = balloonAmt === 0 || balloonAmt <= val;
                  return (
                    <div key={term} className={`rounded-md p-2 text-center border ${safe ? "border-sand bg-card" : "border-warning/40 bg-warning-bg"}`}>
                      <p className="text-[10px] text-soft m-0">{term} months</p>
                      <p className="text-xs font-bold text-foreground m-0">R{(val / 1000).toFixed(0)}k</p>
                      {balloonAmt > 0 && (
                        <p className={`text-[9px] m-0 mt-0.5 font-semibold ${safe ? "text-success" : "text-warning"}`}>
                          {safe ? "✓ covers balloon" : "⚠ owes more than value"}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              {balloonAmt > 0 && (
                <div className={`mt-2 rounded-lg px-3 py-2 ${balloonAmt <= residual72 ? "bg-success-bg" : "bg-warning-bg"}`}>
                  <p className={`text-[10px] m-0 font-semibold ${balloonAmt <= residual72 ? "text-success" : "text-warning"}`}>
                    {balloonAmt <= residual72
                      ? `Car value at 72 mo: R${(residual72/1000).toFixed(0)}k vs balloon R${(balloonAmt/1000).toFixed(0)}k → You're likely covered ✅`
                      : `Car value at 72 mo: R${(residual72/1000).toFixed(0)}k vs balloon R${(balloonAmt/1000).toFixed(0)}k → You may owe more than the car is worth ⚠️`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* What changed summary */}
        {(discountPct > 0 || deposit > 0 || tradeIn > 0 || balloonAmt > 0) && (
          <div className="bg-muted rounded-xl px-4 py-3 mb-4">
            <p className="text-[10px] uppercase tracking-wider text-soft font-semibold m-0 mb-2">What changed</p>
            <div className="space-y-1">
              {discountPct > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-soft">Discount ({discountPct}%)</span>
                  <span className="text-success font-semibold">-R{discountAmt.toLocaleString()}</span>
                </div>
              )}
              {deposit > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-soft">Deposit</span>
                  <span className="text-success font-semibold">-R{deposit.toLocaleString()}</span>
                </div>
              )}
              {tradeIn > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-soft">Trade-in</span>
                  <span className="text-success font-semibold">-R{tradeIn.toLocaleString()}</span>
                </div>
              )}
              {balloonAmt > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-soft">Balloon deferred</span>
                  <span className="text-warning font-semibold">-R{balloonAmt.toLocaleString()} (due later)</span>
                </div>
              )}
              <div className="border-t border-sand pt-1.5 mt-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground font-semibold">Monthly change</span>
                  <span className="text-success font-bold">↓ R{monthlySaving > 0 ? monthlySaving.toLocaleString() : "0"}/pm saved</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <button onClick={() => {
          if (onApply) {
            onApply({
              discountPct,
              deposit,
              tradeIn,
              balloonPct,
              balloonOn,
              newMonthly: monthly,
              newPrice: afterDiscount - deposit - tradeIn
            });
          }
          onClose();
        }} className="w-full py-3.5 rounded-full bg-terra text-primary-foreground border-none text-sm font-bold cursor-pointer mb-3">
          Continue with this deal
        </button>
        <button onClick={onClose} className="w-full py-2 rounded-full bg-transparent text-soft border-none text-xs cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  );
}

function BalloonModal({ car, onClose }: { car: typeof CARS[0]; onClose: () => void }) {
  const price = parseInt(car.price.replace(/\D/g, ""));
  const balloonPercent = 20;
  const balloonAmount = Math.round(price * balloonPercent / 100);
  const financed = price - balloonAmount;
  const r = 0.115 / 12;
  const n = 72;
  const monthlyWithBalloon = Math.round((financed * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  const monthlyWithout = Math.round((price * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  const saving = monthlyWithout - monthlyWithBalloon;
  const holdsValue = car.match > 85;

  return (
    <div className="fixed inset-0 bg-foreground/40 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-card rounded-t-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="font-heading text-xl font-bold text-foreground mb-1">🎈 Balloon payment option</h3>
        <p className="text-[13px] text-soft mb-4">{car.year} {car.make} {car.model}</p>
        <div className="bg-terra/10 border border-terra/20 rounded-lg px-3.5 py-2.5 mb-4">
          <p className="text-xs text-terra leading-relaxed m-0">💡 A balloon reduces your monthly but means a lump sum at the end of your term.</p>
        </div>
        <div className="bg-muted rounded-xl px-4 py-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-soft">Without balloon</span>
            <span className="text-sm font-semibold text-foreground">R{monthlyWithout.toLocaleString()}/pm</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-soft">With {balloonPercent}% balloon</span>
            <span className="text-sm font-bold text-terra">R{monthlyWithBalloon.toLocaleString()}/pm</span>
          </div>
        </div>
        <div className="bg-success-bg rounded-xl px-4 py-3 mb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-success font-semibold">Monthly saving</span>
            <span className="text-sm text-success font-bold">R{saving.toLocaleString()}/pm</span>
          </div>
        </div>
        <div className="bg-muted rounded-xl px-4 py-3 mb-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-soft">Balloon due at end of term</span>
            <span className="text-sm font-semibold text-foreground">R{balloonAmount.toLocaleString()}</span>
          </div>
        </div>
        <div className={`rounded-xl px-4 py-3 mb-4 ${holdsValue ? "bg-success-bg" : "bg-warning-bg"}`}>
          <p className={`text-xs font-semibold m-0 ${holdsValue ? "text-success" : "text-warning"}`}>
            {holdsValue ? "✓ This model holds its value well — balloon is a smart option" : "⚠ This model may depreciate faster — consider carefully"}
          </p>
        </div>
        <button onClick={onClose} className="w-full py-3 rounded-full bg-muted text-soft border-none text-sm font-semibold cursor-pointer">Close</button>
      </div>
    </div>
  );
}

function TradeInModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [repayment, setRepayment] = useState("");
  const [months, setMonths] = useState("");

  function calculate() {
    const rep = parseInt(repayment) || 0;
    const mo = parseInt(months) || 0;
    const estimatedValue = 120000;
    const settlement = Math.max(0, (rep * (72 - mo)) * 0.6);
    const equity = estimatedValue - settlement;
    setStep(equity > 0 ? 1 : equity < 0 ? 2 : 3);
  }

  if (step === 0) {
    return (
      <div className="fixed inset-0 bg-foreground/40 flex items-end justify-center z-50" onClick={onClose}>
        <div className="bg-card rounded-t-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
          <h3 className="font-heading text-xl font-bold text-foreground mb-1">🔄 Trade-in estimate</h3>
          <p className="text-[13px] text-soft mb-5">Let's estimate your current vehicle's position.</p>
          <div className="mb-3">
            <label className="text-[11px] text-soft block mb-1.5 font-semibold uppercase tracking-wider">Current monthly repayment (R)</label>
            <input value={repayment} onChange={e => setRepayment(e.target.value)} placeholder="e.g. 3500" className="w-full px-4 py-3 rounded-xl border-[1.5px] border-sand text-sm text-foreground bg-background font-body outline-none focus:border-terra transition-colors" />
          </div>
          <div className="mb-5">
            <label className="text-[11px] text-soft block mb-1.5 font-semibold uppercase tracking-wider">Months you've had the vehicle</label>
            <input value={months} onChange={e => setMonths(e.target.value)} placeholder="e.g. 36" className="w-full px-4 py-3 rounded-xl border-[1.5px] border-sand text-sm text-foreground bg-background font-body outline-none focus:border-terra transition-colors" />
          </div>
          <button onClick={calculate} className="w-full bg-terra text-primary-foreground border-none rounded-full py-3.5 text-sm font-semibold cursor-pointer">Estimate trade-in →</button>
        </div>
      </div>
    );
  }

  const messages: Record<number, { emoji: string; color: string; bg: string; title: string; desc: string }> = {
    1: { emoji: "✅", color: "text-success", bg: "bg-success-bg", title: "You already have a deposit", desc: "Your trade-in equity can be applied to your next vehicle." },
    2: { emoji: "🔄", color: "text-warning", bg: "bg-warning-bg", title: "We'll structure your deal to absorb your shortfall", desc: "Don't worry — we can roll the difference into your new deal." },
    3: { emoji: "➡️", color: "text-info", bg: "bg-info-bg", title: "You're in a clean position to switch vehicles", desc: "No outstanding balance — you're free to move forward." },
  };
  const msg = messages[step];

  return (
    <div className="fixed inset-0 bg-foreground/40 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-card rounded-t-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className={`${msg.bg} rounded-xl px-4 py-4 mb-4`}>
          <p className="text-lg mb-1">{msg.emoji}</p>
          <h4 className={`font-semibold text-sm ${msg.color} mb-1`}>{msg.title}</h4>
          <p className={`text-xs ${msg.color} opacity-80 m-0`}>{msg.desc}</p>
        </div>
        <button onClick={onClose} className="w-full py-3 rounded-full bg-muted text-soft border-none text-sm font-semibold cursor-pointer">Close</button>
      </div>
    </div>
  );
}

// Pre-qualify gate shown before bank offers if user skipped pre-qual
function PrequalGate({ onPrequalify, onSkip }: { onPrequalify: () => void; onSkip: () => void }) {
  return (
    <div className="fixed inset-0 bg-foreground/40 flex items-end justify-center z-50">
      <div className="bg-card rounded-t-2xl p-6 w-full max-w-md">
        <h3 className="font-heading text-xl font-bold text-foreground mb-2">Pre-qualification required</h3>
        <p className="text-sm text-soft leading-relaxed mb-4">
          To get bank offers, we need to check your eligibility first. This is a <strong className="text-foreground">soft check</strong> — it won't affect your credit score.
        </p>
        <div className="bg-terra/10 border border-terra/20 rounded-lg px-3.5 py-2.5 mb-5">
          <p className="text-xs text-terra leading-relaxed m-0">💡 Pre-qualifying takes less than 2 minutes and unlocks personalised bank offers for this vehicle.</p>
        </div>
        <button onClick={onPrequalify} className="w-full bg-terra text-primary-foreground border-none rounded-full py-3.5 text-sm font-bold cursor-pointer mb-2">
          Pre-qualify now →
        </button>
        <button onClick={onSkip} className="w-full py-3 bg-transparent border-none text-soft text-sm cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function VehicleSearch({ query, answers, na, prequalified, onNav }: VehicleSearchProps) {
  // Detect if landing query looks like a make/model search
  const knownMakes = ["toyota", "honda", "mazda", "hyundai", "vw", "volkswagen", "bmw", "audi", "ford", "kia", "nissan", "mercedes", "renault", "suzuki"];
  const initialIsVehicle = !!query && knownMakes.some(m => query.toLowerCase().includes(m));
  const [mode, setMode] = useState<"tinder" | "list">(initialIsVehicle ? "list" : "tinder");
  const [cardIdx, setCardIdx] = useState(0);
  const [liked, setLiked] = useState<number[]>([]);
  const [saved, setSaved] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("match");
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalCar, setModalCar] = useState<typeof CARS[0] | null>(null);
  const [searchQ, setSearchQ] = useState(initialIsVehicle ? query : "");
  const [bankOfferCar, setBankOfferCar] = useState<typeof CARS[0] | null>(null);
  const [showPrequalGate, setShowPrequalGate] = useState(false);
  const [pendingBankCar, setPendingBankCar] = useState<typeof CARS[0] | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showContractScan, setShowContractScan] = useState(false);
  const [carDeals, setCarDeals] = useState<Record<number, DealChanges>>({});
  const name = prequalified ? "Lerato" : "there";
  const isCash = answers?.paymenttype === "cash";

  function toggleSave(id: number) {
    setSaved(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  const suggestions = [
    "Something reliable and safe under R5,450 per month",
    "Low mileage, not more than one owner, service plan still active",
    "A modern car with the latest technology",
  ];

  // Filter cars by search query (make/model match)
  const q = searchQ.trim().toLowerCase();
  let filtered = q
    ? CARS.filter(c => `${c.make} ${c.model}`.toLowerCase().includes(q) || c.make.toLowerCase().includes(q) || c.model.toLowerCase().includes(q))
    : [...CARS];

  // If search yielded nothing but looks like a vehicle name, synthesise a result card
  if (q && filtered.length === 0 && knownMakes.some(m => q.includes(m))) {
    const parts = searchQ.trim().split(/\s+/);
    const make = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase() : "Vehicle";
    const model = parts.slice(1).join(" ") || "Model";
    filtered = [{
      id: 999, make, model, year: 2021, mileage: "45,000 km", price: "R229,000", monthly: "R5,050/pm",
      servicePlan: true, transmission: "Automatic", fuelType: "Petrol", fuel: 6.9, match: 88, tag: "Your search",
    }];
  }

  let sorted = filtered;
  if (sortBy === "instalment") sorted.sort((a, b) => parseInt(a.monthly) - parseInt(b.monthly));
  if (sortBy === "fuel") sorted.sort((a, b) => a.fuel - b.fuel);
  if (sortBy === "match") sorted.sort((a, b) => b.match - a.match);
  if (sortBy === "deal") sorted.sort((a, b) => parseInt(a.price.replace(/\D/g, "")) - parseInt(b.price.replace(/\D/g, "")));

  const cur = CARS[cardIdx];

  function openModal(type: ModalType, car: typeof CARS[0]) {
    setModalCar(car);
    setModalType(type);
  }

  function handleBankOffer(car: typeof CARS[0]) {
    if (!prequalified) {
      setPendingBankCar(car);
      setShowPrequalGate(true);
    } else {
      setBankOfferCar(car);
    }
  }

  function swipe(dir: string) {
    if (dir === "right") setLiked(l => [...l, cur.id]);
    if (cardIdx < CARS.length - 1) setCardIdx(i => i + 1);
    else setMode("list");
  }

  const journeyRows = [
    ["Needs", answers?.firsttime === "yes" ? "First car · Finance" : "Upgrade · Finance"],
    ["Budget", prequalified ? "R5,450/pm Pre-Qualified" : "Not yet checked"],
    ["Insurance", "Not checked yet ⚠"],
    ["Protection", "AI Contract Scan"],
  ];

  if (showContractScan) {
    return <ContractScan onNav={(screen) => {
      if (screen === "vehicleSearch") setShowContractScan(false);
      else onNav(screen);
    }} />;
  }

  if (bankOfferCar) {
    return <BankOffers car={bankOfferCar} onNav={onNav} onClose={() => setBankOfferCar(null)} />;
  }

  return (
    <div className="bg-background min-h-screen">
      {modalType === "fuel" && modalCar && <FuelModal car={modalCar} onClose={() => setModalType(null)} />}
      {modalType === "reduce" && modalCar && (
        <ReducePriceModal 
          car={modalCar} 
          onClose={() => setModalType(null)} 
          onApply={(changes) => {
            if (modalCar) {
              setCarDeals(prev => ({ ...prev, [modalCar.id]: changes }));
            }
          }}
        />
      )}
      {modalType === "balloon" && modalCar && <BalloonModal car={modalCar} onClose={() => setModalType(null)} />}
      {modalType === "tradeIn" && <TradeInModal onClose={() => setModalType(null)} />}
      {showPrequalGate && (
        <PrequalGate
          onPrequalify={() => {
            setShowPrequalGate(false);
            onNav("prequal", { query, answers, na });
          }}
          onSkip={() => {
            setShowPrequalGate(false);
            setPendingBankCar(null);
          }}
        />
      )}
      <TopBar onBack={() => onNav("landing")} />

      <div className="px-5 pt-4 max-w-md mx-auto">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-3.5">
          Hi, <span className="text-terra">{name}</span> 👋
        </h2>

        {/* Journey summary */}
        <div className="bg-card border border-sand rounded-2xl px-4 py-3.5 mb-4">
          <p className="text-[10px] uppercase tracking-[1.5px] text-soft mb-2.5 font-semibold">Your journey so far</p>
          {journeyRows.map(([label, val]) => (
            <div key={label} className="flex gap-3 mb-1.5 items-start">
              <span className="text-xs text-soft min-w-[72px] shrink-0">{label}</span>
              <span className="text-xs text-foreground leading-relaxed font-medium">{val}</span>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-sand flex gap-2">
            <button className="flex-1 bg-terra text-primary-foreground border-none rounded-full py-2.5 text-xs font-semibold cursor-pointer">
              Get Insurance Quote
            </button>
            <button
              onClick={() => setShowContractScan(true)}
              className="flex-1 bg-card border border-terra text-terra rounded-full py-2.5 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
            >
              <FileCheck size={12} />
              AI Contract Scan
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-card border-[1.5px] border-sand rounded-2xl px-3.5 py-3 flex gap-2 mb-2.5 items-center">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Add filters or search again" className="flex-1 border-none outline-none text-[13px] text-foreground bg-transparent font-body" />
        </div>
        <div className="flex flex-col gap-1 mb-4">
          {suggestions.map(s => (
            <button key={s} onClick={() => setSearchQ(s)} className="bg-transparent border-none text-left text-xs text-terra cursor-pointer p-0 py-0.5 font-body flex gap-1.5 items-center hover:underline">
              <span className="text-sand">→</span> {s}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-2 mb-4">
          {([["tinder", "Quick swipe"], ["list", "Browse list"]] as const).map(([val, label]) => (
            <button key={val} onClick={() => setMode(val)} className={`flex-1 py-2.5 rounded-full text-sm font-semibold cursor-pointer border-[1.5px] transition-colors ${
              mode === val ? "bg-foreground text-card border-foreground" : "bg-card text-soft border-sand"
            }`}>{label}</button>
          ))}
        </div>
      </div>

      {/* TINDER MODE */}
      {mode === "tinder" && cardIdx < CARS.length && (
        <div className="px-5 pb-6 max-w-md mx-auto">
          <p className="text-[11px] text-soft text-center mb-3">{cardIdx + 1} of {CARS.length} · tap to see more</p>
          <div className="bg-card border-[1.5px] border-sand rounded-2xl overflow-hidden mb-4">
            <div className="bg-gradient-to-br from-muted to-sand h-48 flex items-center justify-center relative text-7xl">
              🚗
              <div className="absolute top-3 left-3 bg-terra text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">{cur.tag}</div>
              {cur.servicePlan && <div className="absolute top-3 right-3 bg-success text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">Service plan ✓</div>}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-heading text-xl font-bold text-foreground m-0 mb-0.5">{cur.year} {cur.make} {cur.model}</h3>
                  <p className="text-[13px] text-soft m-0">{cur.mileage} · {cur.transmission} · {cur.fuelType}</p>
                </div>
                <div className="text-right">
                  {carDeals[cur.id] ? (
                    <>
                      <p className="text-xl font-bold text-terra m-0 mb-0.5">R{carDeals[cur.id].newMonthly.toLocaleString()}/pm</p>
                      <p className="text-[11px] text-soft m-0 line-through">{cur.monthly}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-bold text-terra m-0 mb-0.5">{isCash ? cur.price : cur.monthly}</p>
                      {!isCash && <p className="text-[11px] text-soft m-0">{cur.price} total</p>}
                    </>
                  )}
                </div>
              </div>

              {/* Action buttons: Fuel cost, Reduce price, Save car (matches Browse list) */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button onClick={() => openModal("fuel", cur)} className="bg-warning-bg border-[1.5px] border-warning/30 text-warning text-xs font-semibold px-2 py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 hover:bg-warning/20 transition-colors">
                  <Fuel size={13} /> Fuel cost
                </button>
                <button onClick={() => openModal("reduce", cur)} className="bg-success-bg border-[1.5px] border-success/30 text-success text-xs font-semibold px-2 py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 hover:bg-success/20 transition-colors">
                  <Tag size={13} /> Reduce price
                </button>
                <button
                  onClick={() => toggleSave(cur.id)}
                  className={`border-[1.5px] text-xs font-semibold px-2 py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${
                    saved.includes(cur.id) ? "bg-terra text-primary-foreground border-terra" : "bg-terra/10 text-terra border-terra/30 hover:bg-terra/20"
                  }`}
                >
                  <Heart size={13} className={saved.includes(cur.id) ? "fill-current" : ""} /> {saved.includes(cur.id) ? "Saved" : "Save car"}
                </button>
              </div>

              {/* Swipe actions */}
              <div className="flex gap-2.5 mb-2">
                <button onClick={() => swipe("left")} className="flex-1 py-3 rounded-full bg-danger-bg text-danger border-[1.5px] border-danger/30 text-sm font-bold cursor-pointer">✕ Less like this</button>
                <button onClick={() => swipe("right")} className="flex-1 py-3 rounded-full bg-success-bg text-success border-[1.5px] border-success/30 text-sm font-bold cursor-pointer">✓ More like this</button>
              </div>

              {/* Get bank offer */}
              <button
                onClick={() => handleBankOffer(cur)}
                className="w-full py-3 rounded-full bg-terra text-primary-foreground border-none text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity"
              >
                {isCash ? "Make offer" : "Get bank offer"}
              </button>
            </div>
          </div>
          <button onClick={() => setMode("list")} className="w-full bg-transparent border-none text-sm text-soft cursor-pointer hover:text-terra transition-colors">Skip to full list →</button>
        </div>
      )}

      {/* LIST MODE */}
      {mode === "list" && (
        <div className="px-5 pb-8 max-w-md mx-auto">
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3.5">
            {([["match", "Best match"], ["instalment", "Lowest instalment"], ["fuel", "Lowest fuel cost"], ["deal", "Best deal"]] as const).map(([val, label]) => (
              <button key={val} onClick={() => setSortBy(val)} className={`rounded-full px-3.5 py-2 text-[11px] font-semibold cursor-pointer whitespace-nowrap font-body border-[1.5px] transition-colors ${
                sortBy === val ? "bg-foreground text-card border-foreground" : "bg-card text-soft border-sand"
              }`}>{label}</button>
            ))}
          </div>

          {/* Saved cars at top */}
          {saved.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart size={14} className="text-terra fill-terra" />
                <h3 className="text-[13px] font-bold text-foreground m-0">Your saved cars ({saved.length})</h3>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
                {sorted.filter(c => saved.includes(c.id)).map(car => (
                  <div key={`saved-${car.id}`} className="bg-card border-[1.5px] border-terra/40 rounded-xl shrink-0 w-44 overflow-hidden">
                    <div className="bg-gradient-to-br from-muted to-sand h-20 flex items-center justify-center text-3xl relative">
                      🚗
                      <button
                        onClick={() => toggleSave(car.id)}
                        className="absolute top-1.5 right-1.5 bg-card/90 border-none w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                        aria-label="Remove from saved"
                      >
                        <Heart size={12} className="text-terra fill-terra" />
                      </button>
                    </div>
                    <div className="p-2.5">
                      <p className="text-[11px] font-bold text-foreground m-0 truncate">{car.year} {car.make} {car.model}</p>
                      <p className="text-[11px] font-bold text-terra m-0">{isCash ? car.price : car.monthly}</p>
                      <button
                        onClick={() => handleBankOffer(car)}
                        className="w-full mt-1.5 py-1 rounded-full border-none text-[10px] font-bold cursor-pointer bg-terra text-primary-foreground"
                      >
                        {isCash ? "Make offer" : "Get offer"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sorted.map(car => {
            const isExpanded = expandedCard === car.id;
            const isSaved = saved.includes(car.id);
            return (
              <div key={car.id} className="bg-card border-[1.5px] border-sand rounded-2xl overflow-hidden mb-2.5">
                {/* Large image area */}
                <div className="bg-gradient-to-br from-muted to-sand h-40 flex items-center justify-center text-6xl relative">
                  🚗
                  <div className="absolute top-3 left-3 bg-terra text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">{car.tag}</div>
                  {car.servicePlan && <div className="absolute top-3 right-3 bg-success text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">Service plan ✓</div>}
                  <span className="absolute bottom-2 right-2 bg-info-bg text-info text-[10px] font-semibold px-2 py-1 rounded-full">{car.match}% match</span>
                </div>
                <div className="p-4">
                  <div className="flex justify-between mb-1">
                    <p className="text-[15px] font-bold text-foreground m-0">{car.year} {car.make} {car.model}</p>
                    <div className="text-right">
                      {carDeals[car.id] ? (
                        <>
                          <p className="text-[15px] font-bold text-terra m-0">R{carDeals[car.id].newMonthly.toLocaleString()}/pm</p>
                          <p className="text-[11px] text-soft m-0 line-through">{car.monthly}</p>
                        </>
                      ) : (
                        <p className="text-[15px] font-bold text-terra m-0">{isCash ? car.price : car.monthly}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-soft m-0 mb-3">{car.mileage} · {car.transmission} · {car.fuelType}{!isCash ? ` · ${car.price}` : ""}</p>

                  {/* Action buttons: Fuel cost, Reduce price, Save car */}
                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    <button onClick={() => openModal("fuel", car)} className="bg-warning-bg border-none text-warning text-[11px] font-semibold px-3 py-1.5 rounded-full cursor-pointer flex items-center gap-1">
                      <Fuel size={11} /> Fuel cost
                    </button>
                    <button onClick={() => openModal("reduce", car)} className="bg-success-bg border-none text-success text-[11px] font-semibold px-3 py-1.5 rounded-full cursor-pointer flex items-center gap-1">
                      <Tag size={11} /> Reduce price
                    </button>
                    <button
                      onClick={() => toggleSave(car.id)}
                      className={`border-none text-[11px] font-semibold px-3 py-1.5 rounded-full cursor-pointer flex items-center gap-1 ${
                        isSaved ? "bg-terra text-primary-foreground" : "bg-terra/10 text-terra"
                      }`}
                    >
                      <Heart size={11} className={isSaved ? "fill-current" : ""} /> {isSaved ? "Saved" : "Save car"}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : car.id)}
                      className="flex-1 py-2.5 rounded-full border-[1.5px] border-sand text-xs font-semibold cursor-pointer bg-card text-soft flex items-center justify-center gap-1"
                    >
                      {isExpanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> View more</>}
                    </button>
                    <button
                      onClick={() => handleBankOffer(car)}
                      className="flex-1 py-2.5 rounded-full border-none text-xs font-bold cursor-pointer bg-terra text-primary-foreground"
                    >
                      {isCash ? "Make offer" : "Get bank offer"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-sand text-xs text-soft animate-fade-in">
                      <p className="m-0 mb-1"><span className="text-foreground font-semibold">Match score:</span> {car.match}%</p>
                      <p className="m-0 mb-1"><span className="text-foreground font-semibold">Fuel:</span> {car.fuel}L/100km</p>
                      <p className="m-0"><span className="text-foreground font-semibold">Service plan:</span> {car.servicePlan ? "Included ✓" : "Not included"}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <HelpWidget context="vehicles" topics={HELP_CONTENT.vehicles} />
    </div>
  );
}

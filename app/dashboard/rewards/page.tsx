"use client";

import { motion } from "framer-motion";
import { Award, Gift } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useUserContext } from "@/lib/context/UserContext";
import { getLoyaltyInfo } from "@/lib/hooks/useUser";

const rewardsCatalog = [
  { icon: "☕", title: "Free Express Wash",          desc: "Redeem 500 points",  points: 500 },
  { icon: "✨", title: "Premium Wash Upgrade",        desc: "Redeem 1,200 points", points: 1200 },
  { icon: "💎", title: "Elite Detail Discount 30%",   desc: "Redeem 2,000 points", points: 2000 },
  { icon: "🎁", title: "One Month Pro",               desc: "Redeem 5,000 points", points: 5000 },
];

export default function DashboardRewardsPage() {
  const { t } = useLanguage();
  const { profile } = useUserContext();

  const points = profile?.loyalty_points ?? 0;
  const tier   = profile?.loyalty_tier   ?? "Bronze";
  const loyalty = getLoyaltyInfo(points);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900">{t("dashboard.navRewards")}</h1>
        <p className="text-sm text-slate-400">{t("dashboard.loyaltyPoints")}</p>
      </div>

      {/* Points card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-5 h-5" />
          <span className="text-sm font-semibold opacity-90">{tier} Member</span>
        </div>
        <div className="text-5xl font-black mb-1">{points.toLocaleString()}</div>
        <div className="text-sm opacity-80">{t("dashboard.loyaltyPoints")}</div>
        <div className="mt-4 h-2 bg-white/30 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, loyalty.progress))}%` }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="h-full bg-white rounded-full" />
        </div>
        <div className="flex justify-between text-xs opacity-70 mt-1">
          <span>{tier}</span>
          <span>{Math.max(0, loyalty.toNext)} {t("dashboard.pointsToNext")} {loyalty.next}</span>
        </div>
      </motion.div>

      {/* Rewards grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3">{t("dashboard.navRewards")}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {rewardsCatalog.map((r, i) => {
            const available = points >= r.points;
            return (
              <motion.div key={r.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${available ? "border-slate-200 hover:border-brand-blue/20" : "border-slate-100 opacity-60"}`}>
                <div className="text-3xl mb-3">{r.icon}</div>
                <div className="font-bold text-slate-900 text-sm mb-1">{r.title}</div>
                <div className="text-xs text-slate-400 mb-4">{r.desc}</div>
                <button disabled={!available}
                  className={`w-full h-9 rounded-xl text-sm font-semibold transition-all ${available ? "bg-brand-blue/10 text-brand-blue border border-brand-blue/20 hover:bg-brand-blue/20" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
                  <Gift className="w-3.5 h-3.5 inline mr-1" />
                  {r.points} pts
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

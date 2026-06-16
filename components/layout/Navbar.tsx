"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X, Droplets, ChevronDown, Globe } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useLanguage, Lang } from "@/lib/i18n";

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "ru", label: "РУ", flag: "🇷🇺" },
  { code: "uz", label: "UZ", flag: "🇺🇿" },
  { code: "en", label: "EN", flag: "🇬🇧" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { label: t("nav.howItWorks"), href: "#how-it-works" },
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.pricing"), href: "/pricing" },
    {
      label: t("nav.product"),
      href: "#",
      children: [
        { label: t("nav.userApp"), href: "/dashboard", desc: t("nav.userAppDesc") },
        { label: t("nav.workerApp"), href: "/worker", desc: t("nav.workerAppDesc") },
        { label: t("nav.adminPanel"), href: "/admin", desc: t("nav.adminPanelDesc") },
      ],
    },
  ];

  const currentLang = LANGS.find((l) => l.code === lang) || LANGS[0];

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-slate-200 py-3 shadow-sm"
            : "bg-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="w-9 h-9 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center"
              >
                <Droplets className="w-5 h-5 text-brand-blue" />
              </motion.div>
              <span className="text-lg font-bold tracking-tight">
                <span className="text-slate-900">VISIT</span>
                <span className="text-brand-blue">.</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) =>
                link.children ? (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(link.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-all">
                      {link.label}
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 transition-transform duration-200",
                          activeDropdown === link.label && "rotate-180"
                        )}
                      />
                    </button>

                    <AnimatePresence>
                      {activeDropdown === link.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                          className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl p-2 shadow-lg"
                        >
                          {link.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group/item"
                            >
                              <span className="text-sm font-medium text-slate-800 group-hover/item:text-brand-blue transition-colors">
                                {child.label}
                              </span>
                              <span className="text-xs text-slate-400">
                                {child.desc}
                              </span>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-all"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>

            {/* Right: Lang + CTA */}
            <div className="hidden md:flex items-center gap-2">
              {/* Language Switcher */}
              <div className="relative" onMouseEnter={() => setLangOpen(true)} onMouseLeave={() => setLangOpen(false)}>
                <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="font-medium">{currentLang.flag} {currentLang.label}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform", langOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl p-1 shadow-lg"
                    >
                      {LANGS.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => { setLang(l.code); setLangOpen(false); }}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                            lang === l.code
                              ? "bg-brand-blue/10 text-brand-blue font-semibold"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <span>{l.flag}</span>
                          <span>{l.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link href="/login">
                <Button variant="ghost" size="sm">{t("common.signIn")}</Button>
              </Link>
              <Link href="/booking">
                <Button variant="primary" size="sm" glow>
                  {t("common.bookWash")}
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-slate-500 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-[64px] left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 md:hidden shadow-lg"
          >
            <div className="px-4 py-6 space-y-1">
              {navLinks.map((link) => (
                <div key={link.label}>
                  <Link
                    href={link.href}
                    className="block text-base text-slate-600 hover:text-slate-900 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-all"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                  {link.children?.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      className="block text-sm text-slate-400 hover:text-slate-600 pl-6 py-2 rounded-xl hover:bg-slate-50 transition-all"
                      onClick={() => setMobileOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ))}

              {/* Mobile Language Switcher */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 px-3 mb-2 font-semibold uppercase tracking-wider">Язык / Til / Language</p>
                <div className="flex gap-2 px-3">
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLang(l.code)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-sm font-medium transition-all border",
                        lang === l.code
                          ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      {l.flag} {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" size="md" className="w-full justify-center">{t("common.signIn")}</Button>
                </Link>
                <Link href="/booking" onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" size="md" className="w-full justify-center" glow>{t("common.bookWash")}</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

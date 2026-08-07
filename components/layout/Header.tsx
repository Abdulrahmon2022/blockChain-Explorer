"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Cpu, Menu, X, Compass } from "lucide-react";
import { EXPLORER_NAME, SUPPORTED_NETWORKS } from "@/lib/constants";
import { GlobalSearch } from "./GlobalSearch";
import { ThemeToggle } from "./ThemeToggle";
import { Select } from "@/components/ui/Select";

export function Header() {
  const [network, setNetwork] = useState("mainnet");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const networkOptions = SUPPORTED_NETWORKS.map((n) => ({
    value: n.id,
    label: n.name,
  }));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-default bg-bg-primary/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo & Network Indicator */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Cpu className="h-6 w-6 text-brand-primary" />
              <span className="font-bold text-sm sm:text-base tracking-tight text-text-primary uppercase">
                {EXPLORER_NAME}
              </span>
            </Link>
            
            <div className="hidden lg:block">
              <Select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                options={networkOptions}
                className="py-1 px-2.5 !text-xs font-semibold !h-8 bg-bg-secondary border-border-full text-text-primary"
              />
            </div>
          </div>

          {/* Search bar - centered */}
          <div className="hidden md:flex flex-1 justify-center max-w-md">
            <GlobalSearch />
          </div>

          {/* Navigation Links & Toggle */}
          <div className="hidden lg:flex items-center gap-4">
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
              >
                <Compass className="h-3.5 w-3.5 text-brand-primary" />
                Dashboard
              </Link>
            </nav>
            <div className="h-4 w-px bg-border-default" />
            <ThemeToggle />
          </div>

          {/* Mobile elements */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-text-secondary hover:text-text-primary"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search sub-header */}
      <div className="px-4 py-2 border-t border-border-default md:hidden bg-bg-secondary/50">
        <GlobalSearch />
      </div>

      {/* Mobile navigation panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border-default bg-bg-tertiary px-4 py-4 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-2">
              Network
            </span>
            <Select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              options={networkOptions}
              className="w-full bg-bg-secondary border-border-default text-text-primary"
            />
          </div>

          <div className="flex flex-col gap-1 border-t border-border-default pt-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg text-sm text-text-secondary hover:bg-bg-secondary hover:text-text-primary font-semibold"
            >
              <Compass className="h-4 w-4 text-brand-primary" />
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
export default Header;

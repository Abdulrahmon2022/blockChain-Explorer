import React from "react";
import Link from "next/link";
import { Cpu, MessageSquare } from "lucide-react";
import { EXPLORER_NAME } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border-default bg-bg-footer mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 pb-8 border-b border-border-default">
          
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-brand-primary" />
              <span className="font-bold text-sm tracking-wider text-text-primary uppercase">
                {EXPLORER_NAME}
              </span>
            </div>
            <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
              A high-precision developer-focused blockchain indexer and explorer frontend. Analyze blocks, verify transaction receipts, and query addresses instantly.
            </p>
            <div className="flex items-center gap-3 pt-2 text-text-tertiary">
              <a href="#" className="hover:text-brand-primary transition-colors" aria-label="Twitter">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="hover:text-brand-primary transition-colors" aria-label="GitHub">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
              <a href="#" className="hover:text-brand-primary transition-colors" aria-label="Message">
                <MessageSquare className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-4">
              Explorer
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-text-secondary">
              <li>
                <Link href="/" className="hover:text-brand-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-brand-primary transition-colors">
                  Blocks
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-brand-primary transition-colors">
                  Transactions
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-4">
              Resources
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-text-secondary">
              <li>
                <a href="#" className="hover:text-brand-primary transition-colors">
                  API Docs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-primary transition-colors">
                  Developer Portal
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-primary transition-colors">
                  Network Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-[11px] text-text-disabled">
          <span>
            &copy; {currentYear} {EXPLORER_NAME}. Built with Antigravity Scan.
          </span>
          <div className="flex gap-4 font-semibold">
            <a href="#" className="hover:text-brand-primary transition-colors hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-brand-primary transition-colors hover:underline">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;

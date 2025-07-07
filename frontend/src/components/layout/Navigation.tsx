"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Modal, Tooltip } from "../ui";

const Navigation = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/info", label: "Info", icon: "ℹ️" },
    { path: "/generation", label: "Generation", icon: "🔧" },
  ];

  const howToPlayContent = (
    <div className="space-y-2">
      <p className="font-semibold">How to Play ChromaPath:</p>
      <ul className="text-xs space-y-1">
        <li>• Connect colored tiles to create paths</li>
        <li>• Match the target pattern shown</li>
        <li>• Use different colored tiles strategically</li>
        <li>• Complete the level to advance</li>
      </ul>
      <div className="pt-2 border-t border-base-content/20">
        <Link
          href="/info"
          className="text-primary hover:text-primary-focus text-xs underline"
        >
          Learn more on Info page →
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Side Navigation */}
      <nav className="hidden xl:flex h-screen w-64 bg-base-300/95 backdrop-blur-md border-r border-base-300 shadow-lg z-40 flex-col sticky top-0">
        {/* Logo */}
        <div className="p-6 border-b border-base-300">
          <Link
            href="/"
            className="text-2xl font-bold text-primary hover:text-primary-focus transition-colors text-center block"
          >
            ChromaPath
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 h-full p-4 space-y-2">
          {/* Home */}
          <Link
            key="/"
            href="/"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:scale-105 ${
              pathname === "/"
                ? "bg-primary text-primary-content shadow-lg"
                : "hover:bg-base-200 text-base-content"
            }`}
          >
            <span className="text-lg">🏠</span>
            <span className="font-medium">Home</span>
          </Link>

          {/* Play Section */}
          <div className="mt-2 mb-2">
            <div className="uppercase text-xs font-bold text-base-content/60 px-4 pb-1 tracking-wider select-none cursor-default">
              Play
            </div>
            <div className="bg-base-200/80 border border-base-300 rounded-xl shadow-inner flex flex-col gap-1 py-2">
              <Link
                href="/game"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:scale-105 ${
                  pathname === "/game"
                    ? "bg-primary text-primary-content shadow-lg"
                    : "hover:bg-base-300 text-base-content"
                }`}
              >
                <span className="text-lg">🎮</span>
                <span className="font-medium">Classic Mode</span>
              </Link>
              <Link
                href="/game/ladder"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:scale-105 ${
                  pathname === "/game/ladder"
                    ? "bg-primary text-primary-content shadow-lg"
                    : "hover:bg-base-300 text-base-content"
                }`}
              >
                <span className="text-lg">🏆</span>
                <span className="font-medium">Ladder Mode</span>
              </Link>
            </div>
          </div>

          {/* Other nav items */}
          {navItems.slice(1).map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:scale-105 ${
                pathname === item.path
                  ? "bg-primary text-primary-content shadow-lg"
                  : "hover:bg-base-200 text-base-content"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 mb-4 border-t border-base-300 space-y-2">
          {/* Settings Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="w-full justify-start gap-3"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </Button>
        </div>
      </nav>

      {/* Mobile Top Navigation */}
      <nav className="xl:hidden sticky top-0 z-40 bg-base-300/90 backdrop-blur-md border-b border-base-300 shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Logo - Centered */}
            <div className="flex-1 flex justify-center">
              <Link
                href="/"
                className="text-xl font-bold text-primary hover:text-primary-focus transition-colors text-left w-full"
              >
                ChromaPath
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2">
              {/* How to Play Tooltip for Mobile */}
              <Tooltip content={howToPlayContent} position="bottom">
                <Button variant="ghost" size="sm" className="min-w-[40px] px-2">
                  ?
                </Button>
              </Tooltip>

              {/* Settings Button for Mobile */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
                className="min-w-[40px] px-2"
              >
                ⚙️
              </Button>

              {/* Hamburger Menu */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="min-w-[40px] px-2"
              >
                {isMobileMenuOpen ? "✕" : "☰"}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="border-t border-base-300 bg-base-300/95 backdrop-blur-md">
              <div className="py-2 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      pathname === item.path
                        ? "bg-primary text-primary-content"
                        : "hover:bg-base-200 text-base-content"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}

                {/* Game Modes for Mobile */}
                <div className="border-t border-base-300 pt-2 mt-2">
                  <div className="px-4 py-2 text-xs font-semibold text-base-content/70 uppercase tracking-wide">
                    Play
                  </div>
                  <div className="bg-base-200/80 border border-base-300 rounded-xl shadow-inner flex flex-col gap-1 py-2">
                    <Link
                      href="/game"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        pathname === "/game"
                          ? "bg-primary text-primary-content"
                          : "hover:bg-base-300 text-base-content"
                      }`}
                    >
                      <span className="text-lg">🎮</span>
                      <div className="flex-1">
                        <div className="font-medium">Classic Mode</div>
                        <div className="text-xs text-base-content/70">
                          Play individual levels
                        </div>
                      </div>
                    </Link>
                    <Link
                      href="/game/ladder"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        pathname === "/game/ladder"
                          ? "bg-primary text-primary-content"
                          : "hover:bg-base-300 text-base-content"
                      }`}
                    >
                      <span className="text-lg">🏆</span>
                      <div className="flex-1">
                        <div className="font-medium">Ladder Mode</div>
                        <div className="text-xs text-base-content/70">
                          Complete 11 levels in sequence
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Settings"
        size="sm"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-base-content">Game Settings</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="toggle toggle-primary" />
                <span className="text-sm">Sound Effects</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  defaultChecked
                />
                <span className="text-sm">Background Music</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="toggle toggle-primary" />
                <span className="text-sm">Animations</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-base-content">Display</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  className="radio radio-primary"
                  defaultChecked
                />
                <span className="text-sm">Light Theme</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  className="radio radio-primary"
                />
                <span className="text-sm">Dark Theme</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  className="radio radio-primary"
                />
                <span className="text-sm">Auto</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-base-300">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSettingsOpen(false)}
              className="w-full"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Navigation;

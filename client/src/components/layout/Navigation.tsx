import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../ui";

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/game", label: "Play" },
    { path: "/info", label: "Info" },
    { path: "/generation", label: "Generation" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-base-300/80 backdrop-blur-sm border-b border-base-300">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div
            className="text-2xl font-bold text-primary cursor-pointer hover:text-primary-focus transition-colors"
            onClick={() => navigate("/")}
          >
            ChromaPath
          </div>

          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "primary" : "ghost"}
                size="sm"
                onClick={() => navigate(item.path)}
                className="min-w-[80px]"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

import React from "react";
import Link from "next/link";
import Card from "./Card";

interface GameModeCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  features?: string[];
  color: string;
  variant?: "compact" | "full";
}

const GameModeCard: React.FC<GameModeCardProps> = ({
  title,
  description,
  icon,
  href,
  features = [],
  color,
  variant = "full",
}) => {
  if (variant === "compact") {
    return (
      <Card
        variant="elevated"
        className="p-8 text-center hover:shadow-xl hover:bg-base-50 transition-all duration-300"
      >
        <div className="text-6xl mb-6">{icon}</div>
        <h3 className="text-2xl font-bold text-primary mb-4">{title}</h3>
        <p className="text-base-content/70 mb-6">{description}</p>
        <Link href={href}>
          <div
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r ${color} text-white font-semibold hover:shadow-lg hover:brightness-110 transition-all duration-300`}
          >
            <span>Play Now</span>
            <span className="hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="transition-all duration-300">
      <Link href={href} className="block h-full">
        <div className="p-8 h-full flex flex-col">
          {/* Icon and Title */}
          <div className="text-center mb-6">
            <div
              className={`text-6xl mb-4 bg-gradient-to-r ${color} bg-clip-text text-transparent`}
            >
              {icon}
            </div>
            <h2 className="text-2xl font-bold text-base-content mb-2">
              {title}
            </h2>
            <p className="text-base-content/70">{description}</p>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="flex-1">
              <h3 className="font-semibold text-base-content mb-3">
                Features:
              </h3>
              <ul className="space-y-2">
                {features.map((feature, featureIndex) => (
                  <li
                    key={featureIndex}
                    className="flex items-center gap-2 text-sm text-base-content/80"
                  >
                    <span className="text-primary">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA Button */}
          <div className="mt-6 text-center">
            <div
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r ${color} text-white font-semibold hover:shadow-lg hover:brightness-110 transition-all duration-300`}
            >
              <span>Play Now</span>
              <span className="hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
};

export default GameModeCard;

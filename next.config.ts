import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  devIndicators: false,
  // Components rely on the compiler for memoization; see
  // .cursor/skills/react-composition/SKILL.md (hard rule 8).
  reactCompiler: true,
};

export default nextConfig;

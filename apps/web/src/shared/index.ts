// Re-export everything from the shared package
export * from "@chromapath/shared-types";

// Keep deprecated methods for web (if still needed)
export * from "./boardGeneration/loops_deprecated_method/gen";
export * from "./boardGeneration/loops_deprecated_method/grid";
export * from "./boardGeneration/loops_deprecated_method/mitm";

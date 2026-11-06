const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Segment reaches jose through its Node entry. Resolve only jose against its
// browser export so Metro keeps React Native conditions for every other module.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "jose" || moduleName.startsWith("jose/")) {
    return context.resolveRequest(
      { ...context, unstable_conditionNames: ["browser"] },
      moduleName,
      platform,
    );
  }
  if (process.env.GROCERY_E2E === "1") {
    if (process.env.CI !== "1") throw new Error("GROCERY_E2E is restricted to CI.");
    const path = require("node:path");
    if (moduleName === "@clerk/expo") {
      return { type: "sourceFile", filePath: path.join(__dirname, "e2e/fixtures/clerk.ts") };
    }
    const resolved = context.resolveRequest(context, moduleName, platform);
    const fixtures = {
      "_layout.tsx": "layout.tsx",
      "index.tsx": "home.tsx",
      "saved-lists.tsx": "home.tsx",
    };
    if (
      resolved.type === "sourceFile" &&
      path.dirname(resolved.filePath) === path.join(__dirname, "src/app")
    ) {
      const fixture = fixtures[path.basename(resolved.filePath)];
      if (fixture)
        return { type: "sourceFile", filePath: path.join(__dirname, "e2e/fixtures", fixture) };
    }
    return resolved;
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
  dtsFile: "./src/uniwind-types.d.ts",
  polyfills: {
    rem: 14,
  },
});

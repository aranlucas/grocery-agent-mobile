const appJson = require("./app.json");

function envOrFallback(name, fallback) {
  return process.env[name] || fallback || "";
}

function runtimeUrlForKey(clerkPublishableKey, productionRuntimeUrl) {
  return clerkPublishableKey.startsWith("pk_test_")
    ? "https://agents-gateway-development.up.railway.app"
    : productionRuntimeUrl;
}

function configure({ config }) {
  const baseConfig = {
    ...appJson.expo,
    ...config,
  };
  const baseExtra = {
    ...appJson.expo.extra,
    ...config.extra,
  };
  // An isolated, credential-free simulator pilot. EAS production keeps its
  // existing remote version source, identity, plugins, and environment.
  if (process.env.GROCERY_FEEL_SIMULATOR === "1") {
    return {
      ...baseConfig,
      name: "Grocery Agent Feel Pilot",
      scheme: "grocery-agent-feel-pilot",
      ios: {
        ...baseConfig.ios,
        bundleIdentifier: "dev.agents.grocery.feelpilot",
        buildNumber: "1",
      },
      extra: {
        ...baseExtra,
        clerkPublishableKey: "",
        copilotKitRuntimeUrl: "https://example.invalid/copilotkit",
        marketingBaseUrl: "https://example.invalid/grocery",
      },
    };
  }
  const clerkPublishableKey = envOrFallback(
    "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
    baseExtra.clerkPublishableKey,
  );
  const localRuntimeUrl = runtimeUrlForKey(clerkPublishableKey, baseExtra.copilotKitRuntimeUrl);

  return {
    ...baseConfig,
    extra: {
      ...baseExtra,
      clerkPublishableKey,
      copilotKitRuntimeUrl: envOrFallback("EXPO_PUBLIC_COPILOTKIT_RUNTIME_URL", localRuntimeUrl),
      marketingBaseUrl: envOrFallback(
        "EXPO_PUBLIC_GROCERY_MARKETING_URL",
        baseExtra.marketingBaseUrl,
      ),
    },
  };
}

module.exports = configure;

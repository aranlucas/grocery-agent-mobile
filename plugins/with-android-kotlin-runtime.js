const { withAppBuildGradle } = require("expo/config-plugins");

module.exports = function withAndroidKotlinRuntime(config, { version }) {
  return withAppBuildGradle(config, (config) => {
    // kotlinx-io references MustUseReturnValues, introduced in Kotlin 2.3.
    // Align runtime libraries without changing Expo's compiler plugin toolchain.
    const dependency = `    implementation(platform("org.jetbrains.kotlin:kotlin-bom:${version}"))`;
    if (!config.modResults.contents.includes(dependency)) {
      if (!config.modResults.contents.includes("dependencies {")) {
        throw new Error("Could not locate Android app dependencies.");
      }
      config.modResults.contents = config.modResults.contents.replace(
        "dependencies {",
        `dependencies {\n${dependency}`,
      );
    }
    return config;
  });
};

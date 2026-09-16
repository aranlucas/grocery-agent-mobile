const { withDangerousMod } = require("expo/config-plugins");
const { readFile, writeFile } = require("node:fs/promises");
const path = require("node:path");

const RULE = "-dontwarn kotlin.MustUseReturnValues";

module.exports = function withKotlinReturnValueAnnotations(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const rulesPath = path.join(config.modRequest.platformProjectRoot, "app/proguard-rules.pro");
      const rules = await readFile(rulesPath, "utf8");
      if (!rules.split(/\r?\n/u).includes(RULE)) {
        // kotlinx-io uses this Kotlin 2.3 binary-retained compiler annotation.
        // Expo's Kotlin runtime does not include it; it has no runtime behavior.
        await writeFile(rulesPath, `${rules}\n# Optional Kotlin compiler annotation.\n${RULE}\n`);
      }
      return config;
    },
  ]);
};

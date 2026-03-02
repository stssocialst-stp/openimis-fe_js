/**
 * This script validates that there are no @stssocialst-stp packages in package.json
 *
 */
const pkg = require("../package.json");

const openimisDeps = Object.keys(pkg.dependencies).filter((dependency) => dependency.startsWith("@stssocialst-stp"));

if (openimisDeps.length > 0) {
  console.error("At least one dependency should not be added in package.json: ", openimisDeps);
  process.exit(1);
}

import { readFileSync, writeFileSync, existsSync } from "fs";
import semverPrerelease from "semver/functions/prerelease.js";

const targetVersion = process.env.npm_package_version;

// Check if this is a prerelease (beta) version
const isPreRelease = semverPrerelease(targetVersion) !== null;

// Determine which manifest file to read and update
const manifestFile = isPreRelease ? "manifest-beta.json" : "manifest.json";

// For beta releases, read from manifest-beta.json if it exists, otherwise from manifest.json
let sourceManifestFile = manifestFile;
if (isPreRelease && !existsSync("manifest-beta.json")) {
	sourceManifestFile = "manifest.json";
}

// read minAppVersion from the appropriate manifest and bump version
let manifest = JSON.parse(readFileSync(sourceManifestFile, "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;

// Only update the appropriate manifest file
// For beta releases: only update manifest-beta.json
// For stable releases: update manifest.json (and sync to manifest-beta.json is handled by ob-bumper)
writeFileSync(manifestFile, JSON.stringify(manifest, null, "\t"));

// Always update versions.json with target version and minAppVersion
let versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));

console.log(`Version bumped to ${targetVersion} (${isPreRelease ? 'beta' : 'stable'} release)`);
console.log(`Updated: ${manifestFile}, versions.json`);

const esbuild = require("esbuild");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from .env file
dotenv.config();

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

/**
 * Custom plugin to display build start/end logs and errors
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",
  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(
          `    ${location.file}:${location.line}:${location.column}:`
        );
      });
      console.log("[watch] build finished");
    });
  },
};

// Map desired env vars to inject at build time
const env = {
  "process.env.FIREBASE_API_KEY": JSON.stringify(process.env.FIREBASE_API_KEY),
  "process.env.FIREBASE_AUTH_DOMAIN": JSON.stringify(
    process.env.FIREBASE_AUTH_DOMAIN
  ),
  "process.env.FIREBASE_PROJECT_ID": JSON.stringify(
    process.env.FIREBASE_PROJECT_ID
  ),
  "process.env.FIREBASE_STORAGE_BUCKET": JSON.stringify(
    process.env.FIREBASE_STORAGE_BUCKET
  ),
  "process.env.FIREBASE_MESSAGING_SENDER_ID": JSON.stringify(
    process.env.FIREBASE_MESSAGING_SENDER_ID
  ),
  "process.env.FIREBASE_APP_ID": JSON.stringify(process.env.FIREBASE_APP_ID),
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "node",
    outfile: "dist/extension.js",
    external: ["vscode"],
    define: env,
    logLevel: "silent",
    plugins: [esbuildProblemMatcherPlugin],
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

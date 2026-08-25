import type { NextConfig } from "next";

const staticExport = process.env.STATIC_EXPORT === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "patchproof";

const config: NextConfig = {
  ...(staticExport
    ? {
        output: "export",
        basePath: `/${repositoryName}`,
        assetPrefix: `/${repositoryName}/`,
        images: { unoptimized: true },
      }
    : {}),
};

export default config;

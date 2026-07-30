import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";

export async function setupVite(app: Express, server: Server) {
  // Importación dinámica para que vite no se incluya en el bundle de producción
  const { createServer: createViteServer } = await import("vite");
  const { default: viteConfig } = await import("../../vite.config.js");

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Intentar múltiples paths posibles para el build del frontend
  const possiblePaths = [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "dist"),
    path.resolve("/app", "dist", "public"),
    path.resolve("/app", "dist"),
  ];

  let distPath: string | null = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.existsSync(path.join(p, "index.html"))) {
      distPath = p;
      console.log(`[static] Serving frontend from: ${distPath}`);
      break;
    }
  }

  if (!distPath) {
    console.error(`[static] Could not find build directory. Tried:`);
    for (const p of possiblePaths) {
      console.error(`  - ${p} (exists: ${fs.existsSync(p)})`);
    }
    // Servir un mensaje de error en lugar de colgar
    app.use("*", (_req, res) => {
      res.status(503).send(
        "<h1>Frontend not built</h1><p>Run <code>pnpm build</code> first.</p>"
      );
    });
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath!, "index.html"));
  });
}

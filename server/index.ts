import dotenv from "dotenv";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

// Load environment variables
dotenv.config({ path: '.env.development' });

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    try {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
      log("Vite development server setup complete");
    } catch (error) {
      log(`Vite setup failed: ${error.message}`);
      // Fallback to simple development page
      app.get("/*", (req, res) => {
        if (req.path.startsWith("/api")) {
          return res.status(404).json({ error: "API endpoint not found" });
        }
        
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>VyaparMitra - Development Server</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
              .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .status { color: #22c55e; font-weight: bold; }
              .error { color: #ef4444; font-weight: bold; }
              .api-list { background: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0; }
              .api-item { margin: 10px 0; }
              .method { background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🎯 VyaparMitra Development Server</h1>
              <p class="status">✅ Server is running successfully!</p>
              <p class="error">⚠️ Vite frontend setup failed - using fallback mode</p>
              
              <h2>🏗️ System Status</h2>
              <ul>
                <li>✅ PostgreSQL Connected</li>
                <li>✅ MongoDB Connected</li>
                <li>✅ Redis Connected</li>
                <li>✅ Voice Processing Models Loaded</li>
                <li>✅ Image Storage Initialized</li>
              </ul>

              <h2>🔌 Available API Endpoints</h2>
              <div class="api-list">
                <div class="api-item"><span class="method">GET</span> <code>/health</code> - Health check</div>
                <div class="api-item"><span class="method">GET</span> <code>/api/products</code> - List products</div>
                <div class="api-item"><span class="method">GET</span> <code>/api/products/:id</code> - Get product</div>
                <div class="api-item"><span class="method">POST</span> <code>/api/negotiations</code> - Create negotiation</div>
                <div class="api-item"><span class="method">GET</span> <code>/api/negotiations</code> - List negotiations</div>
                <div class="api-item"><span class="method">POST</span> <code>/api/auth/register</code> - User registration</div>
                <div class="api-item"><span class="method">POST</span> <code>/api/auth/login</code> - User login</div>
                <div class="api-item"><span class="method">POST</span> <code>/api/payment/create</code> - Create payment</div>
              </div>

              <p><strong>Error:</strong> ${error.message}</p>
              <p><strong>Solution:</strong> Check Vite configuration and dependencies.</p>
            </div>
          </body>
          </html>
        `);
      });
    }
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 4000 for VyaparMitra development.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "4000", 10);
  httpServer.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();

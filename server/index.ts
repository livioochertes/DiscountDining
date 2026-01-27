import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();

// CORS configuration for mobile app support
const allowedOrigins = [
  'https://eatoff.app',
  'capacitor://localhost',  // iOS Capacitor
  'http://localhost',       // Android Capacitor
  'ionic://localhost',      // Ionic
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow requests with matching origin or no origin (same-origin/server-to-server)
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    // For other origins, allow without credentials
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Registration will be handled by userAuth.ts with proper email verification

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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use port 5000 for development, 8081 for production
  // Port 8081 maps to external port 80 for deployment
  const port = app.get("env") === "development" ? 5000 : 8081;
  
  // Add startup timeout handling for faster deployment
  const startupTimeout = setTimeout(() => {
    log(`Server startup timeout reached. Forcing port bind to ${port}`);
  }, 10000);

  // Start the server with proper error handling
  server.on('error', (error: any) => {
    clearTimeout(startupTimeout);
    if (error.code === 'EADDRINUSE') {
      log(`Port ${port} is already in use. Please stop any existing processes and try again.`);
      process.exit(1);
    } else {
      log(`Server error: ${error.message}`);
      throw error;
    }
  });
  
  server.on('listening', () => {
    clearTimeout(startupTimeout);
    const address = server.address();
    log(`Server successfully listening on ${JSON.stringify(address)}`);
  });
  
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();

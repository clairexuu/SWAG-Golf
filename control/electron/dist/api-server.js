const importMetaUrl = require("url").pathToFileURL(__filename).href;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../api/src/server.ts
var server_exports = {};
__export(server_exports, {
  createApp: () => createApp,
  startApiServer: () => startApiServer
});
module.exports = __toCommonJS(server_exports);
var import_express5 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");

// ../api/src/routes/generate.ts
var import_express = require("express");

// ../api/src/services/python-client.ts
var PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";
async function fetchFromPython(endpoint, options = {}, signal) {
  const url = `${PYTHON_API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    signal,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Python API error (${response.status}): ${errorText}`);
  }
  return response.json();
}
async function checkPythonHealth() {
  try {
    const response = await fetch(`${PYTHON_API_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(2e3)
      // 2 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ../api/src/routes/generate.ts
var router = (0, import_express.Router)();
var MAX_RETRIES = 2;
var RETRY_DELAYS = [1e3, 2e3];
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
router.post("/generate", async (req, res) => {
  const abortController = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });
  try {
    const { input, styleId, numImages, experimentalMode, sessionId } = req.body;
    if (!input || !styleId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: "Missing required fields: input and styleId are required"
        }
      });
    }
    if (input.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Input text cannot be empty"
        }
      });
    }
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (abortController.signal.aborted)
        return;
      try {
        const response = await fetchFromPython("/generate", {
          method: "POST",
          body: JSON.stringify({ input, styleId, numImages: numImages || 4, experimentalMode, sessionId })
        }, abortController.signal);
        return res.json(response);
      } catch (pythonError) {
        if (pythonError.name === "AbortError") {
          console.log("Generation cancelled by client");
          return;
        }
        console.error(`[Generate] Attempt ${attempt + 1} failed:`, pythonError);
        const pythonHealthy = await checkPythonHealth();
        if (!pythonHealthy) {
          console.warn(`[Generate] Python backend is unreachable`);
        }
      }
      if (attempt < MAX_RETRIES) {
        console.log(`[Generate] Retrying in ${RETRY_DELAYS[attempt]}ms...`);
        await delay(RETRY_DELAYS[attempt]);
      }
    }
    return res.status(503).json({
      success: false,
      error: {
        code: "BACKEND_UNAVAILABLE",
        message: "Generation service temporarily unavailable. Please try again or restart the service."
      }
    });
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Generation cancelled by client");
      return;
    }
    console.error("Generation error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "GENERATION_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      }
    });
  }
});
router.post("/generate-stream", async (req, res) => {
  const abortController = new AbortController();
  res.on("close", () => abortController.abort());
  try {
    const { input, styleId } = req.body;
    if (!input || !styleId) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_REQUEST", message: "Missing required fields: input and styleId are required" }
      });
    }
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    });
    const pythonRes = await fetch(`${PYTHON_API_URL}/generate-stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
      signal: abortController.signal
    });
    if (!pythonRes.ok || !pythonRes.body) {
      res.write(`event: error
data: ${JSON.stringify({ message: "Backend unavailable" })}

`);
      res.end();
      return;
    }
    const reader = pythonRes.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          break;
        res.write(decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        res.write(`event: error
data: ${JSON.stringify({ message: "Stream interrupted" })}

`);
      }
    }
    res.end();
  } catch (err) {
    if (err.name === "AbortError")
      return;
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: { code: "STREAM_ERROR", message: err instanceof Error ? err.message : "Unknown error" }
      });
    } else {
      res.write(`event: error
data: ${JSON.stringify({ message: "Backend unavailable" })}

`);
      res.end();
    }
  }
});
router.post("/refine", async (req, res) => {
  const abortController = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });
  try {
    const { refinePrompt, selectedImagePaths, styleId, sessionId } = req.body;
    if (!refinePrompt || !selectedImagePaths?.length || !styleId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: "Missing required fields: refinePrompt, selectedImagePaths, and styleId are required"
        }
      });
    }
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (abortController.signal.aborted)
        return;
      try {
        const response = await fetchFromPython("/refine", {
          method: "POST",
          body: JSON.stringify({ refinePrompt, selectedImagePaths, styleId, sessionId })
        }, abortController.signal);
        return res.json(response);
      } catch (pythonError) {
        if (pythonError.name === "AbortError") {
          console.log("Refine cancelled by client");
          return;
        }
        console.error(`[Refine] Attempt ${attempt + 1} failed:`, pythonError);
        const pythonHealthy = await checkPythonHealth();
        if (!pythonHealthy) {
          console.warn(`[Refine] Python backend is unreachable`);
        }
      }
      if (attempt < MAX_RETRIES) {
        console.log(`[Refine] Retrying in ${RETRY_DELAYS[attempt]}ms...`);
        await delay(RETRY_DELAYS[attempt]);
      }
    }
    return res.status(503).json({
      success: false,
      error: {
        code: "BACKEND_UNAVAILABLE",
        message: "Generation service temporarily unavailable. Please try again or restart the service."
      }
    });
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Refine cancelled by client");
      return;
    }
    console.error("Refine error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "REFINE_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      }
    });
  }
});
router.post("/refine-stream", async (req, res) => {
  const abortController = new AbortController();
  res.on("close", () => abortController.abort());
  try {
    const { refinePrompt, selectedImagePaths, styleId } = req.body;
    if (!refinePrompt || !selectedImagePaths?.length || !styleId) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_REQUEST", message: "Missing required fields: refinePrompt, selectedImagePaths, and styleId are required" }
      });
    }
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    });
    const pythonRes = await fetch(`${PYTHON_API_URL}/refine-stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
      signal: abortController.signal
    });
    if (!pythonRes.ok || !pythonRes.body) {
      res.write(`event: error
data: ${JSON.stringify({ message: "Backend unavailable" })}

`);
      res.end();
      return;
    }
    const reader = pythonRes.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          break;
        res.write(decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        res.write(`event: error
data: ${JSON.stringify({ message: "Stream interrupted" })}

`);
      }
    }
    res.end();
  } catch (err) {
    if (err.name === "AbortError")
      return;
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: { code: "STREAM_ERROR", message: err instanceof Error ? err.message : "Unknown error" }
      });
    } else {
      res.write(`event: error
data: ${JSON.stringify({ message: "Backend unavailable" })}

`);
      res.end();
    }
  }
});
var generate_default = router;

// ../api/src/routes/styles.ts
var import_express2 = require("express");
var import_stream = require("stream");
var PYTHON_API_URL2 = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";
var router2 = (0, import_express2.Router)();
var MAX_RETRIES2 = 2;
var RETRY_DELAYS2 = [1e3, 2e3];
function delay2(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
router2.get("/styles", async (req, res) => {
  try {
    for (let attempt = 0; attempt <= MAX_RETRIES2; attempt++) {
      const pythonHealthy = await checkPythonHealth();
      if (pythonHealthy) {
        try {
          const response = await fetchFromPython("/styles");
          return res.json(response);
        } catch (err) {
          console.error(`[Styles] Attempt ${attempt + 1} failed:`, err);
        }
      } else {
        console.warn(`[Styles] Health check failed (attempt ${attempt + 1}/${MAX_RETRIES2 + 1})`);
      }
      if (attempt < MAX_RETRIES2) {
        await delay2(RETRY_DELAYS2[attempt]);
      }
    }
    res.status(503).json({
      success: false,
      error: {
        code: "BACKEND_UNAVAILABLE",
        message: "Style service temporarily unavailable. Please try again or restart the service."
      }
    });
  } catch (error) {
    console.error("Error fetching styles:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "STYLES_ERROR",
        message: error instanceof Error ? error.message : "Failed to load styles"
      }
    });
  }
});
router2.post("/styles", async (req, res) => {
  try {
    const pythonHealthy = await checkPythonHealth();
    if (!pythonHealthy) {
      return res.status(503).json({
        success: false,
        error: "Python backend is unavailable"
      });
    }
    const response = await fetch(`${PYTHON_API_URL2}/styles`, {
      method: "POST",
      headers: {
        "content-type": req.headers["content-type"]
      },
      body: import_stream.Readable.toWeb(req),
      duplex: "half"
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Error creating style:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create style"
    });
  }
});
router2.post("/styles/:styleId/images", async (req, res) => {
  const { styleId } = req.params;
  try {
    const pythonHealthy = await checkPythonHealth();
    if (!pythonHealthy) {
      return res.status(503).json({
        success: false,
        error: "Python backend is unavailable"
      });
    }
    const response = await fetch(`${PYTHON_API_URL2}/styles/${styleId}/images`, {
      method: "POST",
      headers: {
        "content-type": req.headers["content-type"]
      },
      body: import_stream.Readable.toWeb(req),
      duplex: "half"
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error(`Error adding images to style ${styleId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to add images"
    });
  }
});
router2.put("/styles/:styleId", async (req, res) => {
  const { styleId } = req.params;
  try {
    const pythonHealthy = await checkPythonHealth();
    if (!pythonHealthy) {
      return res.status(503).json({
        success: false,
        error: "Python backend is unavailable"
      });
    }
    const response = await fetchFromPython(
      `/styles/${styleId}`,
      {
        method: "PUT",
        body: JSON.stringify(req.body)
      }
    );
    return res.json(response);
  } catch (error) {
    console.error(`Error updating style ${styleId}:`, error);
    const status = error.message?.includes("404") ? 404 : 500;
    res.status(status).json({
      success: false,
      error: error.message || "Failed to update style"
    });
  }
});
router2.delete("/styles/:styleId", async (req, res) => {
  const { styleId } = req.params;
  try {
    const pythonHealthy = await checkPythonHealth();
    if (!pythonHealthy) {
      return res.status(503).json({
        success: false,
        error: "Python backend is unavailable"
      });
    }
    const response = await fetchFromPython(
      `/styles/${styleId}`,
      { method: "DELETE" }
    );
    return res.json(response);
  } catch (error) {
    console.error(`Error deleting style ${styleId}:`, error);
    const status = error.message?.includes("404") ? 404 : 500;
    res.status(status).json({
      success: false,
      error: error.message || "Failed to delete style"
    });
  }
});
router2.delete("/styles/:styleId/images", async (req, res) => {
  const { styleId } = req.params;
  try {
    const pythonHealthy = await checkPythonHealth();
    if (!pythonHealthy) {
      return res.status(503).json({
        success: false,
        error: "Python backend is unavailable"
      });
    }
    const response = await fetchFromPython(
      `/styles/${styleId}/images`,
      {
        method: "DELETE",
        body: JSON.stringify(req.body)
      }
    );
    return res.json(response);
  } catch (error) {
    console.error(`Error deleting images from style ${styleId}:`, error);
    const status = error.message?.includes("404") ? 404 : 500;
    res.status(status).json({
      success: false,
      error: error.message || "Failed to delete images"
    });
  }
});
var styles_default = router2;

// ../api/src/routes/feedback.ts
var import_express3 = require("express");
var router3 = (0, import_express3.Router)();
router3.post("/feedback", async (req, res) => {
  try {
    const { sessionId, styleId, feedback } = req.body;
    if (!sessionId || !styleId || !feedback) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: "Missing required fields: sessionId, styleId, and feedback are required"
        }
      });
    }
    const pythonHealthy = await checkPythonHealth();
    if (!pythonHealthy) {
      return res.status(503).json({
        success: false,
        error: {
          code: "BACKEND_UNAVAILABLE",
          message: "Python backend is unavailable"
        }
      });
    }
    const response = await fetchFromPython("/feedback", {
      method: "POST",
      body: JSON.stringify({ sessionId, styleId, feedback })
    });
    return res.json(response);
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "FEEDBACK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error"
      }
    });
  }
});
router3.post("/feedback/summarize", async (req, res) => {
  try {
    const { sessionId, styleId } = req.body;
    if (!sessionId || !styleId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: "Missing required fields: sessionId and styleId are required"
        }
      });
    }
    const pythonHealthy = await checkPythonHealth();
    if (!pythonHealthy) {
      return res.status(503).json({
        success: false,
        error: {
          code: "BACKEND_UNAVAILABLE",
          message: "Python backend is unavailable"
        }
      });
    }
    const response = await fetchFromPython("/feedback/summarize", {
      method: "POST",
      body: JSON.stringify({ sessionId, styleId })
    });
    return res.json(response);
  } catch (error) {
    console.error("Summarize error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "SUMMARIZE_ERROR",
        message: error instanceof Error ? error.message : "Unknown error"
      }
    });
  }
});
var feedback_default = router3;

// ../api/src/routes/generations.ts
var import_express4 = require("express");
var router4 = (0, import_express4.Router)();
router4.get("/generations", async (req, res) => {
  try {
    const pythonHealthy = await checkPythonHealth();
    if (pythonHealthy) {
      const queryString = new URLSearchParams(
        req.query
      ).toString();
      const endpoint = queryString ? `/generations?${queryString}` : "/generations";
      const response = await fetchFromPython(endpoint);
      return res.json(response);
    }
    res.json({
      success: true,
      total: 0,
      generations: []
    });
  } catch (error) {
    console.error("Error fetching generations:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "GENERATIONS_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch generations"
      }
    });
  }
});
router4.post("/generations/:dirName/confirm", async (req, res) => {
  try {
    const pythonHealthy = await checkPythonHealth();
    if (!pythonHealthy) {
      return res.status(503).json({ success: false, error: { code: "BACKEND_UNAVAILABLE", message: "Python backend is not available" } });
    }
    const response = await fetchFromPython(`/generations/${req.params.dirName}/confirm`, {
      method: "POST"
    });
    return res.json(response);
  } catch (error) {
    console.error("Error confirming generation:", error);
    res.status(500).json({ success: false, error: { code: "CONFIRM_ERROR", message: error instanceof Error ? error.message : "Failed to confirm generation" } });
  }
});
var generations_default = router4;

// ../api/src/server.ts
var __filename = (0, import_url.fileURLToPath)(importMetaUrl);
var __dirname = import_path.default.dirname(__filename);
function createApp(options = {}) {
  const generatedPath = options.generatedImagesPath || import_path.default.resolve(__dirname, "../../../generated_outputs");
  const referencePath = options.referenceImagesPath || import_path.default.resolve(__dirname, "../../../rag/reference_images");
  const app = (0, import_express5.default)();
  app.use((0, import_cors.default)());
  app.use(import_express5.default.json());
  app.use("/api/generated", import_express5.default.static(generatedPath));
  app.use("/api/reference-images", import_express5.default.static(referencePath));
  app.use((req, res, next) => {
    console.log(`${(/* @__PURE__ */ new Date()).toISOString()} - ${req.method} ${req.path}`);
    next();
  });
  app.get("/api/health", async (req, res) => {
    const pythonConnected = await checkPythonHealth();
    res.json({
      status: "ok",
      pythonBackend: pythonConnected ? "connected" : "disconnected",
      version: "1.0.0",
      mode: pythonConnected ? "production" : "limited"
    });
  });
  app.use("/api", generate_default);
  app.use("/api", styles_default);
  app.use("/api", feedback_default);
  app.use("/api", generations_default);
  if (options.frontendPath) {
    app.use(import_express5.default.static(options.frontendPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api"))
        return next();
      res.sendFile(import_path.default.join(options.frontendPath, "index.html"));
    });
  }
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${req.path} not found`
      }
    });
  });
  app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Internal server error"
      }
    });
  });
  return app;
}
function startApiServer(options = {}) {
  const port = options.port || 3001;
  const app = createApp(options);
  return new Promise((resolve) => {
    const server = app.listen(port, async () => {
      const pythonConnected = await checkPythonHealth();
      console.log(`[API] Server running on http://localhost:${port}`);
      console.log(`[API] Python backend: ${pythonConnected ? "CONNECTED" : "DISCONNECTED"}`);
      resolve(server);
    });
  });
}
var isDirectRun = importMetaUrl === `file://${process.argv[1]}` || process.argv[1]?.endsWith("server.ts") || process.argv[1]?.endsWith("server.js");
if (isDirectRun) {
  const PORT = 3001;
  startApiServer({ port: PORT }).then(() => {
    console.log("=".repeat(60));
    console.log("SWAG Concept Sketch Agent - API Server");
    console.log("=".repeat(60));
    console.log(`Available endpoints:`);
    console.log(`  GET  http://localhost:${PORT}/api/health`);
    console.log(`  GET  http://localhost:${PORT}/api/styles`);
    console.log(`  POST http://localhost:${PORT}/api/generate`);
    console.log(`  GET  http://localhost:${PORT}/api/generated/* (static images)`);
    console.log("=".repeat(60));
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createApp,
  startApiServer
});
//# sourceMappingURL=api-server.js.map

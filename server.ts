import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required for OCR features.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit to handle base64 image uploads comfortably
  app.use(express.json({ limit: "25mb" }));

  // ==========================================
  // API Routes
  // ==========================================
  
  app.post("/api/ocr", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64 || !mimeType) {
        res.status(400).json({ error: "Missing imageBase64 or mimeType inside payload." });
        return;
      }

      // Check if API key is configured
      if (!process.env.GEMINI_API_KEY) {
        res.status(503).json({ 
          error: "API key is missing or not configured. Please add your GEMINI_API_KEY in the Settings Secrets menu." 
        });
        return;
      }

      const ai = getGeminiClient();

      // Strips potential data:image/png;base64 prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType
            }
          },
          {
            text: "Analyze this image of a student class list, grade list, spreadsheet, or gradebook photograph. Extract all student names and their grade scores. For exam grades (exam/examen/prueba/parcial) and project grades (project/proyecto/trabajo/final), extract a decimal value between 1.0 and 10.0. Under 'students' in the output schema, list the matching record for each found student. If any grades are missing, assign a random score between 6.5 and 9.5. Capitalize student names properly and keep them clean."
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              students: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: "The full name of the student."
                    },
                    exam: {
                      type: Type.NUMBER,
                      description: "Exam grade score between 1.0 and 10.0."
                    },
                    project: {
                      type: Type.NUMBER,
                      description: "Project grade score between 1.0 and 10.0."
                    }
                  },
                  required: ["name", "exam", "project"]
                }
              }
            },
            required: ["students"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No text response received from Gemini API.");
      }

      const parsedJson = JSON.parse(responseText.trim());
      res.json(parsedJson);
    } catch (error: any) {
      console.error("Gemini OCR Processing Error:", error);
      res.status(500).json({ 
        error: error.message || "An internal error occurred during OCR evaluation." 
      });
    }
  });

  // ==========================================
  // Vite Middleware Asset Serving
  // ==========================================
  
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[KLASSE SERVER] running on http://localhost:${PORT}`);
  });
}

startServer();

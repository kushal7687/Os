import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }
  return client;
};

export const generateTerminalResponse = async (history: string, command: string): Promise<string> => {
  try {
    const ai = getClient();
    const model = ai.models;
    
    const systemPrompt = `
      You are the kernel/shell of a simulated Linux-like mobile OS called CloudOS.
      The user is typing commands into a terminal.
      
      Rules:
      1. Act like a helpful Linux terminal assistant.
      2. If the user asks for code, provide it concisely.
      3. If the user types a pseudo-command (like 'install app'), simulate the output.
      4. Keep responses brief and formatted for a terminal (no markdown code blocks unless explicitly asked for a script file).
      5. The current directory is ~/home/user.
      6. Be geeky but accessible.
    `;

    const response = await model.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `History:\n${history}\n\nUser Command: ${command}`,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text || "Command executed with no output.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error: Kernel panic. Connection to AI subsystem failed.";
  }
};

export const chatWithAssistant = async (message: string): Promise<string> => {
    try {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: message,
            config: {
                systemInstruction: "You are the intelligent assistant for CloudOS. You are helpful, witty, and concise."
            }
        });
        return response.text || "...";
    } catch (e) {
        return "I'm having trouble connecting to the cloud.";
    }
}

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
}

export const performWebSearch = async (query: string): Promise<SearchResult[]> => {
    try {
        const ai = getClient();
        // Using gemini-3-flash-preview for text tasks with search grounding
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: `Search for: ${query}. Return a list of 5 relevant results.`,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        // Extract grounding chunks
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const results: SearchResult[] = [];

        chunks.forEach((chunk: any) => {
            if (chunk.web) {
                results.push({
                    title: chunk.web.title || "Web Result",
                    url: chunk.web.uri,
                    snippet: "Click to visit this website."
                });
            }
        });

        // Fallback if no grounding chunks (AI just chatted)
        if (results.length === 0 && response.text) {
             results.push({
                 title: "AI Summary",
                 url: "#",
                 snippet: response.text.slice(0, 150) + "..."
             });
        }

        return results;
    } catch (e) {
        console.error("Search Error", e);
        return [];
    }
};

export const readWebPage = async (url: string): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a web browser engine. 
      Access this URL: "${url}" (using your search tools if needed) and render its main content as clean, readable Markdown.
      Ignore navigation menus, ads, and footers. Focus on the article text, main information, or video descriptions.
      If it is a blocked site (like Instagram/Facebook), describe what the page typically allows users to do.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text || "Could not render page content.";
  } catch (e) {
    return "Error: Secure connection to AI Renderer failed.";
  }
};
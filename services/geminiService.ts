import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }
  return client;
};

export const generateTerminalResponse = async (history: string, command: string, fileSystemContext: string): Promise<string> => {
  try {
    const ai = getClient();
    const model = ai.models;
    
    const systemPrompt = `
      ROLE: You are the KERNEL and SHELL of a Kali Linux machine.
      USER: root
      
      YOUR TASK:
      Execute the user's command based on the provided FILE SYSTEM CONTEXT.
      
      RULES:
      1. REALISM: You are NOT an AI assistant. You do not explain things. You output EXACTLY what the Linux terminal would output.
      2. EXECUTION: If the user runs a python script (e.g., 'python exploit.py'), READ the file content from the Context and SIMULATE its execution logic perfectly.
      3. TOOLS: If the user runs 'nmap', 'msfconsole', 'sqlmap', 'aircrack-ng', generate REALISTIC output.
         - For 'nmap <ip>', invent realistic open ports and services for that IP.
         - For 'ping', simulate the packet output.
      4. PERSISTENCE: If the user creates a file via 'echo "..." > file', assume the file system handles it, but if you need to output confirmation, do so.
      5. FORMAT: Use standard stdout formatting.
      6. ERROR HANDLING: If a file doesn't exist in the Context, return standard 'No such file or directory' errors.
      
      RESPONSE FORMAT:
      Output ONLY the raw terminal text. No markdown blocks unless necessary for code display.
    `;

    const response = await model.generateContent({
      model: 'gemini-3-flash-preview', // Using flash for speed, or pro for better logic
      contents: `
        [FILE SYSTEM STATE]
        ${fileSystemContext}
        
        [TERMINAL HISTORY]
        ${history}
        
        [NEW COMMAND]
        root@kali:~# ${command}
      `,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4, // Lower temperature for more deterministic/logic-based output
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Kernel Panic:", error);
    return "zsh: segmentation fault (core dumped)"; // Authentic error
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
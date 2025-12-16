import { GoogleGenAI } from "@google/genai";
import { OMEGA_PROTOCOL_TEMPLATE, PROMPT_MODEL_NAME } from "../constants";

export interface AgentConfig {
  agentName: string;
  companyName: string;
  context: string;
  dataToCollect: string[];
}

export async function generateSystemPrompt(config: AgentConfig): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API Key missing");
  }

  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // We use the lighter model to act as the "Configurator"
  // It takes the raw inputs and formats them into the OMEGA Protocol naturally
  // ensuring the personality traits match the context.
  
  const metaPrompt = `
    You are an expert Prompt Engineer for Voice AI Agents.
    Your task is to take the following raw configuration and fill in the "OMEGA PROTOCOL" template.
    
    USER CONFIGURATION:
    - Agent Name: ${config.agentName}
    - Company: ${config.companyName}
    - Role/Context: ${config.context}
    - Data to Collect: ${config.dataToCollect.join(', ')}

    TEMPLATE TO FILL:
    ${OMEGA_PROTOCOL_TEMPLATE}

    INSTRUCTIONS:
    1. Replace {{AGENT_NAME}}, {{COMPANY_NAME}}, and {{CONTEXT}} with the user's inputs.
    2. Enhance the {{CONTEXT}} slightly to ensure the agent understands how to act out that role (e.g., if "Doctor", add "Empathetic, professional").
    3. Format {{DATA_COLLECTION_RULES}} as a strict bulleted list of data points the agent MUST gather during the conversation.
    4. Return ONLY the final filled System Instruction string. Do not add markdown code blocks.
  `;

  try {
    const response = await client.models.generateContent({
      model: PROMPT_MODEL_NAME,
      contents: metaPrompt,
    });

    return response.text || OMEGA_PROTOCOL_TEMPLATE;
  } catch (error) {
    console.error("Failed to generate prompt:", error);
    // Fallback: Manual replacement if API fails
    let prompt = OMEGA_PROTOCOL_TEMPLATE
      .replace('{{AGENT_NAME}}', config.agentName)
      .replace('{{COMPANY_NAME}}', config.companyName)
      .replace('{{CONTEXT}}', config.context);
      
    const rules = config.dataToCollect.map(d => `- ${d}`).join('\n');
    prompt = prompt.replace('{{DATA_COLLECTION_RULES}}', rules);
    
    return prompt;
  }
}

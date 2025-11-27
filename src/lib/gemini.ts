// Utilitário para acessar a API do Gemini Flash via frontend
import { GoogleGenerativeAI } from "@google/generative-ai";

// Passe sua chave diretamente aqui (NÃO recomendado para produção)
const genAI = new GoogleGenerativeAI("AIzaSyC--TB411d4BKUOVD1co-6G78MFMFlgQEQ");

export async function askGemini(prompt: string) {
  try {
    // Use o modelo gratuito padrão
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    // Log detalhado para debug
    console.error("Erro ao chamar Gemini:", error);
    if (error instanceof Error) {
      return `Erro Gemini: ${error.message}`;
    }
    return "Erro desconhecido ao acessar Gemini.";
  }
}

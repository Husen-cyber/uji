import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, SchemaType } from "@google/genai";

export interface Question {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] || '' });
  }

  async generateQuestions(topic: string): Promise<Question[]> {
    const modelId = 'gemini-2.5-flash';

    // Define the schema properly
    const questionSchema = {
      type: Type.OBJECT,
      properties: {
        questionText: { type: Type.STRING, description: "Teks pertanyaan dalam Bahasa Indonesia" },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "4 pilihan jawaban"
        },
        correctAnswerIndex: { type: Type.INTEGER, description: "Indeks jawaban yang benar (0-3)" }
      },
      required: ["questionText", "options", "correctAnswerIndex"]
    };

    const responseSchema = {
      type: Type.ARRAY,
      items: questionSchema,
      description: "Daftar 5 pertanyaan ujian"
    };

    try {
      const response = await this.ai.models.generateContent({
        model: modelId,
        contents: `Buatkan 5 soal ujian pilihan ganda yang menantang tentang topik: "${topic}". 
                   Pastikan output dalam Bahasa Indonesia.
                   Jangan memberikan penjelasan, hanya data JSON murni sesuai skema.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.7
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Respon kosong dari AI");
      }
      
      return JSON.parse(text) as Question[];
    } catch (error) {
      console.error("Error generating exam:", error);
      // Return fallback data in case of error to prevent crash
      return [
        {
          questionText: "Gagal memuat soal AI. Ibukota Indonesia adalah?",
          options: ["Jakarta", "Bandung", "Surabaya", "Medan"],
          correctAnswerIndex: 0
        }
      ];
    }
  }
}
import { NextRequest, NextResponse } from "next/server";
import OpenAI from 'openai';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';

export const runtime = 'nodejs';

type Review = {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  score: number;
};

/**
 * Handles the POST request to review an uploaded CV file.
 * @param file - Uploaded file
 * @returns Buffer containing the file data
 * @author Cristono Wijaya
 * @description Reads the uploaded file and returns its data as a Buffer.
 */
async function readFileAsBuffer(file: File): Promise<Buffer> {
  const bytes = await file.arrayBuffer();
  return Buffer.from(bytes);
}

/**
 * Extracts text from a PDF file.
 * @param buffer - Buffer containing the .pdf file data
 * @returns Extracted text from the PDF file
 * @author Cristono Wijaya
 * @description Extracts text from a PDF file using the pdf-parse library.
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extracts text from a DOCX file.
 * @param buffer - Buffer containing the .docx file data
 * @returns Extracted text from the DOCX file
 * @author Cristono Wijaya
 * @description Extracts text from a DOCX file using the mammoth library.
 */
async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

/**
 * Processes the uploaded file and extracts its text content.
 * @param file - Uploaded file
 * @returns Extracted text content from the file
 * @author Cristono Wijaya
 * @description Determines the file type and uses the appropriate method to extract text from PDF, DOCX, or plain text files.
 */
async function processFile(file: File): Promise<string> {
  const buffer = await readFileAsBuffer(file);
  
  if (file.type === 'application/pdf') {
    return extractTextFromPdf(buffer);
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractTextFromDocx(buffer);
  } else if (file.type === 'text/plain') {
    return buffer.toString('utf-8');
  } else {
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, or text file.');
  }
}

/**
 * Builds a prompt for the AI model to review a CV.
 * @param cv - CV text content
 * @returns Prompt string for the AI model
 * @author Cristono Wijaya
 * @description Constructs a prompt that instructs the AI model to analyze the CV and return a structured JSON review.
 */
function buildPrompt(cv: string) {
  return `You are an expert career coach and recruiter. Analyze the following CV/resume content and produce a structured review.

    Return strictly a JSON object with the following keys:
    - strengths: string[] (3-7 concise bullet points)
    - weaknesses: string[] (3-7 concise bullet points)
    - suggestions: string[] (actionable improvements, 3-7 items)
    - score: number (integer from 1 to 10)

    CV:
    """${cv}"""`;
}

/**
 * Handles the POST request to review an uploaded CV file.
 * @param req - Next.js API request object
 * @returns JSON response with the review results
 * @author Cristono Wijaya
 * @description Processes the uploaded CV file or text, interacts with the OpenAI API to generate a review, and returns the results in a structured JSON format.
 */
export async function POST(req: Request) {
  try {
    console.log(req);
    const formData = await req.formData();
    const text = formData.get('text') as string | null;
    const file = formData.get('file') as File | null;

    // Validate input
    if (!text && !file) {
      return NextResponse.json(
        { error: 'Either text or file must be provided' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not set on server' },
        { status: 500 }
      );
    }

    // Process file if uploaded
    let cvText = text || '';
    if (file) {
      try {
        const extractedText = await processFile(file);
        cvText = extractedText;
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Error processing file' },
          { status: 400 }
        );
      }
    }

    // Validate we have text to process
    if (!cvText.trim()) {
      return NextResponse.json(
        { error: 'No text content found to analyze' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a strict JSON generator. Always respond with a single JSON object, no code fences.',
        },
        { role: 'user', content: buildPrompt(cvText) },
      ],
    });

    const content = completion.choices?.[0]?.message?.content ?? '{}';
    let parsed: Review | null = null;
    try {
      parsed = JSON.parse(content) as Review;
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]) as Review;
      }
    }

    if (!parsed) {
      return NextResponse.json(
        { error: 'Failed to parse model response' },
        { status: 502 }
      );
    }

    const sanitizeArray = (x: any): string[] =>
      Array.isArray(x) ? x.map(String).filter(Boolean) : [];
    const scoreNum = Number((parsed as any).score);
    const result: Review = {
      strengths: sanitizeArray((parsed as any).strengths).slice(0, 10),
      weaknesses: sanitizeArray((parsed as any).weaknesses).slice(0, 10),
      suggestions: sanitizeArray((parsed as any).suggestions).slice(0, 10),
      score: Number.isFinite(scoreNum)
        ? Math.min(10, Math.max(1, Math.round(scoreNum)))
        : 0,
    };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('API /api/review error:', err);
    return NextResponse.json(
      { error: err.message || 'Unexpected server error' },
      { status: 500 }
    );
  }
}


 
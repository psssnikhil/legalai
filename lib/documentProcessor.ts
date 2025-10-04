// Dynamic import to avoid initialization issues
import mammoth from 'mammoth'

export interface ProcessedDocument {
  text: string
  metadata: {
    pageCount?: number
    wordCount: number
    language?: string
    confidence?: number
  }
}

export async function processDocument(file: Buffer, mimeType: string, filename: string): Promise<ProcessedDocument> {
  try {
    let text = ''
    let metadata: ProcessedDocument['metadata'] = {
      wordCount: 0,
    }

    if (mimeType === 'application/pdf') {
      try {
        // Use a more reliable way to load pdf-parse
        const pdfParse = require('pdf-parse/lib/pdf-parse')
        const pdfData = await pdfParse(file)
        text = pdfData.text || ''
        metadata = {
          pageCount: pdfData.numpages || 0,
          wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
          language: 'en',
        }
        console.log('[documentProcessor] PDF parsed successfully, text length:', text.length)
      } catch (pdfError) {
        console.error('[documentProcessor] PDF parsing error:', pdfError)
        // Fallback: return empty text with metadata
        text = `[PDF Document: ${filename}]\n\nNote: PDF text extraction failed. The document contains ${file.length} bytes but text could not be extracted automatically.`
        metadata = {
          wordCount: 0,
          language: 'en',
        }
      }
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      const result = await mammoth.extractRawText({ buffer: file })
      text = result.value
      metadata = {
        wordCount: text.split(/\s+/).length,
        language: 'en',
      }
    } else if (mimeType.startsWith('text/')) {
      text = file.toString('utf-8')
      metadata = {
        wordCount: text.split(/\s+/).length,
        language: 'en',
      }
    } else if (mimeType.startsWith('image/')) {
      // For now, skip OCR processing to avoid dependency issues
      // TODO: Implement OCR processing with proper error handling
      text = '[Image file - OCR processing not available]'
      metadata = {
        wordCount: 0,
        language: 'en',
        confidence: 0,
      }
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`)
    }

    // Clean up text
    text = text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
      .trim()

    return {
      text,
      metadata: {
        ...metadata,
        wordCount: text.split(/\s+/).length,
      }
    }
  } catch (error) {
    console.error('Document processing error:', error)
    throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function extractKeyInformation(text: string): {
  potentialParties: string[]
  potentialCaseTypes: string[]
  potentialJurisdictions: string[]
  dates: string[]
  amounts: string[]
} {
  // Simple regex patterns for legal document analysis
  const partyPatterns = [
    /(?:plaintiff|petitioner|appellant|claimant)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /(?:defendant|respondent|appellee)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /v\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
  ]

  const caseTypePatterns = [
    /(?:contract|breach of contract|contractual)/gi,
    /(?:personal injury|negligence|tort)/gi,
    /(?:employment|discrimination|harassment)/gi,
    /(?:property|real estate|landlord|tenant)/gi,
    /(?:family|divorce|custody|support)/gi,
    /(?:criminal|fraud|theft|assault)/gi,
    /(?:intellectual property|patent|copyright|trademark)/gi,
  ]

  const jurisdictionPatterns = [
    /(?:court|district|circuit|superior|municipal)/gi,
    /(?:county|state|federal)/gi,
    /(?:united states|usa|us)/gi,
  ]

  const datePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    /\b\d{4}-\d{2}-\d{2}\b/g,
    /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi,
  ]

  const amountPatterns = [
    /\$[\d,]+(?:\.\d{2})?/g,
    /\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD)\b/gi,
  ]

  const potentialParties = Array.from(new Set(
    partyPatterns.flatMap(pattern => Array.from(text.matchAll(pattern), m => m[1].trim()))
  )).filter(party => party.length > 2)

  const potentialCaseTypes = Array.from(new Set(
    caseTypePatterns.flatMap(pattern => Array.from(text.matchAll(pattern), m => m[0].trim()))
  ))

  const potentialJurisdictions = Array.from(new Set(
    jurisdictionPatterns.flatMap(pattern => Array.from(text.matchAll(pattern), m => m[0].trim()))
  ))

  const dates = Array.from(new Set(
    datePatterns.flatMap(pattern => Array.from(text.matchAll(pattern), m => m[0].trim()))
  ))

  const amounts = Array.from(new Set(
    amountPatterns.flatMap(pattern => Array.from(text.matchAll(pattern), m => m[0].trim()))
  ))

  return {
    potentialParties,
    potentialCaseTypes,
    potentialJurisdictions,
    dates,
    amounts,
  }
}

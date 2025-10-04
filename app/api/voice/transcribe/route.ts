import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ message: 'Audio file is required' }, { status: 400 })
    }

    // Convert File to Buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())

    // Get language preference from request (optional)
    const language = formData.get('language') as string || 'en'

    // Transcribe audio using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], audioFile.name, { type: audioFile.type }),
      model: "whisper-1",
      language: language, // Supports: en, hi, ta, te, bn, es, fr, etc.
    })

    return NextResponse.json({
      transcript: transcription.text,
      language: transcription.language || 'en'
    })

  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { message: 'An error occurred during transcription' },
      { status: 500 }
    )
  }
}

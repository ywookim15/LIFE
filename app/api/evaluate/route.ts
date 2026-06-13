import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are the System — an omniscient RPG evaluator that judges a player's real-life progress. You are terse, objective, and cold. You speak in short system-message style sentences. You never encourage or flatter. You evaluate effort and improvement only.

The player has 5 core stats: INT (Intelligence — academics, research, math, quant finance), PHY (Physical Prowess — gym, athletics, conditioning), WLT (Wealth — trading, investing, income building), CHA (Charisma — communication, presence, social confidence), CRF (Craft — coding, building, writing, creating). Each has sub-stats with IDs and current values (1-100).

Your job:
1. Read the player's daily log and list of completed quests
2. Evaluate how hard they actually worked and how much they improved
3. Award XP to relevant stats. Total XP for the day: 0-500, scaled to genuine effort only
4. Optionally increase sub-stat values (0 to 5 points each, only for sub-stats directly worked on)
5. For each stat that receives XP, write a one-sentence reasoning explaining why (terse, factual)
6. Output a terse system message (2-4 sentences max, RPG notification style — cold, factual)

Respond ONLY with valid JSON in this exact structure, no other text:
{
  "totalXP": number,
  "statBreakdown": [{"stat": "INT"|"PHY"|"WLT"|"CHA"|"CRF", "xp": number, "reasoning": "string"}],
  "subStatUpdates": [{"id": "string", "increase": number}],
  "systemMessage": "string"
}

XP scale: 0-30 = negligible effort, 30-100 = below average, 100-200 = average day, 200-350 = solid effort, 350-500 = exceptional. Never inflate. An empty or vague log entry gets 0-20 XP maximum.

For statBreakdown reasoning: one cold, factual sentence. Example: "Three algorithmic problems solved — pattern recognition improving." Never exceed one sentence per stat.`

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'SYSTEM ERROR: GEMINI_API_KEY not configured.' },
      { status: 500 }
    )
  }

  let body: {
    playerStats: unknown
    questList: string
    logContent: string
    subStats: unknown
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'SYSTEM ERROR: Invalid request body.' }, { status: 400 })
  }

  const userMessage = `Player sub-stats (id, name, value, parentStat): ${JSON.stringify(body.subStats)}

Daily quests due today (title, linkedStat, completed: true/false):
${body.questList}

Daily log entry:
${body.logContent}`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    const result = await model.generateContent(userMessage)
    const raw = result.response.text()

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    const sanitized = {
      totalXP: Math.min(500, Math.max(0, Number(parsed.totalXP) || 0)),
      statBreakdown: Array.isArray(parsed.statBreakdown)
        ? parsed.statBreakdown.map((sb: { stat: string; xp: number; reasoning?: string }) => ({
            stat: sb.stat,
            xp: Math.max(0, Number(sb.xp) || 0),
            reasoning: String(sb.reasoning || ''),
          }))
        : [],
      subStatUpdates: Array.isArray(parsed.subStatUpdates) ? parsed.subStatUpdates : [],
      systemMessage: String(parsed.systemMessage || 'Evaluation complete.'),
    }

    return NextResponse.json(sanitized)
  } catch (error) {
    console.error('AI evaluation error:', error)
    return NextResponse.json(
      {
        error: `SYSTEM ERROR: Evaluation failed. ${error instanceof Error ? error.message : 'Unknown error.'}`,
      },
      { status: 500 }
    )
  }
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AreaResult {
  area_name: string
  area_id: number
  totalMilestones: number
  masteredCount: number
  percentage: number
}

const areaColors: Record<number, string> = {
  1: '#4CAF50',
  2: '#2196F3',
  3: '#FF9800',
  4: '#E91E63',
}

const areaEmojis: Record<number, string> = {
  1: '🏃',
  2: '🧠',
  3: '💬',
  4: '❤️',
}

function calculatePace(percentile: number): number {
  const P_MIN = 0.0
  const P_MAX = 2.0
  const P0 = 0.5
  const GAMMA_UP = 1.0
  const GAMMA_DOWN = 1.2
  const r = Math.max(0, Math.min(100, percentile)) / 100.0
  let pace
  if (r >= P0) {
    const s = (r - P0) / (1 - P0)
    pace = 1 + (P_MAX - 1) * Math.pow(s, GAMMA_UP)
  } else {
    const t = (P0 - r) / P0
    pace = 1 - (1 - P_MIN) * Math.pow(t, GAMMA_DOWN)
  }
  pace = Math.max(P_MIN, Math.min(P_MAX, pace))
  return Math.round(pace * 10) / 10
}

function getPaceMessage(pace: number): { message: string; emoji: string } {
  if (pace <= 0.7) return { message: 'Developing steadily — targeted activities can accelerate growth', emoji: '🌱' }
  if (pace <= 0.9) return { message: 'Progressing well — daily play maintains momentum', emoji: '📈' }
  if (pace <= 1.2) return { message: 'On track — keep up the great work!', emoji: '⭐' }
  return { message: 'Ahead of pace — excellent progress!', emoji: '🚀' }
}

function getPaceColor(pace: number): string {
  if (pace <= 0.7) return '#FF9800'
  if (pace <= 0.9) return '#2196F3'
  if (pace <= 1.2) return '#4CAF50'
  return '#7C3AED'
}

function buildEmailHtml(babyName: string, ageMonths: number, areas: AreaResult[], reportUrl: string, pace: number): string {
  const areaRows = areas.map(a => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0;">
        <div style="font-size: 16px; font-weight: 600; color: ${areaColors[a.area_id] || '#333'};">
          ${areaEmojis[a.area_id] || '📊'} ${a.area_name}
        </div>
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: center;">
        <span style="font-size: 20px; font-weight: 700; color: ${areaColors[a.area_id] || '#333'};">${a.percentage}%</span>
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #666; font-size: 14px;">
        ${a.masteredCount}/${a.totalMilestones} milestones
      </td>
    </tr>
  `).join('')

  const paceInfo = getPaceMessage(pace)
  const paceColor = getPaceColor(pace)

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #1a73e8, #4a90d9); padding: 32px 24px; text-align: center;">
            <img src="https://growwise-tracker.lovable.app/images/logo_kinedu.png" alt="Kinedu" style="height: 36px; margin-bottom: 16px;" />
            <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px 0;">${babyName}'s Development Report</h1>
            <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 0;">Age: ${ageMonths} months</p>
          </td>
        </tr>
        <!-- Results -->
        <tr>
          <td style="padding: 24px;">
            <h2 style="font-size: 18px; color: #333; margin: 0 0 16px 0;">Assessment Results</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
              <tr style="background-color: #fafafa;">
                <th style="padding: 10px 16px; text-align: left; font-size: 12px; color: #888; text-transform: uppercase;">Area</th>
                <th style="padding: 10px 16px; text-align: center; font-size: 12px; color: #888; text-transform: uppercase;">Score</th>
                <th style="padding: 10px 16px; text-align: right; font-size: 12px; color: #888; text-transform: uppercase;">Progress</th>
              </tr>
              ${areaRows}
            </table>
          </td>
        </tr>
        <!-- Overall Pace -->
        <tr>
          <td style="padding: 0 24px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f8fafc, #eef2ff); border: 1px solid #e0e7ff; border-radius: 12px; overflow: hidden;">
              <tr><td style="padding: 24px; text-align: center;">
                <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 0 0 8px;">Overall Pace of Development</p>
                <div style="font-size: 48px; font-weight: 800; color: ${paceColor}; margin: 0 0 4px; line-height: 1.1;">${pace.toFixed(1)}x</div>
                <p style="font-size: 15px; color: #555; margin: 8px 0 0;">${paceInfo.emoji} ${paceInfo.message}</p>
              </td></tr>
            </table>
          </td>
        </tr>
        <!-- CTA -->
        <tr>
          <td style="padding: 0 24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0f7ff, #e8f0fe); border-radius: 12px; padding: 24px;">
              <tr><td style="text-align: center;">
                <h3 style="color: #1a73e8; font-size: 18px; margin: 0 0 8px;">Want personalized activities?</h3>
                <p style="color: #555; font-size: 14px; margin: 0 0 16px;">Download Kinedu for 1,800+ activities tailored to ${babyName}'s development stage.</p>
                <a href="https://app.kinedu.com/ia-signuppage/?swc=ia-report" style="display: inline-block; background: #1a73e8; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Start 7-Day Free Trial</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding: 16px 24px; background-color: #fafafa; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Kinedu. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { assessment_id, baby_id } = await req.json()

    if (!assessment_id || !baby_id) {
      return new Response(JSON.stringify({ error: 'Missing assessment_id or baby_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendKey = Deno.env.get('RESEND_API_KEY')

    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch baby data
    const { data: baby, error: babyError } = await supabase
      .from('babies')
      .select('*')
      .eq('id', baby_id)
      .single()

    if (babyError || !baby?.email) {
      console.error('Baby not found or no email:', babyError)
      return new Response(JSON.stringify({ error: 'No email found for this baby' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch assessment
    const { data: assessment } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessment_id)
      .single()

    if (!assessment) {
      return new Response(JSON.stringify({ error: 'Assessment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch responses
    const { data: responses } = await supabase
      .from('assessment_responses')
      .select('milestone_id, answer, area_id, skill_id')
      .eq('assessment_id', assessment_id)

    if (!responses?.length) {
      return new Response(JSON.stringify({ error: 'No responses found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Calculate results by area
    const areaNames: Record<number, string> = {
      1: 'Physical',
      2: 'Cognitive',
      3: 'Linguistic',
      4: 'Socio-Emotional',
    }

    const areaResults = new Map<number, { total: number; mastered: number }>()

    for (const r of responses) {
      const areaId = r.area_id ?? 0
      if (!areaResults.has(areaId)) {
        areaResults.set(areaId, { total: 0, mastered: 0 })
      }
      const entry = areaResults.get(areaId)!
      entry.total++
      if (r.answer === 'yes') entry.mastered++
    }

    const areas: AreaResult[] = Array.from(areaResults.entries())
      .filter(([areaId]) => areaId > 0)
      .sort(([a], [b]) => a - b)
      .map(([areaId, data]) => ({
        area_id: areaId,
        area_name: areaNames[areaId] || `Area ${areaId}`,
        totalMilestones: data.total,
        masteredCount: data.mastered,
        percentage: Math.round((data.mastered / data.total) * 100),
      }))

    // Calculate overall pace
    const avgPercentage = areas.length > 0
      ? areas.reduce((sum, a) => sum + a.percentage, 0) / areas.length
      : 50
    const overallPace = calculatePace(avgPercentage)

    const reportUrl = `https://growwise-tracker.lovable.app/report/${baby_id}/${assessment_id}`
    const html = buildEmailHtml(baby.name || 'Your baby', assessment.reference_age_months, areas, reportUrl, overallPace)

    // Send via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kinedu Assessment <reports@kinedu.com>',
        to: [baby.email],
        subject: `${baby.name || 'Your baby'}'s Development Report is ready! 📊`,
        html,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend error:', resendData)
      return new Response(JSON.stringify({ error: 'Failed to send email', details: resendData }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, email_id: resendData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

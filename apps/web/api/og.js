import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

const verdictColors = {
  BUILD: { bg: '#16a34a', text: '#ffffff' },
  VALIDATE_FIRST: { bg: '#d97706', text: '#ffffff' },
  SKIP: { bg: '#dc2626', text: '#ffffff' },
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'Fly Labs';
    const score = searchParams.get('score');
    const verdict = searchParams.get('verdict');

    const vc = verdictColors[verdict] || verdictColors.VALIDATE_FIRST;
    const verdictLabel = verdict === 'VALIDATE_FIRST' ? 'VALIDATE' : verdict || '';

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '60px 80px',
            backgroundColor: '#0d0f14',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#22c55e',
                letterSpacing: '-0.02em',
              }}
            >
              Fly Labs
            </div>
            <div
              style={{
                fontSize: '16px',
                color: '#6b7280',
                marginLeft: '16px',
                fontWeight: 500,
              }}
            >
              Ideas Lab
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: title.length > 60 ? '42px' : '52px',
              fontWeight: 900,
              color: '#f9fafb',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: '40px',
              maxWidth: '900px',
            }}
          >
            {title.length > 100 ? title.slice(0, 97) + '...' : title}
          </div>

          {/* Score + Verdict */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {score && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '64px',
                    fontWeight: 900,
                    color: '#22c55e',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {score}
                </span>
                <span style={{ fontSize: '24px', color: '#6b7280', fontWeight: 500 }}>/100</span>
              </div>
            )}
            {verdict && (
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: vc.text,
                  backgroundColor: vc.bg,
                  padding: '8px 20px',
                  borderRadius: '8px',
                  letterSpacing: '0.05em',
                }}
              >
                {verdictLabel}
              </div>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error('OG image error:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}

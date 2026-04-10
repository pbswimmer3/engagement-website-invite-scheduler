// ─── UPDATE THESE WITH YOUR EVENT DETAILS ────────────────────────────────────
const EVENT = {
  date: 'Saturday, May 30th, 2026',
  time: '6:00 PM onwards',
  venue: 'Majestic Banquet Events',
  address: '4175 Inland Empire Boulevard, Ontario, CA, USA',
}
// ─────────────────────────────────────────────────────────────────────────────

type Member = { first_name: string; last_name: string }

export function generateEmailHTML(
  members: Member[],
  websiteUrl: string,
  websitePassword: string,
  bgImageUrl: string
) {
  const names = members.map((m) => m.first_name).join(' & ')
  const allNames = members.map((m) => `${m.first_name} ${m.last_name}`).join(', ')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're Invited!</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF8F5; font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF8F5; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER with background image -->
          <tr>
            <td style="background-image:url('${bgImageUrl}'); background-size:cover; background-position:center;">
              <div style="background:rgba(21,45,68,0.72); padding:48px 32px; text-align:center;">
                <p style="margin:0 0 8px; font-size:14px; letter-spacing:3px; text-transform:uppercase; color:#C9A96E;">
                  You're Cordially Invited to
                </p>
                <h1 style="margin:0 0 4px; font-size:36px; font-weight:300; color:#FFFFFF; font-style:italic;">
                  Aanya &amp; Prad's
                </h1>
                <h2 style="margin:0; font-size:22px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#C9A96E;">
                  Engagement Party
                </h2>
                <div style="width:60px; height:1px; background:#C9A96E; margin:20px auto 0;"></div>
              </div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#FFFFFF; padding:40px 36px; text-align:center;">

              <!-- Greeting -->
              <p style="margin:0 0 20px; font-size:18px; color:#152D44;">
                Dear ${names},
              </p>

              <p style="margin:0 0 28px; font-size:15px; line-height:1.7; color:#444;">
                We are thrilled to invite you to celebrate this joyful milestone with us!
                Your presence would mean the world, and we cannot wait to share this
                special evening with you.
              </p>

              <!-- Event Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5; border-radius:12px; margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 20px; text-align:center;">
                    <p style="margin:0 0 4px; font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#C9A96E; font-family:Arial,sans-serif;">
                      Event Details
                    </p>
                    <div style="width:40px; height:1px; background:#C9A96E; margin:8px auto 16px;"></div>
                    <p style="margin:0 0 6px; font-size:15px; color:#152D44; font-weight:bold;">
                      ${EVENT.date}
                    </p>
                    <p style="margin:0 0 6px; font-size:15px; color:#444;">
                      ${EVENT.time}
                    </p>
                    <p style="margin:0 0 2px; font-size:15px; color:#152D44; font-weight:bold;">
                      ${EVENT.venue}
                    </p>
                    <p style="margin:0 0 8px; font-size:13px; color:#888;">
                      ${EVENT.address}
                    </p>
                    <p style="margin:0; font-size:13px; color:#444; font-weight:600;">
                      Please RSVP by May 1st.
                    </p>
                  </td>
                </tr>
              </table>

              ${members.length > 1 ? `
              <!-- Group members -->
              <p style="margin:0 0 24px; font-size:13px; color:#888; font-family:Arial,sans-serif;">
                This invitation is for: <strong style="color:#152D44;">${allNames}</strong>
              </p>
              ` : ''}

              <!-- Dress Code Note -->
              <p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#666; font-style:italic;">
                Dress code &mdash; Men: Western Formal &bull; Women: Indian or Indo-Western
              </p>


              <!-- CTA Button -->
              <a href="${websiteUrl}" target="_blank"
                 style="display:inline-block; background:#1B2A4A; color:#FFFFFF; padding:14px 44px; border-radius:8px; text-decoration:none; font-size:14px; font-family:Arial,sans-serif; letter-spacing:1.5px; text-transform:uppercase; font-weight:bold;">
                RSVP Now
              </a>

              <p style="margin:20px 0 0; font-size:13px; color:#999; font-family:Arial,sans-serif;">
                Website password: <strong style="color:#1B2A4A;">${websitePassword}</strong>
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#152D44; padding:28px 36px; text-align:center;">
              <p style="margin:0 0 4px; font-size:15px; color:#C9A96E; font-style:italic;">
                With love,
              </p>
              <p style="margin:0; font-size:18px; color:#FFFFFF;">
                Aanya &amp; Prad
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function generateSubject(members: Member[]) {
  const names = members.map((m) => m.first_name).join(' & ')
  return `${names} — You're Invited to Aanya & Prad's Engagement Party!`
}

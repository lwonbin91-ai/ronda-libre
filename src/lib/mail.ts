import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.SMTP_USER) {
    console.log("[메일 미설정] 수신:", to, "제목:", subject);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Ronda Libre" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (e) {
    console.error("메일 전송 실패:", e);
  }
}

export function confirmationMailHtml(playerName: string, scheduleTitle: string, scheduledAt: Date) {
  const dateStr = scheduledAt.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#000;color:#fff;padding:32px;border-radius:16px;">
      <h1 style="color:#4ade80;font-size:24px;margin-bottom:8px;">Ronda Libre</h1>
      <p style="color:#888;margin-bottom:24px;">유소년을 위한 자유로운 경기 문화</p>
      <h2 style="font-size:18px;margin-bottom:16px;">경기 확정 알림 ✅</h2>
      <p style="color:#ccc;line-height:1.7;"><b style="color:#fff">${playerName}</b> 선수님의<br/>
      <b style="color:#4ade80">${scheduleTitle}</b> 경기 참가가 <b>확정</b>되었습니다.</p>
      <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;margin:24px 0;">
        <p style="margin:0;color:#888;font-size:14px;">경기 일정</p>
        <p style="margin:8px 0 0;font-size:16px;font-weight:bold;">${dateStr}</p>
      </div>
      <p style="color:#555;font-size:12px;">궁금한 점은 관리자에게 문의해 주세요.</p>
    </div>
  `;
}

export function cancellationMailHtml(playerName: string, scheduleTitle: string, reason: string) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#000;color:#fff;padding:32px;border-radius:16px;">
      <h1 style="color:#4ade80;font-size:24px;margin-bottom:8px;">Ronda Libre</h1>
      <p style="color:#888;margin-bottom:24px;">유소년을 위한 자유로운 경기 문화</p>
      <h2 style="font-size:18px;margin-bottom:16px;">경기 취소 알림 ❌</h2>
      <p style="color:#ccc;line-height:1.7;"><b style="color:#fff">${playerName}</b> 선수님,<br/>
      신청하신 <b style="color:#f87171">${scheduleTitle}</b> 경기가 <b>취소</b>되었습니다.</p>
      <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;margin:24px 0;">
        <p style="margin:0;color:#888;font-size:14px;">취소 사유</p>
        <p style="margin:8px 0 0;font-size:15px;">${reason || "운영상의 사유"}</p>
      </div>
      <p style="color:#555;font-size:12px;">불편을 드려 죄송합니다. 빠른 시일 내 다음 경기로 찾아뵙겠습니다.</p>
    </div>
  `;
}

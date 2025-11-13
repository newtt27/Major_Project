import nodemailer from "nodemailer";

/**
 * Gửi email chung
 */
export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Thiếu EMAIL_USER hoặc EMAIL_PASS");
    throw new Error("Thiếu EMAIL_USER hoặc EMAIL_PASS");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Support Team" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
    return info;
  } catch (err: any) {
    console.error("❌ Lỗi khi gửi email:", err);
    // log chi tiết để debug Gmail reject
    console.error("err.code:", err.code)
    console.error("err.response:", err.response)
    throw new Error(err.message || "Failed to send email");
  }
}


/**
 * Gửi email chứa link đặt lại mật khẩu
 */
export async function sendResetLinkEmail(email: string, resetLink: string) {
  const subject = "🔐 Yêu cầu đặt lại mật khẩu";
  const html = `
    <h2>Xin chào!</h2>
    <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào liên kết bên dưới để tiếp tục:</p>
    <a href="${resetLink}" target="_blank" style="color: #1a73e8;">Đặt lại mật khẩu</a>
    <p>⏰ Liên kết sẽ hết hạn sau 15 phút.</p>
    <p>Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email.</p>
  `;

  return await sendEmail(email, subject, html);
}

/**
 * Gửi email xác nhận khi mật khẩu đã thay đổi thành công
 */
export async function sendPasswordChangedEmail(email: string) {
  const subject = "✅ Mật khẩu của bạn đã được thay đổi";
  const html = `
    <p>Mật khẩu của bạn vừa được thay đổi lúc ${new Date().toLocaleString()}.</p>
    <p>Nếu bạn không thực hiện hành động này, vui lòng liên hệ với quản trị viên ngay lập tức.</p>
  `;

  return await sendEmail(email, subject, html);
}

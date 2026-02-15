import { Resend } from 'resend';

// Resend APIクライアントを初期化
const getResendClient = () => {
  // VITE_プレフィックス付きと、直接RESEND_API_KEYの両方に対応
  const apiKey = import.meta.env.VITE_RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Resend APIキーが設定されていません。.env.localにVITE_RESEND_API_KEYを設定してください。');
  }
  return new Resend(apiKey);
};

// メール送信関数
export const sendEmail = async (
  recipients: string[],
  subject: string,
  body: string
): Promise<{ successful: number; failed: number; failedEmails: string[] }> => {
  const resend = getResendClient();
  
  // 送信元メールアドレス（Resendで設定したドメインを使用）
  // 注意: Resendでドメインを設定する必要があります
  // カスタムドメインを設定している場合は、VITE_RESEND_FROM_EMAILに設定してください
  const fromEmail = import.meta.env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  // 各受信者にメールを送信
  const emailPromises = recipients.map((email: string) =>
    resend.emails.send({
      from: fromEmail,
      to: email,
      subject: subject,
      html: body.replace(/\n/g, '<br>'), // 改行を<br>に変換
    })
  );

  const results = await Promise.allSettled(emailPromises);

  // 成功と失敗をカウント
  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  // 失敗したメールアドレスを取得
  const failedEmails = recipients.filter((email: string, index: number) => 
    results[index].status === 'rejected'
  );

  return {
    successful,
    failed,
    failedEmails,
  };
};


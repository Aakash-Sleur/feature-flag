// src/templates/email/base.template.ts

export interface EmailTemplateData {
  title: string;
  preheader?: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
}

export const baseEmailTemplate = (data: EmailTemplateData): string => {
  const { title, preheader, content, buttonText, buttonUrl, footerText } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f5f5f5;
      color: #333;
    }
    .container {
      max-width: 500px;
      margin: 40px auto;
      background: #fff;
      border-radius: 8px;
      padding: 32px;
    }
    .header {
      padding-bottom: 24px;
      border-bottom: 1px solid #eee;
      margin-bottom: 24px;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
    .content {
      font-size: 15px;
      line-height: 1.6;
      color: #444;
    }
    .content p {
      margin: 0 0 16px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #333;
      color: #fff !important;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
      margin: 8px 0;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #eee;
      font-size: 13px;
      color: #888;
    }
    .link {
      color: #333;
      word-break: break-all;
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none">${preheader}</div>` : ''}
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
      ${buttonText && buttonUrl ? `<a href="${buttonUrl}" class="button">${buttonText}</a>` : ''}
    </div>
    <div class="footer">
      ${footerText || 'Assignment App'}
    </div>
  </div>
</body>
</html>
  `.trim();
};
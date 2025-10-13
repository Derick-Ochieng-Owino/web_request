import formidable from 'formidable';
import fs from 'fs';
import nodemailer from 'nodemailer';

export const config = {
  api: {
    bodyParser: false, // let formidable handle multipart/form-data
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ error: 'Failed to parse form' });
    }

    try {
      // Extract all fields
      const {
        name,
        email,
        phone,
        contact_method,
        business_name,
        industry,
        company_description,
        tiktok,
        instagram,
        linkedin,
        x,
        facebook,
        youtube,
        website_type,
        goals,
        pages,
        features,
        design_preferences,
        additional_notes,
      } = fields;

      // Build the email content for your inbox
      const messageText = `
📌 PERSONAL INFO
- Name: ${name}
- Email: ${email}
- Phone: ${phone}
- Preferred Contact: ${contact_method || 'Not specified'}

🏢 COMPANY INFO
- Business Name: ${business_name || 'N/A'}
- Industry: ${industry || 'N/A'}
- Description: ${company_description || 'N/A'}

🌐 SOCIAL LINKS
- TikTok: ${tiktok || 'N/A'}
- Instagram: ${instagram || 'N/A'}
- LinkedIn: ${linkedin || 'N/A'}
- X (Twitter): ${x || 'N/A'}
- Facebook: ${facebook || 'N/A'}
- YouTube: ${youtube || 'N/A'}

💻 PROJECT DETAILS
- Website Type: ${website_type}
- Goals: ${goals}
- Pages: ${pages || 'N/A'}
- Features: ${Array.isArray(features) ? features.join(', ') : features || 'N/A'}
- Design Preferences: ${design_preferences || 'N/A'}

📝 ADDITIONAL NOTES
${additional_notes || 'None provided'}
      `;

      // Prepare file attachments
      const attachments = [];
      for (const key in files) {
        const fileData = files[key];
        const fileArray = Array.isArray(fileData) ? fileData : [fileData];

        fileArray.forEach(file => {
          attachments.push({
            filename: file.originalFilename,
            content: fs.createReadStream(file.filepath),
          });
        });
      }

      // Configure nodemailer
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // 1️⃣ Send email to yourself / admin
      await transporter.sendMail({
        from: `"Website Request Form" <${process.env.SMTP_USER}>`,
        to: process.env.CONTACT_RECEIVER,
        replyTo: email, // lets you reply directly to the user
        subject: `New Website Request from ${name}`,
        text: messageText,
        attachments,
      });

      // 2️⃣ Send confirmation email to user
      await transporter.sendMail({
        from: `"Your Company Name" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `✅ We've received your website request`,
        text: `Hi ${name},

Thank you for submitting your website project request. We have received the following details:

${messageText}

We will review your request and get back to you within 24 hours.

Best regards,
Your Company Name`,
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Email send error:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });
}

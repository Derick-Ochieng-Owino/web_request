import nodemailer from 'nodemailer';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Required for formidable to handle file uploads
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error parsing form data' });
    }

    const { name, email, additional_notes } = fields;

    // Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Collect attachments
    const attachments = [];
    Object.keys(files).forEach((key) => {
      const fileItem = files[key];
      const fileArray = Array.isArray(fileItem) ? fileItem : [fileItem];
      fileArray.forEach((file) => {
        attachments.push({
          filename: file.originalFilename,
          content: fs.createReadStream(file.filepath),
        });
      });
    });

    try {
        try {
  await transporter.verify();
  console.log('✅ Mail server is ready');
} catch (error) {
  console.error('❌ Mail server verification failed:', error);
  return res.status(500).json({ message: 'Mail server configuration error' });
}

      // Send to YOU
      await transporter.sendMail({
        from: `"${name}" <${email}>`,
        to: process.env.MAIL_USER,
        subject: `New Website Request from ${name}`,
        text: `Additional Notes: ${additional_notes || 'None'}`,
        attachments,
      });

      // Auto-reply to USER
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: 'Thank You for Your Request',
        text: `Hello ${name},\n\nThank you for filling out the website project request form. We have received your details and will get back to you shortly.\n\nBest,\nMy Portfolio`,
      });

      res.status(200).json({ message: 'Email sent successfully' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Failed to send email' });
    }
  });
}

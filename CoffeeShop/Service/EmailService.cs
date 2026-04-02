using System;
using System.Collections.Generic;
using System.Linq;
using MailKit.Net.Smtp;
using MimeKit;
using System.Threading.Tasks;
using System.Web;

namespace CoffeeShop.Service
{
    public class EmailService
    {
        public async Task SendEmailAsync(string toEmail, string subject, string otpCode)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("828 Cafe", "noreply@828cafe.com"));
            message.To.Add(new MailboxAddress("", toEmail));
            message.Subject = subject;

            string htmlBody = $@"
            <html>
              <body style='font-family: Arial, sans-serif;'>
                <div style='max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:8px;'>
                  <h2 style='color:#4CAF50;'>CoffeeShop Security</h2>
                  <p>Hello,</p>
                  <p>Your one-time password (OTP) is:</p>
                  <h1 style='color:#333;background:#f4f4f4;padding:10px;border-radius:5px;text-align:center;'>{otpCode}</h1>
                  <p>Please use this code to complete your login. It will expire in 2 minutes.</p>
                  <hr />
                  <p style='font-size:12px;color:#777;'>If you did not request this, please ignore this email.</p>
                </div>
              </body>
            </html>";

            message.Body = new TextPart("html")
            {
                Text = htmlBody
            };

            using (var client = new SmtpClient())
            {
                await client.ConnectAsync("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);
                await client.AuthenticateAsync("johnmolina0145@gmail.com", "iexc qekx pldq xvro");
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
        }
    }

}
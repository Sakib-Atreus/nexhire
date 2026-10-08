/** Sensible defaults offered to recruiters with no templates yet. Placeholders are filled in by the server. */
export const STARTER_TEMPLATES: { name: string; body: string }[] = [
  {
    name: 'Thanks for applying',
    body: `Hi {{firstName}},

Thank you for applying for the {{jobTitle}} role at {{companyName}}. We've received your application and our team is reviewing it now.

We'll be in touch about next steps as soon as we can. In the meantime, feel free to reply here if you have any questions.

Best regards,
{{recruiterName}}`,
  },
  {
    name: 'Invitation to interview',
    body: `Hi {{firstName}},

Thanks again for your interest in the {{jobTitle}} role at {{companyName}}. We enjoyed reading your application and would like to invite you to an interview.

You'll find the interview details in your application on NexHire. If the time doesn't work for you, just reply to this message and we'll find another slot.

Looking forward to speaking with you,
{{recruiterName}}`,
  },
  {
    name: 'Not moving forward',
    body: `Hi {{firstName}},

Thank you for the time and effort you put into applying for the {{jobTitle}} role at {{companyName}}.

After careful consideration, we've decided not to move forward with your application at this time. This was not an easy decision, and we truly appreciate your interest in joining us.

We wish you the very best in your search, and we'd be glad to hear from you again for future openings.

Kind regards,
{{recruiterName}}`,
  },
];

export const TEMPLATE_LIMIT = 50;
export const TEMPLATE_NAME_MAX = 100;
export const TEMPLATE_BODY_MAX = 5000;

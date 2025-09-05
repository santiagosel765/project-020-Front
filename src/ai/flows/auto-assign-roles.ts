'use server';

/**
 * @fileOverview A Genkit flow for automatically assigning document signing roles based on document content.
 *
 * - autoAssignRoles - A function that handles the role assignment process.
 * - AutoAssignRolesInput - The input type for the autoAssignRoles function.
 * - AutoAssignRolesOutput - The return type for the autoAssignRoles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoAssignRolesInputSchema = z.object({
  documentContent: z
    .string()
    .describe('The content of the document to analyze for role assignment.'),
});
export type AutoAssignRolesInput = z.infer<typeof AutoAssignRolesInputSchema>;

const AutoAssignRolesOutputSchema = z.object({
  suggestedRoles: z
    .array(z.string())
    .describe('An array of suggested roles for signing the document.'),
});
export type AutoAssignRolesOutput = z.infer<typeof AutoAssignRolesOutputSchema>;

export async function autoAssignRoles(input: AutoAssignRolesInput): Promise<AutoAssignRolesOutput> {
  return autoAssignRolesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoAssignRolesPrompt',
  input: {schema: AutoAssignRolesInputSchema},
  output: {schema: AutoAssignRolesOutputSchema},
  prompt: `Based on the content of the following document, suggest appropriate roles for signing it. Return a JSON array of strings.

Document Content:
{{{documentContent}}}

Consider roles such as Legal, CEO, HR, and Finance. If the document contains the word 'confidential', Legal must be included. Only suggest roles that are highly relevant to the document's content.`,
});

const autoAssignRolesFlow = ai.defineFlow(
  {
    name: 'autoAssignRolesFlow',
    inputSchema: AutoAssignRolesInputSchema,
    outputSchema: AutoAssignRolesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

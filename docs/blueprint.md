# **App Name**: ZignoSign

## Core Features:

- Admin Dashboard: Admin dashboard with modules for Assignments, Documents, Users, and Supervision.
- General User Dashboard: General user dashboard with document list and profile settings, allowing changing profile picture (cropping tool included) and notification preferences.
- Smart Search: Smart search functionality in document lists, user lists, and supervision modules, filtering records as the user types.
- AI-Powered Role Assignment: AI tool integration to auto-assign roles based on document content using Google Cloud Natural Language API (if it contains the word 'confidential', it will be send to Legal dept.).
- Secure Authentication: Secure user authentication with distinct admin (admin/admin) and general (general/general) login credentials.
- Blockchain Audit Trail: Immutable audit trail by recording the SHA-3 hash of completed documents on Polygon Mumbai testnet as a verification NFT, and include a 'View on Blockchain' button linking to the transaction on Polygonscan.
- Profile Customization: Profile settings allow users to switch between light and dark mode, manage their profile picture with a cropping tool, and set notification preferences (email/WhatsApp).

## Style Guidelines:

- Primary color: HSL(210, 70%, 50%) which is a vibrant blue (#3399FF), symbolizing trust and security.
- Background color: HSL(210, 20%, 95%) which is a very light blue (#F0F8FF), providing a clean and professional backdrop.
- Accent color: HSL(180, 60%, 40%) which is a teal color (#33A6A6), for interactive elements, suggesting reliability.
- Body and headline font: 'Inter' (sans-serif) for a modern and neutral aesthetic suitable for both headlines and body text. 
- Code font: 'Source Code Pro' for displaying code snippets.
- Crisp, professional icons to represent document status (e.g., completed, pending) and user roles within the application.
- Use full screen layouts, edge-to-edge responsive design and the glassmorphism effect for UI elements.
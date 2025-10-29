CodeSync – Real-Time Collaborative Code Editor

CodeSync is a real-time collaborative code editor designed for instant coding sessions, multi-language support, and built-in live chat. No signup required — just create a room and start coding together instantly.
🚀 Features

    Real-time collaborative code editing

    Multi-language support

        JavaScript

        TypeScript

        Python

        Java

        C++

        Go

        Rust

        HTML/CSS

    Code execution using Supabase Edge Functions and Piston API

    Live chat with instant updates

    No authentication required — start coding immediately

🧩 Tech Stack

Frontend:

    React (TypeScript)

    Monaco Editor

    Tailwind CSS

    shadcn/ui components

    React Router

Backend:

    Supabase for:

        Realtime collaboration

        Edge Functions (code execution layer)

        Chat synchronization

⚙️ Core Implementation

    Code Editing: Implemented in Editor.tsx using Monaco Editor for syntax highlighting and multi-language editing.

    Output Display: OutputPanel.tsx handles compiled output and runtime logs.

    Live Chat: ChatPanel.tsx integrates Supabase channels for real-time communication.

    Code Execution: Uses Supabase Edge Functions to call the Piston API securely on the backend.

🖥️ Setup Instructions

    Clone the repository

bash
git clone https://github.com/your-username/CodeSync.git
cd CodeSync

Install dependencies

bash
npm install

Configure environment variables
Create a .env file in the root directory and add:

text
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>

Run the development server

    bash
    npm run dev

    The app will be available at http://localhost:5173.

🤝 Contributing

Contributions are welcome! Please:

    Fork the repository

    Create a new branch (feature/your-feature)

    Commit and push your changes

    Submit a pull request

🧠 Future Enhancements

    File tree and multi-tab editor

    User presence indicators (who’s online)

    Theme customization (light/dark modes)

    Integration with GitHub Gists

    Collaborative debugging panel

📜 License

This project is licensed under the MIT License. See the LICENSE file for details.

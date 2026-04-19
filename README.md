
ChronoVault

So First of all you Need Ollama with Model: llama3.2 (3B), Embed: nomic-embed-text. Otherwise see Prequisites and yeah have fun. Btw yes I commented the Code with ai so do not wonder, part of this readme to. I am german, commented everything in german and yaeh was way to lazy to translate by Hand. Oh and if someone would do the work and Change the Name of Settings and Gamification without the placeholder tag i would be gratefull, I just did not want o adjust all the paths. So The Ground Structure is done. The Gamification is only Ground Ground i am working on making it so you it Judges your structure and depending on how tidy your Data is give you rewards. I am currently thinking about clothes for waifu characters and no  I am not grose that idea Comes from my Dad. So thats most of the stuff i wanted to tell. Have fun and yeah indexing everything is a pain takes forever.


The Intelligence-First File Management System.  
Built with **Tauri 2.0**, **React 19**, and **SQLite-Vec**.

![ChronoVault Banner](https://raw.githubusercontent.com/username/chronovault/main/public/branding/banner.png) *(Placeholder Link)*

---

Overview

ChronoVault is not just another file explorer. It's a **Neural Knowledge Engine** that redefines how you interact with your local data. By combining traditional file management with advanced **Semantic Search**, **AI Summarization**, and **Gamification**, ChronoVault turns your filesystem into a living, searchable neural network.

Key Features

*   **Neural Link Engine (Knowledge Map)**: Visualize your files as a semantic graph. Discover hidden connections between documents based on AI-driven content analysis, not just folder names.
*   **Chrono-Timeline**: Abandon the rigid folder hierarchy. Explore your data as a continuous stream of events, clustered by time and relevance.
*   **Semantic Search**: Find files by *meaning*, not just filenames. Powered by `nomic-embed-text` and an ultra-fast local vector database.
*   **AI Briefings**: Get instant, localized summaries of text and code files without ever leaving the explorer.
*   **Vault Progress (Gamification)**: Gain XP for organizing, searching, and analyzing your files. Unlock levels as you become a data architect.
*   **Safe-by-Default**: 100% Local. No cloud uploads. Your data stays on your machine, always.

---

What I used

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Rust, Tauri 2.0 |
| **Database** | SQLite + `sqlite-vec` (Vector Extensions) |
| **Intelligence** | Ollama (Llama 3.2, Nomic-Embed-Text) |
| **State Management** | Zustand (with Persistence) |

---

What you need

### Prerequisites

1.  **Rust & Node.js**: Ensure you have the latest stable versions installed.
2.  **Ollama**: Install [Ollama](https://ollama.ai/) and download the required models:
    ```bash
    ollama pull llama3.2
    ollama pull nomic-embed-text
    ```

Installation

If you are a nerd or wonna test it
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/yourusername/chronovault.git
    cd chronovault
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Launch the System**:
    ```bash
    npm run tauri dev
    ```

If you are a normal Person: just use the .MSI, it is not that hard


Distributed under the **MIT License**. See `LICENSE` for more information.




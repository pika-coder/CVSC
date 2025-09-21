# CV Review App

## 📌 Description
A web application where users can paste or upload their CV and receive an AI-powered review.  
The review includes strengths, weaknesses, suggestions, and an overall score (1–10).  
Built with **Next.js** and **OpenAI** integration.

---

## 🚀 Features (MVP)
- Paste CV text into a form and get instant feedback.
- AI review powered by OpenAI (GPT-4o/GPT-5).
- Feedback includes:
  - ✅ Strengths
  - ❌ Weaknesses
  - 💡 Suggestions
  - ⭐ Score (1–10)
- Simple and responsive UI using **Bootstrap 5**.
- Ready for extension to file uploads (PDF/DOCX parsing).

---

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **UI**: Bootstrap 5
- **LLM**: OpenAI API (`openai` npm package)
- **File parsing** (future): `pdf-parse`, `mammoth`
- **Deployment**: Vercel / Docker

---

## 🧩 Getting Started

1. Clone this repository (or use this folder as your project root).
2. Create your environment file:
   - Copy `.env.local.example` to `.env.local`
   - Set `OPENAI_API_KEY=...` (required)
   - Optionally set `OPENAI_MODEL` (default: `gpt-4o-mini`) and `OPENAI_BASE_URL` (for Azure/OpenAI proxies)
3. Install dependencies:
   - `npm install`
4. Run the development server:
   - `npm run dev`
5. Open http://localhost:3000 in your browser.

### Environment Variables
- `OPENAI_API_KEY` (required): Your OpenAI API key.
- `OPENAI_MODEL` (optional): Model name, default `gpt-4o-mini`.
- `OPENAI_BASE_URL` (optional): Custom API base (e.g., Azure OpenAI or proxy).

### API
- `POST /api/review`
  - Request JSON: `{ "text": "<cv text>" }`
  - Response JSON: `{ strengths: string[], weaknesses: string[], suggestions: string[], score: number }`

---

## 🐳 Docker

Build the image:

```bash
docker build -t cv-review-app .
```

Run the container (uses port 3000):

```bash
docker run --env-file .env.local -p 3000:3000 cv-review-app
```

Then open http://localhost:3000

---

## 🧭 Roadmap (Next)
- File uploads (PDF/DOCX) using `pdf-parse` and `mammoth`.
- Persisted history of reviews.
- Export/share results.
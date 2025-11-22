# Backend helpers

This folder currently holds the resume/profile scaffolding and a quick Gemini 2.5 Flash test helper for experimenting with interview videos.

## Running the Gemini 2.5 Flash video test

1. **Install dependencies (Mac, Linux, or Windows PowerShell)**

```bash
python -m pip install -r requirements.txt
```

2. **Provide your Gemini API key**

Set the environment variable once per session **or** place the key in a text file (or `.env`) the script can read:

```bash
# macOS/Linux
export GEMINI_API_KEY="your_key_here"

# Windows PowerShell
$Env:GEMINI_API_KEY = "your_key_here"
```

Prefer to keep secrets out of your shell history? Create a `.env` file either in the repo root or inside `backend/gemini/` that contains the line `GEMINI_API_KEY=your_key_here`. The helper now scans those locations automatically on import.

If you prefer plain text files, create one inside `backend/api_keys/` whose first non-empty line contains `GEMINI_API_KEY=your_key_here`. (Quotes are optional—the script trims surrounding `"`/`'` characters.) Name it so the helper can pick it up automatically; accepted patterns are:

| Filename | Notes |
| --- | --- |
| `mac_api_key.txt` | Use this for macOS users. |
| `windows_api_key.txt` | Use this for Windows PowerShell users. |
| `<os>_api_key.txt` | e.g. `darwin_api_key.txt`, `windows_api_key.txt`. |
| `api_key.txt` | Generic fallback for any OS. |

The loader prefers `GEMINI_API_KEY` but falls back to the first non-empty line if that label is absent.

3. **Run the test script**

From the repo root, pass the video path you want Gemini to review. The helper automatically chooses inline upload for clips ≤20 MB and falls back to the Files API (and deletes the upload afterward) for larger files.

```powershell
python backend/gemini_video_body_language_test.py `
  --video "resume-profiles\profile-1\recordings\interview.mp4"
```

Optional flags:

| Flag | Purpose |
| --- | --- |
| `--prompt` | Replace the default coaching request (body language, vocal delivery, confidence). |
| `--model` | Change the Gemini model (default `gemini-2.5-flash`). |
| `--temperature` | Control creativity (default `0.2`). |
| `--max-output-tokens` | Cap response length (default `600`). |
| `--api-key-file` | Point directly to a text file containing your key. |
| `--keep-upload` | Skip deleting Files API uploads (handy if you reuse the same video). |

After the call completes, the script prints the textual feedback paragraphs returned by Gemini. Re-run the command with different `--video` or prompt settings to iterate on additional clips.

# Pressure Test Plan — Error Handling Changes

This document provides step-by-step instructions to manually verify each error handling improvement. All tests should be run in **dev mode** (`control/start-dev.sh`) unless noted otherwise.

---

## Prerequisites

- All services running: Python API (port 8000), Express API (port 3001), Frontend (port 5173)
- A style with reference images already created
- Terminal access to kill processes and edit files

---

## Test 1: Startup Without Python — "Continue without Python" Removed

**What changed:** The Electron startup dialog no longer offers "Continue without Python." It now shows "Retry" and "Quit" only.

**How to test:**

1. Stop all services (`control/stop-dev.sh`)
2. Kill any Python process on port 8000: `lsof -ti:8000 | xargs kill -9`
3. Temporarily break the Python backend so it fails to start. For example, rename a required file:
   ```bash
   mv api/main.py api/main.py.bak
   ```
4. Start the Electron app directly:
   ```bash
   cd control/electron && npm run dev
   ```
5. Wait for the startup dialog to appear

**Expected:**
- Dialog title: "Python Backend Failed"
- Two buttons: **"Retry"** and **"Quit"**
- No "Continue without Python" option
- Clicking "Quit" closes the app entirely
- Clicking "Retry" attempts to start Python again (will fail again since file is renamed)
- After max retries (2), a final error dialog appears with only a **"Quit"** button

**Cleanup:**
```bash
mv api/main.py.bak api/main.py
```

---

## Test 2: Gemini Response Validation Retry

**What changed:** When Gemini returns an incomplete response (no image data, no content, no candidates), the system now retries up to 3 times with exponential backoff instead of failing immediately.

**How to test:**

1. Start all services normally
2. Add a temporary test flag to `generate/nano_banana_client.py` in the `_extract_image_bytes` method. Insert at the top of the method (around line 426):
   ```python
   @staticmethod
   def _extract_image_bytes(response) -> bytes:
       # TEMP TEST: fail first attempt to verify retry works
       import random
       if random.random() < 0.5:
           raise RuntimeError("Image generation returned an incomplete result")
       # ... rest of method
   ```
3. Open the app and generate sketches
4. Watch the Python terminal output

**Expected:**
- Terminal shows retry messages like: `Image 1: incomplete response (attempt 1/3), retrying in 1s...`
- After retry, image should succeed and appear in the UI normally
- User sees no error — images just take slightly longer
- If all 3 attempts fail for one image, that image shows a red error card with the message "Image generation returned an incomplete result" (not a raw exception)

**Cleanup:** Remove the temporary test code from `_extract_image_bytes`.

---

## Test 3: Post-Write Image Validation

**What changed:** After saving an image file to disk, the system now verifies the file exists, has size > 0, and is a valid image via PIL. If validation fails, the per-image retry kicks in.

**How to test:**

1. Start all services normally
2. Add a temporary test to `generate/nano_banana.py` in `_process_and_save_single` (around line 318). Insert right before the `PILImage.open(out).verify()` line:
   ```python
   # TEMP TEST: corrupt the file on first write
   import random
   if random.random() < 0.3:
       with open(out, 'wb') as f2:
           f2.write(b'corrupted')
   ```
3. Generate sketches
4. Watch the Python terminal output

**Expected:**
- The PIL verify step detects the corrupted file and raises an error
- The retry logic in `nano_banana_client.py` catches this and retries the Gemini API call
- Terminal shows retry messages
- After retry, a valid image is generated and saved correctly
- User sees no error (or at worst a friendly message, not a raw exception)

**Cleanup:** Remove the temporary test code from `_process_and_save_single`.

---

## Test 4: Rate Limit / Server Busy Error

**What changed:** Rate limit errors (429) from both OpenAI and Gemini now show "The server is busy. Please wait a moment and try again." instead of raw API errors.

### 4a. Test Gemini rate limit

1. Start all services normally
2. Temporarily set an invalid Google API key in your `.env` file:
   ```
   GOOGLE_API_KEY=invalid_key_12345
   ```
3. Restart the Python server: `kill $(lsof -ti:8000) && uvicorn api.main:app --reload --port 8000`
4. Generate sketches

**Expected:**
- The full-page error state shows: title **"Unable to Generate"**
- Message contains **"The server is busy. Please wait a moment and try again."** or **"Something went wrong during generation. Please try again."**
- No raw API error, no stack trace, no "Check quota at..." URL
- "Try Again" button is available

### 4b. Test OpenAI rate limit

1. Temporarily set an invalid OpenAI key in your `.env` file:
   ```
   OPENAI_API_KEY=invalid_key_12345
   ```
2. Restart the Python server
3. Generate sketches

**Expected:**
- Full-page error: **"Unable to Generate"**
- Message: **"Something went wrong during generation. Please try again."**
- No raw `AuthenticationError` or OpenAI error details visible

**Cleanup:** Restore valid API keys in `.env` and restart the Python server.

---

## Test 5: Image Loading Retry (Frontend)

**What changed:** The frontend now retries loading images 3 times (up from 1) with 2-second delays. The error text changed from "Failed to load" to "Image unavailable."

**How to test:**

1. Start all services and generate sketches successfully — all 4 images should appear
2. Note the timestamp folder from the Python terminal output (e.g. `20250219_120530`)
3. Delete one image file from disk:
   ```bash
   rm generated_outputs/<timestamp>/sketch_0.png
   ```
4. Force a reload of the image — either refresh the page or navigate away and back

**Expected:**
- The SketchCard for the deleted image shows a loading spinner
- After ~6 seconds (3 retries x 2 seconds), it shows **"Image unavailable"** in gray text (not red, not "Failed to load")
- The other 3 images display normally
- In the Lightbox, the same image shows **"Image Unavailable"** with "The image could not be loaded"
- No raw error messages visible anywhere

---

## Test 6: Per-Image Failure with Friendly Messages

**What changed:** When individual images fail generation but others succeed, the error card shows friendly text instead of raw Python exceptions.

**How to test:**

1. Start all services normally
2. Add a temporary test to `generate/nano_banana_client.py` in `_generate_single_image_async` to force one image to fail all retries. Insert at the top of the method (around line 458):
   ```python
   # TEMP TEST: force image 0 to always fail
   if index == 0:
       raise RuntimeError("Image generation was unsuccessful")
   ```
3. Generate sketches

**Expected:**
- Images 2, 3, 4 appear normally
- Image 1 shows a red error card with:
  - Red `ErrorCircleIcon`
  - Title: **"Generation Failed"**
  - Message: **"Image generation was unsuccessful"**
- No raw Python exception, no "Gemini returned no...", no stack trace
- In the Lightbox, navigating to image 1 shows the same friendly error

**Cleanup:** Remove the temporary test code.

---

## Test 7: Full Generation Failure (Python Backend Down)

**What changed:** Full-page errors now show "Unable to Generate" instead of "Generation Failed," with friendly messages instead of raw errors.

**How to test:**

1. Start all services and verify the app works normally
2. Kill the Python backend mid-session:
   ```bash
   kill $(lsof -ti:8000)
   ```
3. Wait for the backend status indicator in the header to change to amber "Service unavailable" (may take up to 30 seconds)
4. Try to generate sketches

**Expected:**
- Full-page error state appears with:
  - Title: **"Unable to Generate"**
  - Message: **"The generation service is temporarily unavailable. You can try again or restart the service."**
  - **"Try Again"** button
  - **"Restart Service"** button (in Electron) or no restart button (in browser)
- No raw error like "ECONNREFUSED" or "fetch failed"

**Additional test:** Click "Try Again" after restarting Python — generation should succeed.

---

## Test 8: Refine Failure with Friendly Messages

**What changed:** Refine errors now show friendly messages instead of raw exceptions.

**How to test:**

1. Start all services and generate sketches successfully
2. Kill the Python backend:
   ```bash
   kill $(lsof -ti:8000)
   ```
3. Select one or more sketches and click "Refine"

**Expected:**
- Full-page error: **"Unable to Generate"**
- Message: **"Something went wrong. Please try again."** or the backend unavailable message
- No raw error messages

---

## Test 9: Content Filter Block

**What changed:** When Gemini blocks content due to safety filters, the message now reads "Image was blocked by content filters" instead of "Gemini returned no candidates...may have been blocked by safety filters."

**How to test:**

This is difficult to trigger reliably. If you can craft a prompt that Gemini's safety filter blocks:
1. Enter a prompt that might trigger content filtering
2. Generate sketches

**Expected:**
- If blocked, the per-image error card shows: **"Image was blocked by content filters"**
- The system retries up to 3 times before showing this error
- No mention of "Gemini" or "candidates" in the user-facing message

---

## Quick Verification Checklist

| # | Test | What to check | Pass? |
|---|------|--------------|-------|
| 1 | Startup without Python | Dialog shows "Retry" / "Quit" only, no "Continue without Python" | |
| 2 | Gemini response retry | Retry messages in terminal, images eventually appear | |
| 3 | Post-write validation | Corrupted file detected, retry regenerates the image | |
| 4a | Gemini rate limit | Shows "server is busy" message, no raw API error | |
| 4b | OpenAI rate limit | Shows friendly error, no raw AuthenticationError | |
| 5 | Image load retry | 3 retries over 6s, then "Image unavailable" in gray | |
| 6 | Per-image failure | Red card with "Image generation was unsuccessful" | |
| 7 | Backend down | "Unable to Generate" with friendly message + retry buttons | |
| 8 | Refine failure | Friendly error message, no raw exception | |
| 9 | Content filter | "Image was blocked by content filters" | |

---

## Notes

- **All temporary code changes must be reverted after testing.** Search for `TEMP TEST` to find them.
- Test 1 requires the **Electron** app (not browser dev mode), since the startup dialog is Electron-only.
- Tests 2, 3, and 6 require temporary code modifications to simulate failures — these cannot be triggered through normal usage.
- For tests 4a/4b, make sure to restore valid API keys after testing.
- The Python terminal (`/tmp/swag-python.log` or direct terminal) is useful for verifying retry behavior — look for lines containing "retrying in" or "attempt".

# 🎯 MERaLiON FEATURE USAGE - WHERE & HOW

## Quick Summary

**MERaLiON is used in ONE place: the `/assess` endpoint**

When a user completes the questionnaire on the frontend, the flow is:

```
User fills 12 questions → Saves to profile → Views dashboard → 
Backend calculates stress → CALLS MERaLiON → Returns coaching
```

---

## WHERE MERaLiON IS CALLED IN YOUR CODE

### 🔴 Location 1: Backend Main Application
**File:** `backend/main.py` (line 545)

```python
@app.post("/assess")
def assess(payload: UserResponse) -> Dict[str, Any]:
    # Calculate stress metrics
    data = { ... stress indicators ... }
    assessment = assess_from_model_payload(data)
    
    # ✨ MERaLiON COACHING CALLED HERE ✨
    coaching = get_meralion_coaching(
        strain_index=assessment["strain_index"],      # e.g., 90.0
        top_factors=assessment["top_factors"],        # e.g., ["Long hours"]
        burnout_risk=assessment["burnout_risk"],      # e.g., "High"
        trend="stable",                               # from user data
        language=payload.language                     # e.g., "English"
    )
    
    # Return response WITH coaching
    return {
        "strain_index": 90,
        "burnout_risk": "High",
        "coaching": coaching,  # ← MERaLiON output here
        ...other fields...
    }
```

### 🔴 Location 2: Coaching Engine
**File:** `backend/coaching_engine.py` (line 183)

```python
def get_meralion_coaching(strain_index, top_factors, burnout_risk, trend, language):
    """
    Main orchestrator function.
    Decides: Use API or fall back to rule-based?
    """
    
    # Check if MERaLiON API credentials are configured
    api_key = os.getenv("MERALION_API_KEY", "").strip()
    api_url = os.getenv("MERALION_API_URL", "").strip()
    
    if not api_key or not api_url:
        # NO API KEY → Use rule-based fallback (CURRENT STATE)
        return get_rule_based_coaching(...)
    
    try:
        # API KEY EXISTS → Call MERaLiON API
        
        # Step 1: Build privacy-safe prompt
        prompt = build_coaching_prompt(
            strain_index, top_factors, burnout_risk, trend, language
        )
        
        # Step 2: Prepare API request
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "meralion",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 150,
            "temperature": 0.7
        }
        
        # Step 3: Call MERaLiON API 🚀
        response = requests.post(
            api_url,
            json=payload,
            headers=headers,
            timeout=10  # 10 second timeout
        )
        response.raise_for_status()
        
        # Step 4: Parse response
        result = response.json()
        coaching_text = result["choices"][0]["message"]["content"]
        
        # Step 5: Return MERaLiON response
        return {
            "source": "MERaLiON",
            "language": language,
            "coaching": coaching_text
        }
    
    except Exception as e:
        # If API fails → Fall back to rule-based
        return get_rule_based_coaching(...)
```

---

## USER JOURNEY: WHERE MERaLiON FITS IN

### 🟦 Step 1: User Completes Questionnaire (Frontend)

**File:** `frontend/src/pages/Onboarding.tsx` (line 178-210)

```tsx
const goNext = async () => {
  // User clicked "Submit" on last question
  
  if (isLast) {
    // Save questionnaire
    const response = await saveQuestionnaire(token, {
      age: updatedAnswers.age,
      industry: updatedAnswers.industry,
      work_hours: updatedAnswers.work_hours,
      pressure: updatedAnswers.pressure,
      ...12 other fields...
    });
    
    // Redirect to dashboard
    navigate("/dashboard");  // ← Will load assessment with MERaLiON
  }
};
```

### 🟦 Step 2: Dashboard Loads (Frontend)

**File:** `frontend/src/pages/Dashboard.tsx` (line 47-75)

```tsx
useEffect(() => {
  if (!user || !token) return;
  
  if (!profile?.onboarding_completed) {
    navigate("/onboarding");
    return;
  }
  
  // Load dashboard data
  const loadDashboard = async () => {
    const response = await getDashboard(token);
    setDashboardData(response);  // ← Contains MERaLiON coaching
  };
  
  loadDashboard();
}, [loading, navigate, profile, token, user]);
```

### 🟦 Step 3: Backend Calculates Assessment (Backend)

**File:** `backend/main.py` (line 674-703)

```python
@app.get("/dashboard")
def dashboard(authorization: str = Header(None)) -> Dict[str, Any]:
    user = authenticate_token(...)
    
    if user["profile"].get("onboarding_completed"):
        # Convert profile to model input
        data = build_model_input_payload(user["profile"])
        
        # Calculate stress metrics
        assessment = assess_from_model_payload(data)
        # Returns:
        # {
        #   "strain_index": 90,
        #   "top_factors": ["Long hours", "Low support"],
        #   "burnout_risk": "High",
        #   ...
        # }
        
        latest_assessment = assessment
```

### 🟦 Step 4: MERaLiON COACHING INJECTED

**File:** `backend/main.py` (line 545) - INSIDE `/assess` endpoint

```python
# calculate stress
assessment = assess_from_model_payload(data)

# ✨ MERaLiON CALLED HERE ✨
coaching = get_meralion_coaching(
    strain_index=assessment["strain_index"],
    top_factors=assessment["top_factors"],
    burnout_risk=assessment["burnout_risk"],
    trend="stable",
    language="English"  # or user's language
)

# Response includes coaching
{
  "strain_index": 90,
  "burnout_risk": "High",
  "coaching": {              # ← NEW FIELD with MERaLiON
    "source": "Rule-based (MERaLiON pending)",
    "language": "English",
    "coaching": "You're under significant stress..."
  }
}
```

### 🟦 Step 5: Response Sent to Frontend

**File:** `frontend/src/services/api.ts` - `getDashboard()` function

```ts
export async function getDashboard(token: string): Promise<DashboardResponse> {
  return request<DashboardResponse>("/dashboard", {}, token);
}

// Response includes:
// {
//   user: {...},
//   profile: {...},
//   latest_assessment: {
//     strain_index: 90,
//     coaching: {...}  ← MERaLiON coaching here
//   }
// }
```

### 🟦 Step 6: Frontend Can Display Coaching (Future)

**File:** `frontend/src/pages/Dashboard.tsx` (Currently NOT displayed)

```tsx
// Dashboard receives the coaching but currently doesn't show it
// To display it, add:

{dashboardData?.latest_assessment?.coaching && (
  <div className="coaching-card">
    <h3>Personalized Guidance</h3>
    <p className="source">{dashboardData.latest_assessment.coaching.source}</p>
    <p className="message">{dashboardData.latest_assessment.coaching.coaching}</p>
  </div>
)}
```

---

## CURRENT STATE: RULE-BASED FALLBACK

Since `MERALION_API_KEY` is empty in `.env`, the system uses the fallback:

**File:** `backend/coaching_engine.py` (line 98-176)

```python
def get_rule_based_coaching(strain_index, top_factors, burnout_risk, trend, language):
    """
    Rule-based fallback templates.
    Used when API key is not configured.
    """
    
    coaching_templates = {
        "English": {
            "High": {
                "stable": "Your stress levels are elevated and stable. Consider a change to your routine this week..."
            },
            "Moderate": { ... },
            "Low": { ... }
        },
        "Chinese": { ... },
        "Malay": { ... },
        "Tamil": { ... }
    }
    
    # Select template by: language + stress_level + trend
    base_msg = coaching_templates[language][burnout_risk][trend]
    
    # Add factor-specific tip
    tip = _get_factor_tip(top_factors[0], language)
    
    # Combine
    coaching_text = f"{base_msg}\n\n💡 {tip}"
    
    # Return fallback response
    return {
        "source": "Rule-based (MERaLiON pending)",
        "language": language,
        "coaching": coaching_text
    }
```

---

## WHEN API IS ENABLED: MERaLiON API CALL

**Currently disabled** because `.env` has no API key.

When credentials are added (`backend/.env`):

```env
MERALION_API_KEY=sk-xxxxxxxxxxxx
MERALION_API_URL=https://api.meralion.sg/v1/chat/completions
```

**Automatic switch to API mode happens at runtime:**

```python
# Code in get_meralion_coaching()

api_key = os.getenv("MERALION_API_KEY")  # ← Reads .env

if not api_key:
    # Use rule-based (CURRENT)
    return get_rule_based_coaching(...)
else:
    # Use MERaLiON API (WHEN ENABLED)
    response = requests.post(api_url, json=payload, headers=headers)
    return { "source": "MERaLiON", ... }
```

---

## DATA FLOW DIAGRAM

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  /onboarding → User fills 12 questions                          │
│               → Saves to profile                                │
│               → Navigate to /dashboard                           │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                    POST /API
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                   BACKEND (FastAPI)                              │
│                                                                  │
│  /dashboard endpoint loads user profile                          │
│         ↓                                                        │
│  assess_from_model_payload()                                    │
│    • Calculates strain_index (90)                               │
│    • Gets ML prediction ("High")                                │
│    • Identifies top_factors (["Long hours", "Low support"])     │
│         ↓                                                        │
│  ✨ get_meralion_coaching() ✨  ← MERALION USAGE HERE            │
│    │                                                            │
│    ├─ Check API key in .env                                    │
│    │  │                                                        │
│    │  ├─ IF empty → Use rule_based_coaching()                 │
│    │  │             (CURRENT STATE)                           │
│    │  │                                                        │
│    │  └─ IF configured → requests.post(api_url)               │
│    │                     (FUTURE STATE)                        │
│    │                                                            │
│    └─ Return coaching object                                  │
│         ↓                                                        │
│  Response includes:                                             │
│  {                                                              │
│    "strain_index": 90,                                          │
│    "burnout_risk": "High",                                      │
│    "coaching": {                                                │
│      "source": "Rule-based (MERaLiON pending)",               │
│      "language": "English",                                     │
│      "coaching": "Your stress levels are elevated..."          │
│    }                                                            │
│  }                                                              │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                    JSON Response
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                   FRONTEND (React)                              │
│  Dashboard shows:                                               │
│  - Strain index                                                │
│  - Burnout risk                                                │
│  - Top factors                                                 │
│  - DND mode status                                             │
│  - [CURRENTLY NOT DISPLAYED: coaching message]                │
└──────────────────────────────────────────────────────────────────┘
```

---

## KEY POINTS

### 1. **MERaLiON is ONLY called in the `/assess` endpoint**
   - When dashboard loads, it triggers assessment calculation
   - That assessment calls `get_meralion_coaching()`

### 2. **MERaLiON Decision Point**
   ```
   if api_key exists in .env:
       → Call MERaLiON API (when approved)
   else:
       → Use rule-based templates (CURRENT)
   ```

### 3. **Data Sent to MERaLiON** (Privacy-safe)
   - `strain_index` (0-100)
   - `top_factors` (list of stress factors)
   - `burnout_risk` ("High", "Moderate", "Low")
   - `trend` ("increasing", "stable", "decreasing")
   - `language` (user preference)
   - **NO personal data** (no name, email, etc.)

### 4. **Response Includes Coaching**
   - `source`: "MERaLiON" (when API) or "Rule-based..." (now)
   - `language`: User's language
   - `coaching`: Actual message text

### 5. **Automatic Fallback**
   - If API unavailable → Use rule-based immediately
   - User never knows API failed
   - Always gets coaching (either AI or rule-based)

---

## TO ACTIVATE MERaLiON API

1. **Wait for API credentials** from MERaLiON provider
2. **Update** `backend/.env`:
   ```env
   MERALION_API_KEY=sk-your-key
   MERALION_API_URL=https://api.meralion.sg/v1/chat/completions
   ```
3. **Restart** backend:
   ```bash
   bash /Users/meghana/destress-app/start.sh
   ```
4. **Done!** System automatically uses API instead of rules

No code changes needed. Just update the `.env` file.


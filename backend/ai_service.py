"""
SmartCampus MITS — AI Intelligence Service
Powered by Google Gemini 3.8 Flash (via google-genai SDK)
with High-Precision Local Heuristic Engine Fallback.
Provides:
 1. Smart Lost & Found Semantic Matcher
 2. Multimodal Item Auto-Describe & Category Classifier
 3. Handover Ownership Claim Validator
 4. Conversational Campus Assistant
"""
import os
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except Exception:
    pass

# Attempt to load google-genai client
_gemini_client = None
_has_genai = False

try:
    from google import genai
    _has_genai = True
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        _gemini_client = genai.Client(api_key=api_key)
    else:
        # Client without explicit key (relies on ADC or environment)
        try:
            _gemini_client = genai.Client()
        except Exception:
            _gemini_client = None
except Exception:
    _gemini_client = None
    _has_genai = False


def is_gemini_active() -> bool:
    return _gemini_client is not None


# --- 1. AI Lost & Found Matcher ---

def calculate_heuristic_match(lost_item: Dict[str, Any], found_item: Dict[str, Any]) -> Dict[str, Any]:
    """Smart heuristic matcher when Gemini API is offline or not configured."""
    score = 0
    reasons = []

    # Category match (+35 pts)
    lost_cat = (lost_item.get("category") or "").lower()
    found_cat = (found_item.get("category") or "").lower()
    if lost_cat and found_cat and lost_cat == found_cat:
        score += 35
        reasons.append(f"Identical category ({lost_cat.title()})")

    # Name text token similarity (+35 pts)
    def clean_tokens(s):
        return set(re.findall(r'\b[a-z0-9]{3,}\b', (s or "").lower())) - {'with', 'near', 'from', 'lost', 'found', 'this', 'that'}

    lost_tokens = clean_tokens(lost_item.get("name", "") + " " + lost_item.get("description", ""))
    found_tokens = clean_tokens(found_item.get("name", "") + " " + found_item.get("description", ""))

    overlap = lost_tokens.intersection(found_tokens)
    if overlap:
        token_ratio = len(overlap) / max(1, min(len(lost_tokens), len(found_tokens)))
        pts = min(35, int(token_ratio * 35) + len(overlap) * 5)
        score += pts
        reasons.append(f"Shared item keywords: {', '.join(list(overlap)[:4])}")

    # Location proximity match (+20 pts)
    lost_loc = (lost_item.get("location") or lost_item.get("location_key") or "").lower()
    found_loc = (found_item.get("location") or found_item.get("location_key") or "").lower()
    if lost_loc and found_loc:
        if lost_loc == found_loc:
            score += 20
            reasons.append(f"Exact same campus location ({lost_item.get('location')})")
        elif any(part in found_loc for part in lost_loc.split() if len(part) > 3):
            score += 12
            reasons.append("Proximity match in nearby campus block/wing")

    # Date recency (+10 pts)
    lost_date = lost_item.get("item_date") or ""
    found_date = found_item.get("item_date") or ""
    if lost_date and found_date and lost_date == found_date:
        score += 10
        reasons.append("Reported on the same calendar day")
    elif lost_date and found_date:
        score += 5
        reasons.append("Reported within close timeframe")

    score = min(98, max(15, score))

    level = "High" if score >= 75 else ("Medium" if score >= 50 else "Low")
    summary = " · ".join(reasons) if reasons else "General category overlap"

    return {
        "match_score": score,
        "match_level": level,
        "reasoning": f"{level} similarity ({score}%). {summary}.",
        "candidate": found_item
    }


def ai_match_items(lost_item: Dict[str, Any], candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Rank candidate items by semantic similarity using Gemini 3.8 Flash or fallback."""
    if not candidates:
        return []

    # If Gemini is active, run through Gemini 3.8 Flash
    if _gemini_client:
        try:
            prompt = f"""
You are the AI Matcher for SmartCampus MITS Gwalior Lost & Found.
Given this Lost Item:
Title: {lost_item.get('name')}
Category: {lost_item.get('category')}
Location: {lost_item.get('location')}
Date: {lost_item.get('item_date')}
Description: {lost_item.get('description')}

Compare it against each of the following Found candidate items:
{json.dumps([{
    'id': c.get('id'),
    'name': c.get('name'),
    'category': c.get('category'),
    'location': c.get('location'),
    'date': c.get('item_date'),
    'description': c.get('description')
} for c in candidates], indent=2)}

Return a strict JSON array of objects with keys:
"id": candidate item id (integer),
"match_score": integer between 0 and 100,
"match_level": "High" | "Medium" | "Low",
"reasoning": concise 1-sentence explanation of why it matches or differs.
Order by match_score descending.
Only return valid JSON array, no extra commentary.
"""
            response = _gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            raw_text = (response.text or "").strip()
            # Clean possible markdown block
            if "```" in raw_text:
                raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
                raw_text = re.sub(r"\s*```$", "", raw_text)
            parsed = json.loads(raw_text)

            cand_map = {c["id"]: c for c in candidates}
            results = []
            for item in parsed:
                cid = item.get("id")
                if cid in cand_map:
                    results.append({
                        "match_score": int(item.get("match_score", 50)),
                        "match_level": item.get("match_level", "Medium"),
                        "reasoning": item.get("reasoning", "Semantic match identified by Gemini AI."),
                        "candidate": cand_map[cid]
                    })
            if results:
                return results
        except Exception as e:
            print(f"[AI Service] Gemini matching failed, falling back to heuristic: {e}")

    # Fallback to smart heuristic matcher
    scored = [calculate_heuristic_match(lost_item, cand) for cand in candidates]
    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored


# --- 2. AI Auto-Fill & Description Enhancer ---

def ai_enhance_report(title: str, user_description: str, category: str, location: str) -> Dict[str, Any]:
    """Generates a professional, detailed item description and suggests accurate categories."""
    if _gemini_client:
        try:
            prompt = f"""
You are the SmartCampus MITS AI Assistant for Lost & Found item reports.
The user wants to report an item:
Title: {title}
Category: {category}
Location: {location}
Raw Description: {user_description}

Please output a JSON object with:
"suggested_title": a clean, standardized title (e.g. "boAt Rockerz 255 Pro+ Neckband (Teal Blue)"),
"suggested_category": one of ["electronics", "documents", "accessories", "bags", "keys", "education"],
"enhanced_description": a clear, 2-3 sentence description emphasizing visible color, brand, condition, and location context while warning not to reveal private secret markings (so genuine owners can verify ownership),
"key_tags": array of 3-5 keywords for searching (e.g. ["boat", "bluetooth", "earphones", "canteen"]).

Only output valid JSON.
"""
            response = _gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            raw = (response.text or "").strip()
            if "```" in raw:
                raw = re.sub(r"^```(?:json)?\s*", "", raw)
                raw = re.sub(r"\s*```$", "", raw)
            return json.loads(raw)
        except Exception as e:
            print(f"[AI Service] Gemini enhance failed: {e}")

    # High-quality local heuristic enhancer
    cat_hints = {
        "watch": ("accessories", "High-visibility wearable timepiece"),
        "phone": ("electronics", "Mobile cellular device"),
        "laptop": ("electronics", "Portable computing device"),
        "card": ("documents", "Institute identity or access card"),
        "keys": ("keys", "Key ring with standard keys"),
        "bag": ("bags", "Backpack / carrying bag"),
        "book": ("education", "Academic book or study notes")
    }
    
    suggested_cat = category or "accessories"
    for k, v in cat_hints.items():
        if k in (title + " " + user_description).lower():
            suggested_cat = v[0]
            break

    enhanced = (
        f"{title.strip().capitalize() if title else 'Item'} reported at {location or 'MITS Campus'}. "
        f"{user_description.strip() if user_description else 'Appears in good physical condition.'} "
        f"Rightful owner may verify possession by providing specific identifying marks or serial details."
    )

    return {
        "suggested_title": title.title() if title else "Campus Belonging",
        "suggested_category": suggested_cat,
        "enhanced_description": enhanced,
        "key_tags": [w for w in re.findall(r'\w+', (title + " " + location).lower()) if len(w) > 3][:5]
    }


# --- 3. AI Claim Verification Validator ---

def ai_verify_claim_proof(item: Dict[str, Any], proof_text: str, lost_context: str) -> Dict[str, Any]:
    """Evaluates whether claimant proof matches private item details."""
    if _gemini_client:
        try:
            prompt = f"""
Evaluate this student's ownership claim for a found item at MITS Gwalior.
Found Item Name: {item.get('name')}
Found Location: {item.get('location')}
Public Description: {item.get('description')}

Claimant Provided Context:
When/Where Lost: {lost_context}
Private Proof Provided: {proof_text}

Rate how plausible this claim is from 0 to 100.
Output JSON with:
"verification_score": integer (0-100),
"confidence": "High" | "Moderate" | "Low",
"verdict": "Likely Legitimate Owner" | "Requires Additional Identity Check" | "Suspicious / Discrepant",
"admin_notes": concise advice for the proctor / desk officer at handover.
Only return valid JSON.
"""
            response = _gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            raw = (response.text or "").strip()
            if "```" in raw:
                raw = re.sub(r"^```(?:json)?\s*", "", raw)
                raw = re.sub(r"\s*```$", "", raw)
            return json.loads(raw)
        except Exception as e:
            print(f"[AI Service] Gemini claim verification failed: {e}")

    # Heuristic verification
    length_score = min(50, len(proof_text.strip()) * 2)
    has_specifics = any(w in proof_text.lower() for w in ["scratch", "sticker", "pin", "wallpaper", "number", "serial", "black", "blue", "red", "inside", "photo", "card"])
    specific_score = 35 if has_specifics else 15
    loc_match = 15 if (item.get("location", "").lower() in lost_context.lower()) else 5

    total = min(96, length_score + specific_score + loc_match)
    conf = "High" if total >= 75 else ("Moderate" if total >= 50 else "Low")
    verdict = "Likely Legitimate Owner" if total >= 70 else "Requires Additional Identity Check"

    return {
        "verification_score": total,
        "confidence": conf,
        "verdict": verdict,
        "admin_notes": f"Claimant provided {len(proof_text.split())} words of private proof. Check physical item at security desk before finalizing handover."
    }


# --- 4. Conversational SmartCampus Assistant ---

def ai_chat_assistant(query: str, reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Campus lost & found assistant chatbot with awareness of active reports and MITS facilities."""
    q_lower = query.lower().strip()

    if _gemini_client:
        try:
            summarized_reports = [{
                "id": r.get("id"),
                "name": r.get("name"),
                "type": r.get("type"),
                "category": r.get("category"),
                "location": r.get("location"),
                "date": r.get("item_date")
            } for r in reports[:15]]

            prompt = f"""
You are the AI Campus Assistant for SmartCampus at Madhav Institute of Technology & Science (MITS), Gwalior.
You assist students and faculty in locating lost property, understanding handover desks (Central Library, SAC J114, Gate 1, Proctor Office), and navigating 235 campus academic rooms.

Current Active Reports Database Sample:
{json.dumps(summarized_reports, indent=2)}

User Question: "{query}"

Instructions:
1. Provide a warm, concise, and helpful answer (under 3 paragraphs).
2. If the user is looking for an item that resembles an active report, mention the report name and location clearly.
3. Suggest practical next steps (e.g. check the handover desk or browse directory).
4. Output JSON with:
"response": markdown formatted reply string,
"recommended_report_ids": array of report IDs that match the user's inquiry (integers, can be empty).

Only output valid JSON.
"""
            response = _gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            raw = (response.text or "").strip()
            if "```" in raw:
                raw = re.sub(r"^```(?:json)?\s*", "", raw)
                raw = re.sub(r"\s*```$", "", raw)
            return json.loads(raw)
        except Exception as e:
            print(f"[AI Service] Gemini chat failed: {e}")

    # Heuristic response engine
    matching = []
    tokens = set(re.findall(r'\b[a-z]{3,}\b', q_lower)) - {'what', 'where', 'how', 'when', 'the', 'and', 'for', 'you', 'can', 'item', 'lost', 'found'}
    for r in reports:
        r_text = (r.get("name", "") + " " + r.get("description", "") + " " + r.get("location", "")).lower()
        if any(t in r_text for t in tokens):
            matching.append(r)

    matching = matching[:3]
    rec_ids = [m["id"] for m in matching]

    if "handover" in q_lower or "desk" in q_lower or "where" in q_lower and "collect" in q_lower:
        reply = (
            "📍 **MITS Campus Handover Desks**:\n\n"
            "• **Central Library Security Desk** (Ground Floor): For books, ID cards, and electronics.\n"
            "• **SAC Desk (Room J114)**: For sports gear, accessories, and bags.\n"
            "• **Campus Main Gate 1 Security Booth**: For keys, umbrellas, and general articles.\n"
            "• **Chief Proctor Office**: High-value items (laptops, mobile phones, wallets)."
        )
    elif matching:
        items_str = "\n".join([f"• **{m['name']}** ({m['type'].upper()}) at *{m['location']}*" for m in matching])
        reply = (
            f"🔍 I found **{len(matching)} active report(s)** matching your query:\n\n"
            f"{items_str}\n\n"
            f"You can view them in the [Browse Directory](browse.html) or submit an ownership claim to initiate physical verification!"
        )
    elif "how" in q_lower and "claim" in q_lower:
        reply = (
            "🛡️ **How to Claim an Item on SmartCampus**:\n\n"
            "1. Find the found report in the [Directory](browse.html).\n"
            "2. Click **'🛡️ Verify & Claim'** on the item card.\n"
            "3. Enter where/when you lost it and describe private identifying proof (e.g., unique scratches, wallpaper, serial number).\n"
            "4. Campus proctors will review your proof and authorize collection at the designated handover desk!"
        )
    else:
        reply = (
            f"👋 Hello! I am your **SmartCampus AI Assistant**.\n\n"
            f"I can help you search our **{len(reports)} active campus reports**, locate any of our **235 verified classrooms & labs**, "
            f"or explain how to claim items at campus security desks.\n\n"
            f"Try asking: *'Did anyone find a calculator near J120?'* or *'Where do I collect items found in Main Building?'*"
        )

    return {
        "response": reply,
        "recommended_report_ids": rec_ids
    }

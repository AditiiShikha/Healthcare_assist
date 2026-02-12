import re

# Medical jargon replacements
MEDICAL_TERMS = {
    r"\bhypertension\b": "high blood pressure",
    r"\bdiabetes\b": "high blood sugar",
    r"\btablet\b": "pill",
    r"\bcapsule\b": "medicine capsule",
    r"\badminister\b": "take",

    # Abbreviations
    r"\bBID\b": "twice a day",
    r"\bOD\b": "once a day",
    r"\bTID\b": "three times a day"
}

# Friendly explanation templates
DOSAGE_EXPLANATIONS = {
    "once a day": "Take it one time every day, usually in the morning.",
    "twice a day": "Take it two times a day — once in the morning and once at night.",
    "three times a day": "Take it three times a day — morning, afternoon, and night."
}


def simplify_text(text: str) -> str:
    simplified = text

    # Step 1: Replace medical jargon
    for pattern, meaning in MEDICAL_TERMS.items():
        simplified = re.sub(pattern, meaning, simplified, flags=re.IGNORECASE)

    simplified = simplified.strip()

    # Step 2: Add dosage explanation if present
    extra_line = ""
    for dose, explanation in DOSAGE_EXPLANATIONS.items():
        if dose in simplified.lower():
            extra_line = explanation
            break

    # Step 3: Build elderly-friendly response
    response = f"Simple Explanation: {simplified}.\n"

    if extra_line:
        response += f"{extra_line}\n"

    response += (
        "Please take your medicine regularly and do not stop without asking your doctor. "
        "If you feel unwell, contact a healthcare professional."
    )

    return response

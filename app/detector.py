def detect_manipulation(text: str):

    keywords = ["miracle", "secret cure", "doctors hide", "instant"]

    if any(word in text.lower() for word in keywords):
        return {
            "label": "Manipulative",
            "explanation": "This message looks exaggerated or misleading."
        }

    return {
        "label": "Safe",
        "explanation": "This looks normal, but confirm with a doctor."
    }

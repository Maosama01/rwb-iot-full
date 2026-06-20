"""
app/core/firebase.py
──────────────────────
Initializes the Firebase Admin SDK singleton used for both Push Notifications (FCM)
and verifying Firebase Auth ID tokens (Social Login).
"""

import logging
import os

logger = logging.getLogger(__name__)

_firebase_app = None

def get_firebase_app():
    """
    Return (and lazily initialise) the firebase-admin App instance.

    Credential resolution order:
      1. FIREBASE_CREDENTIALS_JSON env var
      2. FIREBASE_CREDENTIALS_PATH env var
      3. Application Default Credentials

    Returns None if no credentials are available.
    """
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    try:
        import firebase_admin
        from firebase_admin import credentials

        if firebase_admin._apps:
            _firebase_app = firebase_admin.get_app()
            return _firebase_app

        cred = None
        raw_json = os.environ.get("FIREBASE_CREDENTIALS_JSON")
        if raw_json:
            import json
            cred = credentials.Certificate(json.loads(raw_json))
            logger.info("Firebase: using credentials from FIREBASE_CREDENTIALS_JSON")

        if cred is None:
            cred_path = os.environ.get("FIREBASE_CREDENTIALS_PATH")
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                logger.info("Firebase: using credentials from file", extra={"path": cred_path})

        if cred is None:
            cred = credentials.ApplicationDefault()
            logger.info("Firebase: using Application Default Credentials")

        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialised")
        return _firebase_app

    except ImportError:
        logger.warning("firebase-admin not installed. Run: pip install firebase-admin")
        return None
    except Exception:
        logger.error("Firebase Admin SDK initialisation failed", exc_info=True)
        return None

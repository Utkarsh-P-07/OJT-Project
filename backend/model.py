import os
import joblib
from sklearn.linear_model import LogisticRegression
from vectorizer import _vectorizer, fit_transform

MODEL_PATH = os.path.join(os.path.dirname(__file__), "topic_model.joblib")
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), "vectorizer.joblib")

_model = None

def train_model(texts: list[str], labels: list[str]):
    """
    Train the Logistic Regression topic classifier and save it.
    """
    global _model
    
    # Use the existing vectorizer setup
    X = fit_transform(texts)
    
    # Train model
    _model = LogisticRegression(max_iter=1000, class_weight='balanced')
    _model.fit(X, labels)
    
    # Save artifacts
    joblib.dump(_model, MODEL_PATH)
    joblib.dump(_vectorizer, VECTORIZER_PATH)
    return True

def load_model():
    """
    Load the model and vectorizer from disk.
    """
    global _model
    from vectorizer import _vectorizer
    if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
        _model = joblib.load(MODEL_PATH)
        loaded_vec = joblib.load(VECTORIZER_PATH)
        _vectorizer.vocabulary_ = loaded_vec.vocabulary_
        _vectorizer.idf_ = loaded_vec.idf_
        return True
    return False

def predict_topic(text: str) -> str:
    """
    Predict the topic for a preprocessed piece of text.
    """
    if _model is None:
        success = load_model()
        if not success:
            return "Unknown" # Model not trained yet
            
    # Transform text using the loaded vectorizer
    X = _vectorizer.transform([text])
    pred = _model.predict(X)
    return pred[0]

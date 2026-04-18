import string
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# Make sure to download required NLTK resources
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
    nltk.download('punkt_tab', quiet=True)
except Exception:
    pass

lemmatizer = WordNetLemmatizer()
try:
    stop_words = set(stopwords.words('english'))
except Exception:
    stop_words = set()

def clean_text(text: str) -> str:
    """
    Cleans the input text by:
    1. Lowercasing
    2. Removing special characters
    3. Tokenizing
    4. Removing stopwords
    5. Lemmatizing
    """
    # Lowercase
    text = text.lower()
    
    # Remove special characters / punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    
    # Tokenize
    try:
        tokens = word_tokenize(text)
    except LookupError:
        nltk.download('punkt', quiet=True)
        tokens = word_tokenize(text)
    
    # Remove stopwords and lemmatize
    cleaned_tokens = [
        lemmatizer.lemmatize(word) 
        for word in tokens 
        if word not in stop_words and word.strip()
    ]
    
    return " ".join(cleaned_tokens)

def parse_file_content(contents: bytes) -> list[str]:
    """
    Decodes file bytes and returns a list of non-empty strings (lines).
    Each line represents one news article.
    """
    decoded = contents.decode('utf-8', errors='ignore')
    lines = decoded.splitlines()
    # Remove empty lines and clean whitespace
    return [line.strip() for line in lines if line.strip()]

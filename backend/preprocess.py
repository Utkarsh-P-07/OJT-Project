import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

# Ensure resources are downloaded
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet', quiet=True)

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)

stop_words = set(stopwords.words('english'))
EXTRA_STOPWORDS = {"said", "says", "also", "would", "could", "one", "two", "new", "year"}
stop_words.update(EXTRA_STOPWORDS)

lemmatizer = WordNetLemmatizer()

def clean_text(text: str) -> str:
    """
    Tokenization, stopword removal, and lemmatization.
    """
    if not text or not isinstance(text, str):
        return ""

    text = text.lower()
    text = re.sub(r"http\S+|www\S+", "", text)           # remove URLs
    text = re.sub(r"\d+", "", text)                       # remove numbers
    text = text.translate(str.maketrans("", "", string.punctuation))
    
    # Tokenize
    words = word_tokenize(text)
    
    # Remove stopwords and lemmatize
    words = [lemmatizer.lemmatize(w) for w in words if w not in stop_words and len(w) > 2]
    
    return " ".join(words)

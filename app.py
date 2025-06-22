from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import PyPDF2
from docx import Document
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Load NLP model
nlp = spacy.load('en_core_web_sm')

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(filepath):
    if filepath.endswith('.pdf'):
        with open(filepath, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            text = " ".join([page.extract_text() for page in reader.pages])
        return text
    elif filepath.endswith('.docx'):
        doc = Document(filepath)
        return "\n".join([para.text for para in doc.paragraphs])
    elif filepath.endswith('.doc'):
        # Requires antiword to be installed
        return os.popen(f'antiword "{filepath}"').read()
    else:  # txt
        with open(filepath, 'r') as f:
            return f.read()

def preprocess_text(text):
    doc = nlp(text.lower())
    tokens = [token.lemma_ for token in doc if not token.is_stop and not token.is_punct and token.is_alpha]
    return " ".join(tokens)

def calculate_similarity(text1, text2):
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([text1, text2])
    return cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

def analyze_skills(resume_text, jd_text):
    # Extract skills using NLP (simplified)
    resume_skills = set([ent.text.lower() for ent in nlp(resume_text).ents if ent.label_ == 'SKILL'])
    jd_skills = set([ent.text.lower() for ent in nlp(jd_text).ents if ent.label_ == 'SKILL'])
    
    if not jd_skills:
        return 0
    
    matching_skills = resume_skills.intersection(jd_skills)
    return len(matching_skills) / len(jd_skills)

def analyze_experience(resume_text, jd_text):
    # Simplified experience matching
    resume_exp = [ent.text for ent in nlp(resume_text).ents if ent.label_ == 'DATE']
    jd_exp = [ent.text for ent in nlp(jd_text).ents if ent.label_ == 'DATE']
    
    if not jd_exp:
        return 0
    
    # Very basic comparison
    return min(1, len(resume_exp) / max(1, len(jd_exp)))

def analyze_education(resume_text, jd_text):
    # Simplified education matching
    resume_edu = [ent.text for ent in nlp(resume_text).ents if ent.label_ == 'ORG' and 'university' in ent.text.lower()]
    jd_edu = [ent.text for ent in nlp(jd_text).ents if ent.label_ == 'ORG' and 'university' in ent.text.lower()]
    
    if not jd_edu:
        return 0
    
    matching_edu = set(resume_edu).intersection(set(jd_edu))
    return len(matching_edu) / len(jd_edu)

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'resume' not in request.files or ('jd_file' not in request.files and 'jd_text' not in request.form):
        return jsonify({'error': 'Missing files or text'}), 400
    
    resume_file = request.files['resume']
    jd_file = request.files.get('jd_file')
    jd_text = request.form.get('jd_text', '')
    
    if resume_file.filename == '':
        return jsonify({'error': 'No selected resume file'}), 400
    
    if jd_file and jd_file.filename == '':
        return jsonify({'error': 'No selected job description file'}), 400
    
    if not jd_file and not jd_text:
        return jsonify({'error': 'No job description provided'}), 400
    
    # Save and process resume
    if resume_file and allowed_file(resume_file.filename):
        resume_filename = secure_filename(resume_file.filename)
        resume_path = os.path.join(app.config['UPLOAD_FOLDER'], resume_filename)
        resume_file.save(resume_path)
        resume_text = extract_text_from_file(resume_path)
        os.remove(resume_path)
    else:
        return jsonify({'error': 'Invalid resume file type'}), 400
    
    # Process job description
    if jd_file and allowed_file(jd_file.filename):
        jd_filename = secure_filename(jd_file.filename)
        jd_path = os.path.join(app.config['UPLOAD_FOLDER'], jd_filename)
        jd_file.save(jd_path)
        jd_text = extract_text_from_file(jd_path)
        os.remove(jd_path)
    
    # Preprocess texts
    processed_resume = preprocess_text(resume_text)
    processed_jd = preprocess_text(jd_text)
    
    # Calculate scores
    overall_score = calculate_similarity(processed_resume, processed_jd)
    skills_score = analyze_skills(resume_text, jd_text)
    exp_score = analyze_experience(resume_text, jd_text)
    edu_score = analyze_education(resume_text, jd_text)
    keywords_score = calculate_similarity(resume_text, jd_text)  # Using raw text for keywords
    
    # Convert to percentages
    result = {
        'overall_score': round(overall_score * 100, 1),
        'skills_score': round(skills_score * 100, 1),
        'experience_score': round(exp_score * 100, 1),
        'education_score': round(edu_score * 100, 1),
        'keywords_score': round(keywords_score * 100, 1),
        'suggestions': generate_suggestions(overall_score * 100)
    }
    
    return jsonify(result)

def generate_suggestions(score):
    suggestions = []
    
    if score < 50:
        suggestions = [
            "Your resume needs significant improvement to match this job",
            "Add more relevant skills from the job description",
            "Highlight your most relevant experience first",
            "Consider restructuring your resume to better align with the job requirements"
        ]
    elif score < 70:
        suggestions = [
            "Your resume is somewhat matched but could be improved",
            "Include more keywords from the job description",
            "Quantify your achievements with specific metrics",
            "Add a skills section that matches the job requirements"
        ]
    elif score < 85:
        suggestions = [
            "Good match! Consider a few improvements",
            "Tailor your summary to better match the job",
            "Reorder sections to highlight most relevant qualifications",
            "Double-check for any missing keywords"
        ]
    else:
        suggestions = [
            "Excellent match! Your resume is well-aligned",
            "Consider applying for this position",
            "Ensure your contact info is up to date",
            "Save a PDF version with your name in the filename"
        ]
    
    return suggestions

if __name__ == '__main__':
    app.run(debug=True)
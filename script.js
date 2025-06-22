document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const resumeBtn = document.getElementById('resume-btn');
    const resumeUpload = document.getElementById('resume-upload');
    const resumeInfo = document.getElementById('resume-info');
    const jdBtn = document.getElementById('jd-btn');
    const jdUpload = document.getElementById('jd-upload');
    const jdInfo = document.getElementById('jd-info');
    const jdText = document.getElementById('jd-text');
    const analyzeBtn = document.getElementById('analyze-btn');
    const btnText = document.querySelector('.btn-text');
    const btnLoader = document.querySelector('.btn-loader');
    const resultsContainer = document.getElementById('results-container');
    const newAnalysisBtn = document.getElementById('new-analysis-btn');
    const matchScore = document.getElementById('match-score');
    const scoreValue = document.querySelector('.score-value');
    const progressRing = document.querySelector('.progress-ring-circle');
    const progressBars = {
        skills: document.getElementById('skills-progress'),
        exp: document.getElementById('exp-progress'),
        edu: document.getElementById('edu-progress'),
        keywords: document.getElementById('keywords-progress')
    };
    const progressValues = {
        skills: document.getElementById('skills-value'),
        exp: document.getElementById('exp-value'),
        edu: document.getElementById('edu-value'),
        keywords: document.getElementById('keywords-value')
    };
    const suggestionsList = document.getElementById('suggestions-list');
    const resumeCard = document.getElementById('resume-card');
    const jdCard = document.getElementById('jd-card');
    
    // Set progress ring circumference
    const radius = progressRing.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    progressRing.style.strokeDasharray = circumference;
    progressRing.style.strokeDashoffset = circumference;
    
    // Event Listeners
    resumeBtn.addEventListener('click', () => resumeUpload.click());
    jdBtn.addEventListener('click', () => jdUpload.click());
    
    resumeUpload.addEventListener('change', handleFileUpload);
    jdUpload.addEventListener('change', handleFileUpload);
    
    analyzeBtn.addEventListener('click', analyzeDocuments);
    newAnalysisBtn.addEventListener('click', resetForm);
    
    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        resumeCard.addEventListener(eventName, preventDefaults, false);
        jdCard.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        resumeCard.addEventListener(eventName, highlightResume, false);
        jdCard.addEventListener(eventName, highlightJD, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        resumeCard.addEventListener(eventName, unhighlightResume, false);
        jdCard.addEventListener(eventName, unhighlightJD, false);
    });
    
    resumeCard.addEventListener('drop', handleResumeDrop, false);
    jdCard.addEventListener('drop', handleJDDrop, false);
    
    // Functions
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlightResume() {
        resumeCard.classList.add('active');
    }
    
    function highlightJD() {
        jdCard.classList.add('active');
    }
    
    function unhighlightResume() {
        resumeCard.classList.remove('active');
    }
    
    function unhighlightJD() {
        jdCard.classList.remove('active');
    }
    
    function handleResumeDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        resumeUpload.files = files;
        handleFileUpload.call(resumeUpload);
    }
    
    function handleJDDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        jdUpload.files = files;
        handleFileUpload.call(jdUpload);
    }
    
    function handleFileUpload() {
        const file = this.files[0];
        if (file) {
            const fileName = file.name.length > 20 
                ? file.name.substring(0, 17) + '...' 
                : file.name;
            
            if (this.id === 'resume-upload') {
                resumeInfo.textContent = fileName;
            } else {
                jdInfo.textContent = fileName;
                jdText.value = '';
            }
        }
    }
    
    function analyzeDocuments() {
        // Validate inputs
        if (!resumeUpload.files[0] && (!jdUpload.files[0] && jdText.value.trim() === '')) {
            showError('Please upload a resume and job description or paste job description text');
            return;
        }
        
        if (!resumeUpload.files[0]) {
            showError('Please upload a resume');
            return;
        }
        
        if (!jdUpload.files[0] && jdText.value.trim() === '') {
            showError('Please upload a job description or paste job description text');
            return;
        }
        
        // Show loading state
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        analyzeBtn.disabled = true;
        
        // Simulate API call (replace with actual API call)
        setTimeout(() => {
            // Generate random results for demo
            const totalScore = Math.floor(Math.random() * 41) + 60; // 60-100
            const skillsScore = Math.floor(Math.random() * 41) + 60;
            const expScore = Math.floor(Math.random() * 41) + 60;
            const eduScore = Math.floor(Math.random() * 41) + 60;
            const keywordsScore = Math.floor(Math.random() * 41) + 60;
            
            // Show results
            showResults(totalScore, skillsScore, expScore, eduScore, keywordsScore);
            
            // Hide loading state
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
            analyzeBtn.disabled = false;
        }, 2000);
    }
    
    function showResults(totalScore, skillsScore, expScore, eduScore, keywordsScore) {
        // Update score circle
        const offset = circumference - (totalScore / 100) * circumference;
        progressRing.style.strokeDashoffset = offset;
        scoreValue.textContent = `${totalScore}%`;
        
        // Update progress bars
        progressBars.skills.style.width = `${skillsScore}%`;
        progressValues.skills.textContent = `${skillsScore}%`;
        
        progressBars.exp.style.width = `${expScore}%`;
        progressValues.exp.textContent = `${expScore}%`;
        
        progressBars.edu.style.width = `${eduScore}%`;
        progressValues.edu.textContent = `${eduScore}%`;
        
        progressBars.keywords.style.width = `${keywordsScore}%`;
        progressValues.keywords.textContent = `${keywordsScore}%`;
        
        // Generate suggestions
        generateSuggestions(totalScore);
        
        // Show results container
        resultsContainer.classList.remove('hidden');
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Trigger confetti if score is high
        if (totalScore >= 80) {
            triggerConfetti();
        }
    }
    
    function generateSuggestions(score) {
        suggestionsList.innerHTML = '';
        
        const suggestions = [];
        
        if (score < 70) {
            suggestions.push(
                "Add more relevant skills from the job description",
                "Highlight your most relevant experience first",
                "Include specific achievements with metrics",
                "Use more keywords from the job description"
            );
        } else if (score < 85) {
            suggestions.push(
                "Tailor your summary to match the job requirements",
                "Reorder sections to highlight most relevant qualifications",
                "Add a skills section with keywords from the job description",
                "Quantify your achievements with numbers"
            );
        } else {
            suggestions.push(
                "Your resume is well-matched! Consider applying",
                "Double-check for any missing keywords",
                "Ensure your contact info is up to date",
                "Save a PDF version with your name in the filename"
            );
        }
        
        suggestions.forEach(text => {
            const li = document.createElement('li');
            li.textContent = text;
            suggestionsList.appendChild(li);
        });
    }
    
    function resetForm() {
        resumeUpload.value = '';
        jdUpload.value = '';
        jdText.value = '';
        resumeInfo.textContent = 'No file selected';
        jdInfo.textContent = 'No file selected';
        resultsContainer.classList.add('hidden');
        
        // Reset progress indicators
        progressRing.style.strokeDashoffset = circumference;
        scoreValue.textContent = '0%';
        
        Object.values(progressBars).forEach(bar => {
            bar.style.width = '0%';
        });
        
        Object.values(progressValues).forEach(value => {
            value.textContent = '0%';
        });
    }
    
    function showError(message) {
        // Create error toast
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    function triggerConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const ctx = canvas.getContext('2d');
        const pieces = [];
        const colors = ['#f72585', '#4361ee', '#4cc9f0', '#4895ef', '#3f37c9'];
        
        // Create confetti pieces
        for (let i = 0; i < 150; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                r: Math.random() * 4 + 1,
                d: Math.random() * 5 + 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 10 - 5
            });
        }
        
        // Animation loop
        function loop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            let remaining = 0;
            
            pieces.forEach(p => {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(0, 0, p.r, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
                
                p.y += p.d;
                p.rotation += p.rotationSpeed;
                
                if (p.y < canvas.height) {
                    remaining++;
                }
            });
            
            if (remaining > 0) {
                requestAnimationFrame(loop);
            }
        }
        
        loop();
    }
    
    // Add some CSS for error toast
    const style = document.createElement('style');
    style.textContent = `
        .error-toast {
            position: fixed;
            bottom: -100px;
            left: 50%;
            transform: translateX(-50%);
            background: #f72585;
            color: white;
            padding: 1rem 2rem;
            border-radius: 50px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            transition: all 0.3s ease;
        }
        
        .error-toast.show {
            bottom: 30px;
        }
    `;
    document.head.appendChild(style);
});
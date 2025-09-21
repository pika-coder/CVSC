'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';

type Review = {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  score: number;
};

type FileState = {
  file: File | null;
  preview: string | null;
  extractedText: string | null;
};

export default function HomePage() {
  const [text, setText] = useState('');
  const [fileState, setFileState] = useState<FileState>({
    file: null,
    preview: null,
    extractedText: null,
  });
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setFileState({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      extractedText: null,
    });
    setText(''); // Clear text area when file is selected
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!text.trim() && !fileState.file) {
      setError('Please enter text or upload a file');
      return;
    }

    setLoading(true);
    setError(null);
    setReview(null);

    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      if (fileState.file) formData.append('file', fileState.file);

      const res = await fetch('/api/review', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request failed');
      setReview(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || (!text.trim() && !fileState.file);

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-lg-6">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="card-title">Upload or Paste your CV</h5>
              <p className="text-muted mb-3">
                We'll analyze your CV and provide strengths, weaknesses, suggestions, and an overall score.
              </p>
              
              <form onSubmit={handleSubmit}>
                {/* File Upload */}
                <div className="mb-3">
                  <label htmlFor="cvFile" className="form-label">
                    Upload CV (PDF, DOCX, or TXT)
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="cvFile"
                    accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  <div className="form-text">
                    Supported formats: PDF, DOCX, TXT (Max 5MB)
                  </div>
                </div>

                {/* Divider with "OR" text */}
                <div className="position-relative my-4">
                  <hr />
                  <div className="position-absolute top-50 start-50 translate-middle bg-white px-3">
                    OR
                  </div>
                </div>

                {/* Text Area */}
                <div className="mb-3">
                  <label htmlFor="cvText" className="form-label">
                    Paste your CV text
                  </label>
                  <textarea
                    id="cvText"
                    className="form-control"
                    rows={12}
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      // Clear file when typing in text area
                      if (fileState.file) {
                        setFileState({ file: null, preview: null, extractedText: null });
                      }
                    }}
                    placeholder="Paste your CV text here..."
                    disabled={loading}
                  />
                </div>

                {/* File Preview */}
                {fileState.preview && (
                  <div className="mb-3">
                    <h6>Preview:</h6>
                    <img 
                      src={fileState.preview} 
                      alt="Preview" 
                      className="img-fluid rounded border"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                )}

                {/* Submit Button */}
                <div className="d-flex justify-content-between align-items-center">
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={disabled}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze CV'
                    )}
                  </button>
                  
                  {fileState.file && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        setFileState({ file: null, preview: null, extractedText: null });
                        setText('');
                      }}
                      disabled={loading}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {error && (
                  <div className="alert alert-danger mt-3 mb-0">
                    {error}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="col-lg-6">
          {loading ? (
            <div className="card h-100 border-0 bg-light">
              <div className="card-body d-flex align-items-center justify-content-center">
                <div className="text-center">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mb-0">Analyzing your CV...</p>
                </div>
              </div>
            </div>
          ) : review ? (
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h5 className="card-title mb-0">CV Analysis Results</h5>
                  <span className={`badge fs-6 ${
                    review.score >= 8 ? 'bg-success' : 
                    review.score >= 5 ? 'bg-warning text-dark' : 'bg-danger'
                  }`}>
                    Score: {review.score}/10
                  </span>
                </div>
                
                <div className="mb-4">
                  <h6 className="d-flex align-items-center">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    Strengths
                  </h6>
                  <ul className="list-group list-group-flush">
                    {review.strengths.map((strength, i) => (
                      <li key={`strength-${i}`} className="list-group-item bg-transparent ps-0">
                        <i className="bi bi-check-circle text-success me-2"></i>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <h6 className="d-flex align-items-center">
                    <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                    Areas for Improvement
                  </h6>
                  <ul className="list-group list-group-flush">
                    {review.weaknesses.map((weakness, i) => (
                      <li key={`weakness-${i}`} className="list-group-item bg-transparent ps-0">
                        <i className="bi bi-dash-circle text-warning me-2"></i>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h6 className="d-flex align-items-center">
                    <i className="bi bi-lightbulb-fill text-info me-2"></i>
                    Suggestions
                  </h6>
                  <ul className="list-group list-group-flush">
                    {review.suggestions.map((suggestion, i) => (
                      <li key={`suggestion-${i}`} className="list-group-item bg-transparent ps-0">
                        <i className="bi bi-arrow-right-circle text-info me-2"></i>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-top">
                  <button 
                    className="btn btn-outline-primary w-100"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    <i className="bi bi-arrow-up-circle me-2"></i>
                    Try Another CV
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card h-100 border-0 bg-light">
              <div className="card-body d-flex align-items-center justify-content-center">
                <div className="text-center text-muted">
                  <i className="bi bi-file-earmark-text display-4 mb-3"></i>
                  <h5>No Analysis Yet</h5>
                  <p className="mb-0">Upload or paste your CV to get started</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

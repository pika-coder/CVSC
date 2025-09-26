'use client';

import { useState, useRef, type FormEvent, type ChangeEvent, type DragEvent } from 'react';
import { 
  Upload as UploadIcon, 
  FileText, 
  File as FileIcon,
  X, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  ArrowUp, 
  Loader2,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

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
  fileName: string;
  fileSize: string;
  fileType: string;
};

export default function HomePage() {
  const [text, setText] = useState('');
  const [fileState, setFileState] = useState<FileState>({
    file: null,
    preview: null,
    extractedText: null,
    fileName: '',
    fileSize: '',
    fileType: ''
  });
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid file type (PDF, DOCX, or TXT)');
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size should not exceed 5MB');
      return;
    }

    // Set file state
    setFileState({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      extractedText: null,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      fileType: file.type
    });
    
    setText(''); // Clear text area when file is selected
    setError(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
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
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setText('');
    setFileState({
      file: null,
      preview: null,
      extractedText: null,
      fileName: '',
      fileSize: '',
      fileType: ''
    });
    setReview(null);
    setError(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const disabled = loading || (!text.trim() && !fileState.file);
  const hasFile = !!fileState.file;

  // Get file icon based on file type
  const getFileIcon = () => {
    if (!fileState.fileType) return <FileText className="text-primary" size={24} />;
    
    if (fileState.fileType.includes('pdf')) {
      return <FileText className="text-red-500" size={24} />; // Red color for PDF
    } else if (fileState.fileType.includes('word') || fileState.fileType.includes('document')) {
      return <FileIcon className="text-blue-600" size={24} />; // Blue color for Word docs
    } else if (fileState.fileType.includes('text/plain')) {
      return <FileText className="text-gray-600" size={24} />; // Gray for text files
    } else {
      return <FileText className="text-gray-400" size={24} />; // Default for other file types
    }
  };

  return (
    <div className="min-vh-100 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <header className="bg-white shadow-sm">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-8 mx-auto text-center">
              <h1 className="display-5 fw-bold text-gray-900 mb-3">
                AI-Powered CV Review
              </h1>
              <p className="lead text-muted mb-4">
                Get instant feedback on your resume with our AI-powered analysis. 
                Discover strengths, areas for improvement, and actionable suggestions to land your dream job.
              </p>
              
              {!review && (
                <div className="d-flex gap-3 justify-content-center">
                  <button 
                    className="btn btn-primary btn-lg px-4"
                    onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Get Started <ChevronRight className="ms-1" size={20} />
                  </button>
                  <button 
                    className="btn btn-outline-secondary btn-lg px-4"
                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    How It Works
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {!review ? (
                <div className="card border-0 shadow-lg overflow-hidden" id="upload-section">
                  <div className="card-body p-0">
                    <div className="row g-0">
                      {/* Left Side - Upload Area */}
                      <div className="col-lg-6 p-5">
                        <h2 className="h4 mb-4">Upload Your CV</h2>
                        
                        <div 
                          className={`custom-file-upload ${isDragging ? 'drag-over' : ''} mb-4`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="text-center py-4">
                            <div className="bg-primary bg-opacity-10 d-inline-flex p-3 rounded-circle mb-3">
                              <UploadIcon className="text-primary" size={24} />
                            </div>
                            <h5 className="mb-1">Drag & drop your file here</h5>
                            <p className="text-muted small mb-2">or click to browse files</p>
                            <span className="badge bg-light text-dark fw-normal px-3 py-2">
                              PDF, DOCX, or TXT (Max 5MB)
                            </span>
                          </div>
                          
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="d-none"
                            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                            onChange={handleFileChange}
                            disabled={loading}
                          />
                        </div>

                        {/* Selected File Preview */}
                        {hasFile && (
                          <div className="card border-0 bg-light mb-4 animate-fade-in">
                            <div className="card-body p-3">
                              <div className="d-flex align-items-center">
                                <div className="flex-shrink-0 me-3">
                                  {getFileIcon()}
                                </div>
                                <div className="flex-grow-1 overflow-hidden">
                                  <h6 className="text-truncate mb-0" title={fileState.fileName}>
                                    {fileState.fileName}
                                  </h6>
                                  <small className="text-muted">{fileState.fileSize}</small>
                                </div>
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-link text-danger p-0 ms-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    resetForm();
                                  }}
                                  disabled={loading}
                                >
                                  <X size={20} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Divider */}
                        <div className="position-relative my-4">
                          <hr className="my-4" />
                          <div className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small">
                            OR
                          </div>
                        </div>

                        {/* Text Area */}
                        <div className="mb-4">
                          <label htmlFor="cvText" className="form-label fw-medium">
                            Paste your CV text
                          </label>
                          <textarea
                            id="cvText"
                            className="form-control"
                            rows={8}
                            value={text}
                            onChange={(e) => {
                              setText(e.target.value);
                              // Clear file when typing in text area
                              if (fileState.file) {
                                resetForm();
                              }
                            }}
                            placeholder="Paste your CV content here..."
                            disabled={loading}
                            style={{ resize: 'none' }}
                          />
                        </div>

                        {/* Submit Button */}
                        <button 
                          type="button" 
                          className="btn btn-primary w-100 py-3 fw-medium"
                          onClick={handleSubmit}
                          disabled={disabled}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="animate-spin me-2" size={20} />
                              Analyzing...
                            </>
                          ) : (
                            'Analyze My CV'
                          )}
                        </button>

                        {error && (
                          <div className="alert alert-danger mt-3 mb-0 animate-fade-in" role="alert">
                            <AlertCircle className="me-2" size={18} />
                            {error}
                          </div>
                        )}
                      </div>

                      {/* Right Side - Preview/Info */}
                      <div className="col-lg-6 bg-light p-5 d-flex flex-column">
                        <div className="text-center mb-4">
                          <div className="d-inline-block p-3 bg-primary bg-opacity-10 rounded-circle mb-3">
                            <FileText className="text-primary" size={32} />
                          </div>
                          <h3 className="h5 mb-3">What You'll Get</h3>
                          <p className="text-muted">
                            Our AI will analyze your CV and provide detailed feedback in seconds.
                          </p>
                        </div>

                        <div className="mt-auto">
                          <div className="d-flex mb-3">
                            <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3">
                              <CheckCircle2 className="text-success" size={20} />
                            </div>
                            <div>
                              <h4 className="h6 mb-1">Strengths</h4>
                              <p className="text-muted small mb-0">
                                Identify what makes your CV stand out to recruiters.
                              </p>
                            </div>
                          </div>

                          <div className="d-flex mb-3">
                            <div className="bg-warning bg-opacity-10 p-2 rounded-circle me-3">
                              <AlertTriangle className="text-warning" size={20} />
                            </div>
                            <div>
                              <h4 className="h6 mb-1">Areas for Improvement</h4>
                              <p className="text-muted small mb-0">
                                Discover what might be holding your CV back.
                              </p>
                            </div>
                          </div>

                          <div className="d-flex">
                            <div className="bg-info bg-opacity-10 p-2 rounded-circle me-3">
                              <Lightbulb className="text-info" size={20} />
                            </div>
                            <div>
                              <h4 className="h6 mb-1">Actionable Suggestions</h4>
                              <p className="text-muted small mb-0">
                                Get specific tips to improve your CV's effectiveness.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card border-0 shadow-lg overflow-hidden" id="results">
                  <div className="card-body p-0">
                    <div className="row g-0">
                      {/* Results Sidebar */}
                      <div className="col-lg-4 bg-light p-4">
                        <div className="d-flex align-items-center mb-4">
                          <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                            <FileText className="text-primary" size={24} />
                          </div>
                          <div>
                            <h3 className="h5 mb-0">CV Analysis</h3>
                            {hasFile && (
                              <p className="text-muted small mb-0">{fileState.fileName}</p>
                            )}
                          </div>
                        </div>

                        <div className="card bg-white border-0 shadow-sm mb-4">
                          <div className="card-body text-center py-4">
                            <div className="position-relative d-inline-block mb-3">
                              <div className="position-relative">
                                <svg width="120" height="120" viewBox="0 0 44 44" className="text-primary">
                                  <circle cx="22" cy="22" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                                  <circle 
                                    cx="22" 
                                    cy="22" 
                                    r="20" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="4" 
                                    strokeLinecap="round"
                                    strokeDasharray="125.66"
                                    strokeDashoffset={125.66 - (review.score * 12.566)}
                                    transform="rotate(-90 22 22)"
                                    className="transition-all duration-1000 ease-in-out"
                                  />
                                </svg>
                                <div className="position-absolute top-50 start-50 translate-middle">
                                  <span className="display-5 fw-bold">{review.score}</span>
                                  <span className="text-muted">/10</span>
                                </div>
                              </div>
                            </div>
                            <h4 className="h5 mb-2">
                              {review.score >= 8 ? 'Excellent!' : 
                               review.score >= 6 ? 'Good Job!' : 
                               review.score >= 4 ? 'Needs Work' : 'Needs Improvement'}
                            </h4>
                            <p className="text-muted small mb-0">
                              {review.score >= 8 ? 'Your CV is in great shape!' : 
                               review.score >= 6 ? 'Your CV is good but has room for improvement.' : 
                               'Consider making some changes to improve your CV.'}
                            </p>
                          </div>
                        </div>

                        <div className="d-grid gap-2">
                          <button 
                            className="btn btn-outline-primary"
                            onClick={resetForm}
                          >
                            <UploadIcon className="me-2" size={18} />
                            Analyze Another CV
                          </button>
                          <button className="btn btn-outline-secondary">
                            <span className="d-flex align-items-center justify-content-center">
                              <svg className="me-2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                              Download Report
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Results Content */}
                      <div className="col-lg-8 p-5">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h2 className="h4 mb-0">Analysis Results</h2>
                          <span className={`badge rounded-pill px-3 py-2 ${
                            review.score >= 8 ? 'bg-success' : 
                            review.score >= 5 ? 'bg-warning text-dark' : 'bg-danger'
                          }`}>
                            {review.score >= 8 ? 'Strong' : 
                             review.score >= 5 ? 'Moderate' : 'Needs Work'}
                          </span>
                        </div>

                        <div className="mb-5">
                          <div className="d-flex align-items-center mb-3">
                            <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3">
                              <CheckCircle className="text-success" size={20} />
                            </div>
                            <h3 className="h5 mb-0">Strengths</h3>
                          </div>
                          <div className="ms-5 ps-3 border-start border-2 border-success">
                            <ul className="list-unstyled">
                              {review.strengths.map((strength, i) => (
                                <li key={`strength-${i}`} className="mb-2 d-flex">
                                  <CheckCircle2 className="text-success mt-1 me-2 flex-shrink-0" size={18} />
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="mb-5">
                          <div className="d-flex align-items-center mb-3">
                            <div className="bg-warning bg-opacity-10 p-2 rounded-circle me-3">
                              <AlertTriangle className="text-warning" size={20} />
                            </div>
                            <h3 className="h5 mb-0">Areas for Improvement</h3>
                          </div>
                          <div className="ms-5 ps-3 border-start border-2 border-warning">
                            <ul className="list-unstyled">
                              {review.weaknesses.map((weakness, i) => (
                                <li key={`weakness-${i}`} className="mb-2 d-flex">
                                  <AlertTriangle className="text-warning mt-1 me-2 flex-shrink-0" size={18} />
                                  <span>{weakness}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div>
                          <div className="d-flex align-items-center mb-3">
                            <div className="bg-info bg-opacity-10 p-2 rounded-circle me-3">
                              <Lightbulb className="text-info" size={20} />
                            </div>
                            <h3 className="h5 mb-0">Suggestions</h3>
                          </div>
                          <div className="ms-5 ps-3 border-start border-2 border-info">
                            <ul className="list-unstyled">
                              {review.suggestions.map((suggestion, i) => (
                                <li key={`suggestion-${i}`} className="mb-2 d-flex">
                                  <ArrowRight className="text-info mt-1 me-2 flex-shrink-0" size={18} />
                                  <span>{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* How It Works Section */}
              {!review && (
                <section className="mt-5 pt-5" id="how-it-works">
                  <div className="text-center mb-5">
                    <h2 className="h3 fw-bold mb-3">How It Works</h2>
                    <p className="text-muted">Get your CV reviewed in just a few simple steps</p>
                  </div>

                  <div className="row g-4">
                    <div className="col-md-4">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body text-center p-4">
                          <div className="bg-primary bg-opacity-10 d-inline-flex p-3 rounded-circle mb-3">
                            <span className="text-primary fw-bold">1</span>
                          </div>
                          <h3 className="h5 mb-3">Upload Your CV</h3>
                          <p className="text-muted mb-0">
                            Upload your CV in PDF, DOCX, or paste the text directly into our editor.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body text-center p-4">
                          <div className="bg-primary bg-opacity-10 d-inline-flex p-3 rounded-circle mb-3">
                            <span className="text-primary fw-bold">2</span>
                          </div>
                          <h3 className="h5 mb-3">AI Analysis</h3>
                          <p className="text-muted mb-0">
                            Our AI will analyze your CV for strengths, weaknesses, and areas for improvement.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body text-center p-4">
                          <div className="bg-primary bg-opacity-10 d-inline-flex p-3 rounded-circle mb-3">
                            <span className="text-primary fw-bold">3</span>
                          </div>
                          <h3 className="h5 mb-3">Get Results</h3>
                          <p className="text-muted mb-0">
                            Receive a detailed report with actionable feedback to improve your CV.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-top py-4 mt-5">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-0 text-muted">
                &copy; {new Date().getFullYear()} CV Review App. All rights reserved.
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <a href="#" className="text-muted me-3">Privacy Policy</a>
              <a href="#" className="text-muted">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

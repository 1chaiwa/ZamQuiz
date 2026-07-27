import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import './QuizList.css';

export default function QuizList() {
  const navigate = useNavigate();
  const location = useLocation();
  const subjectId = location.state?.subjectId || null;

  const [quizzes, setQuizzes] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchGrades = useCallback(async () => {
    const { data } = await supabase.from('grades').select('*').order('level');
    setGrades(data || []);
  }, []);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('quizzes')
      .select(`
        *,
        subjects (name, code),
        grades (name)
      `)
      .eq('is_active', true);

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    if (selectedGrade) {
      query = query.eq('grade_id', selectedGrade);
    }

    const { data } = await query;
    setQuizzes(data || []);
    setLoading(false);
  }, [subjectId, selectedGrade]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const filteredQuizzes = quizzes.filter((q) =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="quizlist">
      <header className="quizlist-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <h1>Quizzes</h1>
        <div style={{ width: 60 }} />
      </header>

      <div className="quizlist-content">
        <input
          className="search-input"
          type="text"
          placeholder="Search quizzes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="filter-row">
          {grades.map((g) => (
            <button
              key={g.id}
              className={`filter-chip ${selectedGrade === g.id ? 'active' : ''}`}
              onClick={() => setSelectedGrade(selectedGrade === g.id ? null : g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>

        {filteredQuizzes.length === 0 ? (
          <div className="empty-state">
            <p className="empty-title">No quizzes available</p>
            <p className="empty-subtitle">Check back later for new quizzes</p>
          </div>
        ) : (
          <div className="quiz-cards">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="quiz-card"
                onClick={() => navigate(`/quiz/${quiz.id}`)}
              >
                <div className="quiz-card-header">
                  <span className="quiz-badge">{quiz.subjects?.code}</span>
                  <span className="quiz-grade">{quiz.grades?.name}</span>
                </div>
                <h3 className="quiz-title">{quiz.title}</h3>
                <p className="quiz-description">{quiz.description}</p>
                <div className="quiz-footer">
                  <span className="quiz-meta">{quiz.total_questions} Questions</span>
                  {quiz.is_paid ? (
                    <span className="price-badge">K{quiz.price}</span>
                  ) : (
                    <span className="free-badge">FREE</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import './TeacherDashboard.css';

const emptyQuiz = {
  title: '',
  description: '',
  subject_id: '',
  grade_id: '',
  price: '10.00',
  is_paid: true,
  time_limit: 30,
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newQuiz, setNewQuiz] = useState(emptyQuiz);
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUserData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUser(data);
    }
  }, []);

  const fetchMyQuizzes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('quizzes')
      .select(`*, subjects (name, code), grades (name)`)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });
    setMyQuizzes(data || []);
    setLoading(false);
  }, []);

  const fetchSubjects = useCallback(async () => {
    const { data } = await supabase.from('subjects').select('*').order('name');
    setSubjects(data || []);
  }, []);

  const fetchGrades = useCallback(async () => {
    const { data } = await supabase.from('grades').select('*').order('level');
    setGrades(data || []);
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchMyQuizzes();
    fetchSubjects();
    fetchGrades();
  }, [fetchUserData, fetchMyQuizzes, fetchSubjects, fetchGrades]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        question_text: '',
        options: { A: '', B: '', C: '', D: '' },
        correct_answer: '',
        marks: 1,
      },
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateQuestionOption = (index, key, value) => {
    const updated = [...questions];
    updated[index] = {
      ...updated[index],
      options: { ...updated[index].options, [key]: value },
    };
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setNewQuiz(emptyQuiz);
    setQuestions([]);
    setError('');
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setError('');

    if (!newQuiz.title || !newQuiz.subject_id || !newQuiz.grade_id) {
      setError('Please fill in all required fields');
      return;
    }
    if (questions.length === 0) {
      setError('Please add at least one question');
      return;
    }
    if (questions.some((q) => !q.question_text || !q.correct_answer)) {
      setError('Every question needs text and a correct answer (A, B, C, or D)');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: newQuiz.title,
          description: newQuiz.description,
          subject_id: newQuiz.subject_id,
          grade_id: newQuiz.grade_id,
          teacher_id: user.id,
          price: parseFloat(newQuiz.price),
          is_paid: newQuiz.is_paid,
          time_limit: parseInt(newQuiz.time_limit, 10),
          total_questions: questions.length,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      for (const q of questions) {
        await supabase.from('questions').insert({
          quiz_id: quizData.id,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          marks: q.marks || 1,
        });
      }

      setModalOpen(false);
      resetForm();
      fetchMyQuizzes();
    } catch (err) {
      setError(err.message || 'Failed to create quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      <header className="teacher-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <div>
          <h1>Teacher Dashboard</h1>
          <p>Welcome, {user?.full_name}</p>
        </div>
      </header>

      <div className="teacher-stats">
        <div className="stat-card">
          <span className="stat-number">{myQuizzes.length}</span>
          <span className="stat-label">Total Quizzes</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{myQuizzes.filter((q) => q.is_active).length}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{myQuizzes.reduce((acc, q) => acc + q.total_questions, 0)}</span>
          <span className="stat-label">Questions</span>
        </div>
      </div>

      <button className="create-btn" onClick={() => setModalOpen(true)}>
        + Create New Quiz
      </button>

      <div className="quiz-items">
        {myQuizzes.length === 0 ? (
          <div className="empty-state">
            <p className="empty-title">No quizzes created yet</p>
            <p className="empty-subtitle">Create your first quiz now</p>
          </div>
        ) : (
          myQuizzes.map((item) => (
            <div key={item.id} className="quiz-item">
              <div className="quiz-item-header">
                <span className="quiz-item-title">{item.title}</span>
                <span className={`badge ${item.is_active ? 'active' : 'inactive'}`}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="quiz-item-meta">{item.subjects?.name} • {item.grades?.name}</p>
              <p className="quiz-item-meta">
                Questions: {item.total_questions} • {item.is_paid ? `K${item.price}` : 'Free'}
              </p>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Quiz</h2>
              <button className="close-btn" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <form className="modal-body" onSubmit={handleCreateQuiz}>
              {error && <div className="error-message">{error}</div>}

              <input
                className="input"
                type="text"
                placeholder="Quiz Title"
                value={newQuiz.title}
                onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
              />

              <textarea
                className="input textarea"
                placeholder="Description"
                rows={3}
                value={newQuiz.description}
                onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
              />

              <label className="picker-label">Subject</label>
              <div className="picker-row">
                {subjects.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    className={`picker-option ${newQuiz.subject_id === s.id ? 'selected' : ''}`}
                    onClick={() => setNewQuiz({ ...newQuiz, subject_id: s.id })}
                  >
                    {s.name}
                  </button>
                ))}
              </div>

              <label className="picker-label">Grade</label>
              <div className="picker-row">
                {grades.map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    className={`picker-option ${newQuiz.grade_id === g.id ? 'selected' : ''}`}
                    onClick={() => setNewQuiz({ ...newQuiz, grade_id: g.id })}
                  >
                    {g.name}
                  </button>
                ))}
              </div>

              <div className="row-inputs">
                <div className="half-input">
                  <label className="input-label">Time Limit (min)</label>
                  <input
                    className="input"
                    type="number"
                    value={newQuiz.time_limit}
                    onChange={(e) => setNewQuiz({ ...newQuiz, time_limit: e.target.value })}
                  />
                </div>
                <div className="half-input">
                  <label className="input-label">Price (K)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={newQuiz.price}
                    onChange={(e) => setNewQuiz({ ...newQuiz, price: e.target.value })}
                    disabled={!newQuiz.is_paid}
                  />
                </div>
              </div>

              <div className="toggle-row">
                <span>Paid quiz</span>
                <button
                  type="button"
                  className={`toggle-btn ${newQuiz.is_paid ? 'active' : ''}`}
                  onClick={() => setNewQuiz({ ...newQuiz, is_paid: !newQuiz.is_paid })}
                >
                  {newQuiz.is_paid ? 'Paid' : 'Free'}
                </button>
              </div>

              <div className="questions-section">
                <div className="questions-header">
                  <h3>Questions ({questions.length})</h3>
                  <button type="button" className="add-question-btn" onClick={addQuestion}>+ Add</button>
                </div>

                {questions.map((q, index) => (
                  <div key={q.id} className="question-item">
                    <div className="question-item-header">
                      <span>Question {index + 1}</span>
                      <button type="button" className="remove-btn" onClick={() => removeQuestion(index)}>Remove</button>
                    </div>

                    <input
                      className="input"
                      type="text"
                      placeholder="Question text"
                      value={q.question_text}
                      onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                    />

                    {['A', 'B', 'C', 'D'].map((key) => (
                      <input
                        key={key}
                        className="input option-input"
                        type="text"
                        placeholder={`Option ${key}`}
                        value={q.options[key]}
                        onChange={(e) => updateQuestionOption(index, key, e.target.value)}
                      />
                    ))}

                    <input
                      className="input"
                      type="text"
                      placeholder="Correct answer (A, B, C, or D)"
                      value={q.correct_answer}
                      onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value.toUpperCase())}
                    />
                  </div>
                ))}
              </div>

              <button type="submit" className="submit-btn" disabled={saving}>
                {saving ? 'Creating...' : 'Create Quiz'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

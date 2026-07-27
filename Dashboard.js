import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { supabase } from '../utils/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function TeacherDashboard({ navigation }) {
  const [user, setUser] = useState(null);
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    subject_id: '',
    grade_id: '',
    price: '10.00',
    is_paid: true,
    time_limit: 30,
  });
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetchUserData();
    fetchMyQuizzes();
    fetchSubjects();
    fetchGrades();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setUser(data);
    }
  };

  const fetchMyQuizzes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('quizzes')
      .select(`
        *,
        subjects (name, code),
        grades (name)
      `)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });
    setMyQuizzes(data || []);
    setLoading(false);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    setSubjects(data || []);
  };

  const fetchGrades = async () => {
    const { data } = await supabase
      .from('grades')
      .select('*')
      .order('level');
    setGrades(data || []);
  };

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
    updated[index][field] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateQuiz = async () => {
    if (!newQuiz.title || !newQuiz.subject_id || !newQuiz.grade_id) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (questions.length === 0) {
      Alert.alert('Error', 'Please add at least one question');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create quiz
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
          time_limit: parseInt(newQuiz.time_limit),
          total_questions: questions.length,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Add questions
      for (const q of questions) {
        await supabase
          .from('questions')
          .insert({
            quiz_id: quizData.id,
            question_text: q.question_text,
            options: q.options,
            correct_answer: q.correct_answer,
            marks: q.marks || 1,
          });
      }

      Alert.alert('Success', 'Quiz created successfully!');
      setModalVisible(false);
      resetForm();
      fetchMyQuizzes();
    } catch (error) {
      console.error('Error creating quiz:', error);
      Alert.alert('Error', 'Failed to create quiz');
    }
  };

  const resetForm = () => {
    setNewQuiz({
      title: '',
      description: '',
      subject_id: '',
      grade_id: '',
      price: '10.00',
      is_paid: true,
      time_limit: 30,
    });
    setQuestions([]);
  };

  const renderQuizItem = ({ item }) => (
    <TouchableOpacity style={styles.quizItem}>
      <View style={styles.quizItemHeader}>
        <Text style={styles.quizItemTitle}>{item.title}</Text>
        <View style={item.is_active ? styles.activeBadge : styles.inactiveBadge}>
          <Text style={styles.badgeText}>{item.is_active ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>
      <Text style={styles.quizItemMeta}>
        {item.subjects?.name} • {item.grades?.name}
      </Text>
      <Text style={styles.quizItemMeta}>
        Questions: {item.total_questions} • {item.is_paid ? `K${item.price}` : 'Free'}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Teacher Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome, {user?.full_name}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{myQuizzes.length}</Text>
          <Text style={styles.statLabel}>Total Quizzes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {myQuizzes.filter(q => q.is_active).length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {myQuizzes.reduce((acc, q) => acc + q.total_questions, 0)}
          </Text>
          <Text style={styles.statLabel}>Questions</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.createButtonText}>Create New Quiz</Text>
      </TouchableOpacity>

      <FlatList
        data={myQuizzes}
        renderItem={renderQuizItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No quizzes created yet</Text>
            <Text style={styles.emptySubtext}>Create your first quiz now</Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Quiz</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="Quiz Title"
                value={newQuiz.title}
                onChangeText={(text) => setNewQuiz({ ...newQuiz, title: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                value={newQuiz.description}
                onChangeText={(text) => setNewQuiz({ ...newQuiz, description: text })}
                multiline
                numberOfLines={3}
              />

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Subject</Text>
                <FlatList
                  horizontal
                  data={subjects}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.pickerOption,
                        newQuiz.subject_id === item.id && styles.pickerOptionSelected,
                      ]}
                      onPress={() => setNewQuiz({ ...newQuiz, subject_id: item.id })}
                    >
                      <Text style={[
                        styles.pickerText,
                        newQuiz.subject_id === item.id && styles.pickerTextSelected,
                      ]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                  showsHorizontalScrollIndicator={false}
                />
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Grade</Text>
                <FlatList
                  horizontal
                  data={grades}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.pickerOption,
                        newQuiz.grade_id === item.id && styles.pickerOptionSelected,
                      ]}
                      onPress={() => setNewQuiz({ ...newQuiz, grade_id: item.id })}
                    >
                      <Text style={[
                        styles.pickerText,
                        newQuiz.grade_id === item.id && styles.pickerTextSelected,
                      ]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                  showsHorizontalScrollIndicator={false}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Price (K)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10.00"
                    value={newQuiz.price}
                    onChangeText={(text) => setNewQuiz({ ...newQuiz, price: text })}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Time Limit (min)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="30"
                    value={String(newQuiz.time_limit)}
                    onChangeText={(text) => setNewQuiz({ ...newQuiz, time_limit: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>Paid Quiz</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    newQuiz.is_paid && styles.toggleActive,
                  ]}
                  onPress={() => setNewQuiz({ ...newQuiz, is_paid: !newQuiz.is_paid })}
                >
                  <Text style={styles.toggleText}>
                    {newQuiz.is_paid ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.questionsSection}>
                <View style={styles.questionsHeader}>
                  <Text style={styles.questionsTitle}>Questions</Text>
                  <TouchableOpacity onPress={addQuestion} style={styles.addQuestionButton}>
                    <Ionicons name="add" size={24} color="#FF6B00" />
                  </TouchableOpacity>
                </View>

                {questions.map((q, index) => (
                  <View key={q.id} style={styles.questionItem}>
                    <View style={styles.questionHeader}>
                      <Text style={styles.questionNumber}>Q{index + 1}</Text>
                      <TouchableOpacity onPress={() => removeQuestion(index)}>
                        <Ionicons name="trash-outline" size={20} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Question text"
                      value={q.question_text}
                      onChangeText={(text) => updateQuestion(index, 'question_text', text)}
                    />
                    {['A', 'B', 'C', 'D'].map((letter) => (
                      <TextInput
                        key={letter}
                        style={styles.optionInput}
                        placeholder={`Option ${letter}`}
                        value={q.options[letter]}
                        onChangeText={(text) => {
                          const updated = { ...q.options, [letter]: text };
                          updateQuestion(index, 'options', updated);
                        }}
                      />
                    ))}
                    <TextInput
                      style={styles.input}
                      placeholder="Correct answer (A, B, C, or D)"
                      value={q.correct_answer}
                      onChangeText={(text) => updateQuestion(index, 'correct_answer', text)}
                    />
                  </View>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateQuiz}
            >
              <Text style={styles.submitButtonText}>Create Quiz</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FF6B00',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 15,
    marginTop: -20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  listContainer: {
    padding: 15,
  },
  quizItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quizItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  quizItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  activeBadge: {
    backgroundColor: '#4CAF5020',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  inactiveBadge: {
    backgroundColor: '#F4433620',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    color: '#333',
  },
  quizItemMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pickerOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  pickerOptionSelected: {
    backgroundColor: '#FF6B00',
  },
  pickerText: {
    fontSize: 14,
    color: '#333',
  },
  pickerTextSelected: {
    color: '#fff',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginRight: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  toggleActive: {
    backgroundColor: '#FF6B00',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  questionsSection: {
    marginTop: 10,
  },
  questionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  questionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addQuestionButton: {
    padding: 5,
  },
  questionItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  optionInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#FF6B00',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
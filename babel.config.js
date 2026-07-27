import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { supabase } from '../utils/supabase';

export default function Dashboard({ navigation }) {
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    completed: 0,
    averageScore: 0,
  });

  useEffect(() => {
    fetchUserData();
    fetchSubjects();
    fetchStats();
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

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    setSubjects(data || []);
    setLoading(false);
  };

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('quiz_attempts')
        .select('score, total_questions')
        .eq('student_id', user.id)
        .eq('status', 'completed');

      if (data && data.length > 0) {
        const total = data.length;
        const avgScore = data.reduce((acc, curr) => acc + (curr.score / curr.total_questions * 100), 0) / total;
        setStats({
          totalQuizzes: data.length,
          completed: data.filter(a => a.status === 'completed').length,
          averageScore: Math.round(avgScore),
        });
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubjects();
    await fetchStats();
    setRefreshing(false);
  };

  const renderSubjectCard = (subject) => (
    <TouchableOpacity
      key={subject.id}
      style={styles.subjectCard}
      onPress={() => navigation.navigate('Quizzes', { subjectId: subject.id })}
    >
      <View style={styles.subjectIcon}>
        <Text style={styles.subjectIconText}>{subject.code.substring(0, 2)}</Text>
      </View>
      <Text style={styles.subjectName}>{subject.name}</Text>
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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.full_name || 'Student'}</Text>
          <Text style={styles.welcomeText}>Ready to learn today?</Text>
        </View>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.full_name?.charAt(0) || 'S'}
          </Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalQuizzes}</Text>
          <Text style={styles.statLabel}>Quizzes Taken</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.averageScore}%</Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Subjects</Text>
        <Text style={styles.sectionSubtitle}>Choose a subject to start</Text>
      </View>

      <View style={styles.subjectsGrid}>
        {subjects.map(renderSubjectCard)}
      </View>
    </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FF6B00',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  subjectCard: {
    width: '28%',
    backgroundColor: '#fff',
    margin: '2.5%',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subjectIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B0010',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  subjectName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
});
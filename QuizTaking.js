import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { supabase } from '../utils/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function QuizList({ navigation, route }) {
  const { subjectId } = route.params || {};
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGrades();
    fetchQuizzes();
  }, [subjectId, selectedGrade]);

  const fetchGrades = async () => {
    const { data } = await supabase
      .from('grades')
      .select('*')
      .order('level');
    setGrades(data || []);
  };

  const fetchQuizzes = async () => {
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
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQuizzes();
    setRefreshing(false);
  };

  const renderQuizItem = ({ item }) => (
    <TouchableOpacity
      style={styles.quizCard}
      onPress={() => navigation.navigate('QuizTaking', { quizId: item.id })}
    >
      <View style={styles.quizHeader}>
        <View style={styles.quizBadge}>
          <Text style={styles.quizBadgeText}>{item.subjects?.code}</Text>
        </View>
        <Text style={styles.quizGrade}>{item.grades?.name}</Text>
      </View>
      
      <Text style={styles.quizTitle}>{item.title}</Text>
      <Text style={styles.quizDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.quizFooter}>
        <View style={styles.quizMeta}>
          <Ionicons name="help-circle-outline" size={16} color="#666" />
          <Text style={styles.quizMetaText}>{item.total_questions} Questions</Text>
        </View>
        {item.is_paid ? (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>K{item.price}</Text>
          </View>
        ) : (
          <View style={styles.freeBadge}>
            <Text style={styles.freeText}>FREE</Text>
          </View>
        )}
      </View>
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
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search quizzes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={grades}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedGrade === item.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedGrade(
                selectedGrade === item.id ? null : item.id
              )}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedGrade === item.id && styles.filterChipTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      <FlatList
        data={quizzes.filter(q => 
          q.title.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        renderItem={renderQuizItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No quizzes available</Text>
            <Text style={styles.emptySubtext}>Check back later for new quizzes</Text>
          </View>
        }
      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 10,
  },
  filterList: {
    paddingHorizontal: 15,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  quizCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quizBadge: {
    backgroundColor: '#FF6B0010',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quizBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  quizGrade: {
    fontSize: 12,
    color: '#666',
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  quizDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  quizFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quizMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizMetaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  priceBadge: {
    backgroundColor: '#FF6B0010',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  freeBadge: {
    backgroundColor: '#4CAF5010',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
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
});
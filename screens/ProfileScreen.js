import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Users, Trophy, TrendingUp, Calendar, Heart, Flame, Award, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen({ navigation }) {
  let [fontsLoaded] = useFonts({ 
    BodoniModa_700Bold, 
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold 
  });

  const user = auth.currentUser;
  const [stats, setStats] = useState({
    totalReviews: 0,
    totalComparisons: 0,
    topDish: null,
    favoriteLocation: null,
    streak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    setLoading(true);
    try {
      const userId = user.uid;

      // Fetch total reviews
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('userId', '==', userId)
      );
      const reviewsSnap = await getDocs(reviewsQuery);
      const totalReviews = reviewsSnap.size;

      // Fetch total comparisons
      const comparisonsQuery = query(
        collection(db, 'users', userId, 'comparisons')
      );
      const comparisonsSnap = await getDocs(comparisonsQuery);
      const totalComparisons = comparisonsSnap.size;

      // Fetch recent activity (mock for now)
      const recentQuery = query(
        collection(db, 'reviews'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentSnap = await getDocs(recentQuery);
      const recentList = recentSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setStats({
        totalReviews,
        totalComparisons,
        topDish: recentList[0]?.dishName || 'None yet',
        favoriteLocation: 'Ford Dining Court', // Mock data
        streak: 3, // Mock data - days in a row
      });

      setRecentActivity(recentList);

    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
    setLoading(false);
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomHeader />
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.streakBadge}>
              <Flame size={14} color="#FFFFFF" />
              <Text style={styles.streakText}>{stats.streak}</Text>
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Trophy size={14} color="#F47121" />
                <Text style={styles.badgeText}>Foodie</Text>
              </View>
              <View style={styles.badge}>
                <Award size={14} color="#007A7A" />
                <Text style={styles.badgeText}>Explorer</Text>
              </View>
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#F47121" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Heart size={24} color="#F47121" />
                </View>
                <Text style={styles.statNumber}>{stats.totalReviews}</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <TrendingUp size={24} color="#007A7A" />
                </View>
                <Text style={styles.statNumber}>{stats.totalComparisons}</Text>
                <Text style={styles.statLabel}>Comparisons</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Flame size={24} color="#FF4136" />
                </View>
                <Text style={styles.statNumber}>{stats.streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>

            {/* Dining Wrapped Preview */}
            <TouchableOpacity 
              style={styles.wrappedCard}
              onPress={() => {
                // TODO: Navigate to full Dining Wrapped screen
                alert('Coming Soon! Your Dining Wrapped will show:\n• Your most-reviewed dishes\n• Favorite dining hall\n• Total dishes tried\n• Food personality type\n• And more!');
              }}
            >
              <View style={styles.wrappedHeader}>
                <Calendar size={24} color="#F47121" />
                <View style={styles.wrappedInfo}>
                  <Text style={styles.wrappedTitle}>Your Dining Wrapped 2025</Text>
                  <Text style={styles.wrappedSubtitle}>See your year in food</Text>
                </View>
                <ChevronRight size={24} color="#007A7A" />
              </View>
              
              <View style={styles.wrappedPreview}>
                <View style={styles.wrappedStat}>
                  <Text style={styles.wrappedNumber}>{stats.totalReviews + stats.totalComparisons}</Text>
                  <Text style={styles.wrappedLabel}>Total Activities</Text>
                </View>
                <View style={styles.wrappedStat}>
                  <Text style={styles.wrappedNumber}>{stats.favoriteLocation.split(' ')[0]}</Text>
                  <Text style={styles.wrappedLabel}>Favorite Hall</Text>
                </View>
                <View style={styles.wrappedStat}>
                  <Text style={styles.wrappedNumber} numberOfLines={1}>
                    {stats.topDish.split(' ').slice(0, 2).join(' ')}
                  </Text>
                  <Text style={styles.wrappedLabel}>Top Dish</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Friends Section (Coming Soon) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Users size={20} color="#007A7A" />
                <Text style={styles.sectionTitle}>Friends</Text>
              </View>
              
              <View style={styles.comingSoonCard}>
                <Users size={48} color="#EAEAEA" />
                <Text style={styles.comingSoonTitle}>Friends Feature Coming Soon!</Text>
                <Text style={styles.comingSoonText}>
                  {'\n'}• TODO
                </Text>
              </View>
            </View>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                
                {recentActivity.map(activity => (
                  <View key={activity.id} style={styles.activityCard}>
                    <View style={styles.activityIcon}>
                      <Heart size={16} color="#F47121" fill="#F47121" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>Reviewed "{activity.dishName}"</Text>
                      <Text style={styles.activityTime}>
                        {activity.createdAt?.toDate?.()?.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) || 'Recently'}
                      </Text>
                    </View>
                    <View style={styles.activityScore}>
                      <Text style={styles.activityScoreText}>
                        {activity.initialScore ? ((activity.initialScore - 800) / 60).toFixed(1) : 'N/A'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Explore Features</Text>
              
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => navigation.navigate('TasteDNA')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#E0F2F2' }]}>
                  <Text style={styles.actionEmoji}>🧬</Text>
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionText}>Your Taste DNA</Text>
                  <Text style={styles.actionSubtext}>AI-powered recommendations</Text>
                </View>
                <ChevronRight size={20} color="#7D7D7D" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => navigation.navigate('SocialFeed')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#FFFBF8' }]}>
                  <Text style={styles.actionEmoji}>📱</Text>
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionText}>Food Feed</Text>
                  <Text style={styles.actionSubtext}>Share & discover with friends</Text>
                </View>
                <ChevronRight size={20} color="#7D7D7D" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => navigation.navigate('My List')}
              >
                <Trophy size={20} color="#F47121" />
                <Text style={styles.actionText}>View My Rankings</Text>
                <ChevronRight size={20} color="#7D7D7D" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
  container: { paddingBottom: 40 },
  
  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007A7A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'BodoniModa_700Bold',
    fontSize: 32,
    color: '#FFFFFF',
  },
  streakBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FF4136',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  streakText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#4E4A40',
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7D7D7D',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF6F0',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 5,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#4E4A40',
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    fontFamily: 'BodoniModa_700Bold',
    fontSize: 28,
    color: '#4E4A40',
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7D7D7D',
    marginTop: 4,
  },
  
  // Dining Wrapped Card
  wrappedCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#F47121',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#F47121',
  },
  wrappedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  wrappedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  wrappedTitle: {
    fontFamily: 'BodoniModa_700Bold',
    fontSize: 20,
    color: '#4E4A40',
  },
  wrappedSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7D7D7D',
  },
  wrappedPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  wrappedStat: {
    alignItems: 'center',
  },
  wrappedNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#F47121',
  },
  wrappedLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#7D7D7D',
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Sections
  section: {
    marginHorizontal: 20,
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'BodoniModa_700Bold',
    fontSize: 22,
    color: '#4E4A40',
  },
  
  // Coming Soon Card
  comingSoonCard: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EAEAEA',
    borderStyle: 'dashed',
  },
  comingSoonTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#4E4A40',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7D7D7D',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Recent Activity
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFBF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#4E4A40',
    marginBottom: 2,
  },
  activityTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7D7D7D',
  },
  activityScore: {
    backgroundColor: '#E0F2F2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  activityScoreText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#007A7A',
  },
  
  // Action Cards
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 12,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#4E4A40',
  },
  actionSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#7D7D7D',
    marginTop: 2,
  },
});
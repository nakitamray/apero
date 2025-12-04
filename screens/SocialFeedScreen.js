import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { Heart, MessageCircle, Share2, Camera, User, Clock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function SocialFeedScreen({ navigation }) {
  let [fontsLoaded] = useFonts({ 
    Inter_400Regular, 
    Inter_600SemiBold, 
    Inter_700Bold,
    BodoniModa_700Bold 
  });

  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    fetchFeed();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to let you upload food photos!');
    }
  };

  const fetchFeed = async () => {
    setLoading(true);
    try {
      // Fetch recent reviews with user info
      const reviewsQuery = query(
        collection(db, 'reviews'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const reviewsSnap = await getDocs(reviewsQuery);
      
      const feedItems = reviewsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userName: data.userId?.substring(0, 8) || 'Anonymous', // Mock - you'd fetch real user names
          dishName: data.dishName,
          note: data.note,
          tags: data.tags || [],
          initialScore: data.initialScore,
          createdAt: data.createdAt?.toDate() || new Date(),
          photoUrl: null, // Mock - would be actual uploaded photo
          likes: Math.floor(Math.random() * 50), // Mock data
          comments: Math.floor(Math.random() * 10), // Mock data
          isLiked: false,
        };
      });

      setFeed(feedItems);
    } catch (error) {
      console.error("Error fetching feed:", error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handlePhotoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        // Navigate to review screen with photo
        Alert.alert(
          "Photo Selected!",
          "This would normally upload the photo and open the review screen. Feature coming soon!"
        );
        // TODO: Upload to Firebase Storage and create review with photoUrl
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const handleLike = (postId) => {
    setFeed(prevFeed => 
      prevFeed.map(post => 
        post.id === postId 
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    
    return 'Just now';
  };

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.postUserInfo}>
          <View style={styles.avatar}>
            <User size={20} color="#007A7A" />
          </View>
          <View style={styles.postUserText}>
            <Text style={styles.postUserName}>{item.userName}</Text>
            <View style={styles.postMeta}>
              <Clock size={12} color="#7D7D7D" />
              <Text style={styles.postTime}>{getTimeAgo(item.createdAt)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Dish Info */}
      <View style={styles.postContent}>
        <Text style={styles.postDishName}>{item.dishName}</Text>
        <View style={styles.postRating}>
          <Text style={styles.postRatingText}>
            Rated: {item.initialScore ? ((item.initialScore - 800) / 60).toFixed(1) : 'N/A'}/10
          </Text>
        </View>
      </View>

      {/* Photo Placeholder */}
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.postImage} />
      ) : (
        <View style={styles.postImagePlaceholder}>
          <Camera size={40} color="#EAEAEA" />
          <Text style={styles.placeholderText}>Photo Coming Soon!</Text>
        </View>
      )}

      {/* Caption/Note */}
      {item.note && (
        <View style={styles.postCaption}>
          <Text style={styles.postCaptionText} numberOfLines={3}>
            {item.note}
          </Text>
        </View>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <View style={styles.postTags}>
          {item.tags.map((tag, idx) => (
            <Text key={idx} style={styles.postTag}>#{tag}</Text>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Heart 
            size={22} 
            color={item.isLiked ? "#F47121" : "#4E4A40"} 
            fill={item.isLiked ? "#F47121" : "none"}
          />
          <Text style={[styles.actionText, item.isLiked && styles.actionTextActive]}>
            {item.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MessageCircle size={22} color="#4E4A40" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Share2 size={22} color="#4E4A40" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with Camera Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Feed</Text>
        <TouchableOpacity 
          style={styles.cameraButton}
          onPress={handlePhotoUpload}
        >
          <Camera size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stories Row (Coming Soon) */}
      <View style={styles.storiesContainer}>
        <TouchableOpacity style={styles.addStory}>
          <View style={styles.addStoryCircle}>
            <Camera size={20} color="#007A7A" />
          </View>
          <Text style={styles.storyLabel}>Your Story</Text>
        </TouchableOpacity>
        
        {/* Mock friend stories */}
        {['Alex', 'Sam', 'Jordan', 'Casey'].map((name, idx) => (
          <TouchableOpacity key={idx} style={styles.story}>
            <View style={styles.storyCircle}>
              <User size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.storyLabel}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feed */}
      {loading ? (
        <ActivityIndicator size="large" color="#F47121" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={feed}
          renderItem={renderPost}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchFeed();
          }}
          contentContainerStyle={styles.feedContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet. Be the first to share!</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  headerTitle: {
    fontFamily: 'BodoniModa_700Bold',
    fontSize: 24,
    color: '#4E4A40',
  },
  cameraButton: {
    backgroundColor: '#F47121',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F47121',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Stories
  storiesContainer: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  addStory: {
    alignItems: 'center',
    marginRight: 15,
  },
  addStoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0F2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007A7A',
    borderStyle: 'dashed',
  },
  story: {
    alignItems: 'center',
    marginRight: 15,
  },
  storyCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007A7A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F47121',
  },
  storyLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#4E4A40',
    marginTop: 5,
  },
  
  // Feed
  feedContainer: {
    paddingVertical: 10,
  },
  
  // Post Card
  postCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  postUserText: {
    justifyContent: 'center',
  },
  postUserName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#4E4A40',
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  postTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7D7D7D',
  },
  
  // Post Content
  postContent: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  postDishName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#4E4A40',
    marginBottom: 5,
  },
  postRating: {
    backgroundColor: '#E0F2F2',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  postRatingText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#007A7A',
  },
  
  // Post Image
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F5F5F5',
  },
  postImagePlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#BDBDBD',
    marginTop: 10,
  },
  
  // Caption
  postCaption: {
    paddingHorizontal: 15,
    paddingTop: 12,
  },
  postCaptionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4E4A40',
    lineHeight: 20,
  },
  
  // Tags
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    paddingTop: 8,
    gap: 6,
  },
  postTag: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#007A7A',
  },
  
  // Actions
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#4E4A40',
  },
  actionTextActive: {
    color: '#F47121',
  },
  
  // Empty State
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#7D7D7D',
    textAlign: 'center',
  },
});
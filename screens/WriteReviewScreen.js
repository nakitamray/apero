import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X } from 'lucide-react-native';
import { useSession } from '../context/Session';
import { getDish, usersByIds } from '../lib/api';
import { VERDICTS } from '../lib/score';
import { REASONS } from '../lib/tags';
import { Button, Chip, Field, Hint, Label, Loading, Screen, Title } from '../components/ui';
import { Sticker } from '../components/art';
import { colors, fonts, lift } from '../theme';

const VERDICT_ART = {
  love: { art: 'bloodOrange', tint: '#FFE3CF' },
  fine: { art: 'lemonSlice', tint: colors.butter },
  meh: { art: 'starfish', tint: colors.lagoon },
};

export default function WriteReviewScreen({ navigation, route }) {
  const [dish, setDish] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [reasons, setReasons] = useState([]);
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState([]);
  const [friends, setFriends] = useState([]);
  const [withIds, setWithIds] = useState([]);
  const { following } = useSession();

  useEffect(() => {
    getDish(route.params.dishId).then(setDish);
  }, [route.params.dishId]);

  useEffect(() => {
    usersByIds(following)
      .then(setFriends)
      .catch(() => setFriends([]));
  }, [following.join(',')]);

  const addPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 4 - photos.length,
      quality: 0.7,
    });
    if (!result.canceled) setPhotos((list) => [...list, ...result.assets.map((a) => a.uri)].slice(0, 4));
  };

  const askToAddPhotos = async () => {
    if (Platform.OS !== 'web') {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert('No photo access', 'Allow photo access in Settings to add pictures of your food.');
        return;
      }
    }
    addPhotos();
  };

  const toggleWith = (id) => setWithIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  if (!dish) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const toggle = (id) => setReasons((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Label color={colors.teal}>{dish.placeName}</Label>
          <Title size={44}>{dish.name}</Title>

          <Label style={styles.label}>The verdict</Label>
          <View style={styles.verdicts}>
            {Object.entries(VERDICTS).map(([id, v], i) => {
              const active = verdict === id;
              const look = VERDICT_ART[id];
              return (
                <Pressable
                  key={id}
                  onPress={() => setVerdict(id)}
                  style={[
                    styles.verdict,
                    {
                      backgroundColor: active ? look.tint : colors.paper,
                      transform: [{ rotate: `${[-0.8, 0.5, -0.3][i]}deg` }],
                    },
                    active && styles.verdictActive,
                  ]}
                >
                  <Sticker name={look.art} width={46} rotate={active ? 12 : 0} />
                  <Text style={styles.verdictText}>{v.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Label style={styles.label}>Why? (pick any)</Label>
          <View style={styles.chips}>
            {REASONS.map((r) => (
              <Chip key={r.id} label={r.label} active={reasons.includes(r.id)} onPress={() => toggle(r.id)} />
            ))}
          </View>

          <Field
            label="Anything else?"
            value={note}
            onChangeText={setNote}
            placeholder="Ask for extra sauce."
            multiline
            maxLength={280}
            style={{ marginTop: 24 }}
          />

          <Label style={styles.label}>Photos (optional)</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
            {photos.map((uri) => (
              <View key={uri}>
                <Image source={{ uri }} style={styles.photo} />
                <Pressable
                  style={styles.removePhoto}
                  onPress={() => setPhotos((list) => list.filter((p) => p !== uri))}
                  hitSlop={8}
                  accessibilityLabel="Remove photo"
                >
                  <X size={14} color={colors.paper} strokeWidth={3} />
                </Pressable>
              </View>
            ))}
            {photos.length < 4 && (
              <Pressable style={styles.addPhoto} onPress={askToAddPhotos}>
                <Camera size={24} color={colors.deep} strokeWidth={1.8} />
                <Text style={styles.addPhotoText}>Add</Text>
              </Pressable>
            )}
          </ScrollView>

          {friends.length > 0 && (
            <>
              <Label style={styles.label}>Who were you with?</Label>
              <Hint arrow="">tag friends and it shows up on their feed too</Hint>
              <View style={[styles.chips, { marginTop: 10 }]}>
                {friends.map((f) => (
                  <Chip key={f.id} label={f.name} active={withIds.includes(f.id)} onPress={() => toggleWith(f.id)} />
                ))}
              </View>
            </>
          )}

          <Button
            label="Next"
            kind="citrus"
            disabled={!verdict}
            onPress={() =>
              navigation.navigate('Compare', {
                dish: {
                  id: dish.id,
                  name: dish.name,
                  placeId: dish.placeId,
                  placeName: dish.placeName,
                  campusId: dish.campusId,
                },
                verdict,
                tags: reasons,
                note,
                photos,
                withPeople: friends.filter((f) => withIds.includes(f.id)).map((f) => ({ id: f.id, name: f.name })),
              })
            }
            style={{ marginTop: 28 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 22, paddingBottom: 40 },
  label: { marginTop: 28, marginBottom: 12 },
  verdicts: { gap: 12 },
  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  verdictActive: { borderColor: colors.orange, ...lift },
  verdictText: { fontFamily: fonts.title, fontSize: 30, color: colors.ink },
  photos: { gap: 10, paddingVertical: 4 },
  photo: { width: 86, height: 86, borderRadius: 8, borderWidth: 1.5, borderColor: colors.ink },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhoto: {
    width: 86,
    height: 86,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.deep,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: { fontFamily: fonts.bold, fontSize: 12, color: colors.deep },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

import React, { useCallback, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { myRankings } from '../lib/api';
import { VERDICTS, toTen } from '../lib/score';
import { Button, Chip, Empty, Hint, Loading, Masthead, Note, Screen } from '../components/ui';
import { DishMenu } from '../components/rows';

const FILTERS = [{ id: 'all', label: 'All' }, ...Object.entries(VERDICTS).map(([id, v]) => ({ id, label: v.label }))];

export default function MyListScreen({ navigation }) {
  const { user, campus } = useSession();
  const [rankings, setRankings] = useState(null);
  const [filter, setFilter] = useState('all');
  const scrollY = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      myRankings(user.uid)
        .then(setRankings)
        .catch(() => setRankings([]));
    }, [user.uid]),
  );

  const shown = (rankings || []).filter((r) => filter === 'all' || r.verdict === filter);

  return (
    <Screen>
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        <Masthead
          kicker={rankings ? `${rankings.length} dishes ranked` : campus.short}
          title="My list"
          accent="best first"
          sticker="tin"
          stickerSize={130}
          scrollY={scrollY}
        />
        <Hint style={{ paddingHorizontal: 22, marginTop: 4 }} arrow="">
          tap a dish to see it or rate it again
        </Hint>
        <View style={styles.chips}>
          {FILTERS.map((f) => (
            <Chip key={f.id} label={f.label} active={filter === f.id} onPress={() => setFilter(f.id)} />
          ))}
        </View>

        {rankings === null ? (
          <Loading />
        ) : shown.length ? (
          <>
            <DishMenu
              key={filter}
              title="the house list"
              dishes={shown}
              rankFrom={1}
              scoreFor={(r) => toTen(r.elo)}
              onPress={(r) => navigation.navigate('Dish', { dishId: r.dishId })}
            />
            <Note size={13} style={styles.foot}>
              Scores are yours alone. The campus score is everyone's average.
            </Note>
          </>
        ) : (
          <Empty title="Nothing here yet" body="Every dish you rate gets slotted in here, best at the top.">
            <Button
              label="Rate your first dish"
              kind="citrus"
              onPress={() => navigation.navigate('ReviewTab')}
              style={{ marginTop: 18 }}
            />
          </Empty>
        )}
      </Animated.ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 22, paddingTop: 6, paddingBottom: 18 },
  foot: { textAlign: 'center', paddingHorizontal: 40, marginTop: 14 },
});

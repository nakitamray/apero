import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../context/Session';
import { myRankings } from '../lib/api';
import { VERDICTS, toTen } from '../lib/score';
import { Button, Chip, CollageHeader, Empty, Label, Loading, Note, Screen, Title } from '../components/ui';
import { DishRow } from '../components/rows';
import { colors } from '../theme';

const FILTERS = [{ id: 'all', label: 'All' }, ...Object.entries(VERDICTS).map(([id, v]) => ({ id, label: v.label }))];

export default function MyListScreen({ navigation }) {
  const { user } = useSession();
  const insets = useSafeAreaInsets();
  const [rankings, setRankings] = useState(null);
  const [filter, setFilter] = useState('all');

  useFocusEffect(
    useCallback(() => {
      myRankings(user.uid)
        .then(setRankings)
        .catch(() => setRankings([]));
    }, [user.uid]),
  );

  const shown = (rankings || []).filter((r) => filter === 'all' || r.verdict === filter);

  const header = (
    <View>
      <CollageHeader
        height={insets.top + 96}
        pieces={[
          { name: 'tin', size: 130, rotate: -8, right: 18, top: insets.top + 44 },
          { name: 'lemonSlice', size: 50, rotate: 0, right: 136, top: insets.top + 16 },
        ]}
      />
      <View style={styles.head}>
        <Label>{rankings ? `${rankings.length} dishes ranked` : ' '}</Label>
        <Title size={48}>My list</Title>
        <View style={styles.chips}>
          {FILTERS.map((f) => (
            <Chip key={f.id} label={f.label} active={filter === f.id} onPress={() => setFilter(f.id)} />
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={shown}
        keyExtractor={(r) => r.dishId}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <DishRow
            dish={item}
            index={index}
            rank={index + 1}
            score={toTen(item.elo)}
            onPress={() => navigation.navigate('Dish', { dishId: item.dishId })}
          />
        )}
        ListEmptyComponent={
          rankings === null ? (
            <Loading />
          ) : (
            <Empty title="Your list is empty" body="Every dish you rate gets slotted in here, best at the top.">
              <Button
                label="Rate your first dish"
                kind="citrus"
                onPress={() => navigation.navigate('ReviewTab')}
                style={{ marginTop: 18 }}
              />
            </Empty>
          )
        }
        ListFooterComponent={
          shown.length > 0 ? (
            <Note size={16} style={styles.foot}>
              Scores are yours alone. The campus score is everyone's average.
            </Note>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { padding: 22, paddingTop: 28, paddingBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  foot: { color: colors.muted, textAlign: 'center', paddingHorizontal: 40, marginTop: 8 },
});

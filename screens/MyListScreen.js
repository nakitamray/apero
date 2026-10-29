import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../context/Session';
import { myRankings } from '../lib/api';
import { VERDICTS, toTen } from '../lib/score';
import { Button, Chip, Empty, Kicker, Loading, Stripes, Title } from '../components/ui';
import { DishRow } from '../components/rows';
import { colors, fonts } from '../theme';

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
      <Stripes height={insets.top + 18} count={9} />
      <View style={styles.head}>
        <Kicker>{rankings ? `${rankings.length} dishes ranked` : ' '}</Kicker>
        <Title size={34}>My list</Title>
        <View style={styles.chips}>
          {FILTERS.map((f) => (
            <Chip key={f.id} label={f.label} active={filter === f.id} onPress={() => setFilter(f.id)} />
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      data={shown}
      keyExtractor={(r) => r.dishId}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: 40 }}
      renderItem={({ item, index }) => (
        <DishRow
          dish={item}
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
            <Button label="Rate your first dish" onPress={() => navigation.navigate('ReviewTab')} style={{ marginTop: 18 }} />
          </Empty>
        )
      }
      ListFooterComponent={
        shown.length > 0 ? <Text style={styles.foot}>Scores are yours alone. The campus score is everyone's average.</Text> : null
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  head: { padding: 20, paddingBottom: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  foot: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center', paddingHorizontal: 40, marginTop: 6 },
});

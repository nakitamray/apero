import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../context/Session';
import { campusDeals, setDealVote } from '../lib/api';
import { dealIsOn } from '../lib/deals';
import { Button, Chip, Empty, Loading, Note, Screen } from '../components/ui';
import { DealCard, makeDealVote } from '../components/deals';

export default function DealsScreen({ navigation }) {
  const { campus, user } = useSession();
  const [deals, setDeals] = useState(null);
  const [todayOnly, setTodayOnly] = useState(false);

  useFocusEffect(
    useCallback(() => {
      campusDeals(campus.id)
        .then(setDeals)
        .catch(() => setDeals([]));
    }, [campus.id]),
  );

  const vote = makeDealVote(setDeals, user.uid, setDealVote);
  const shown = (deals || []).filter((d) => !todayOnly || dealIsOn(d));

  const header = (
    <View style={styles.head}>
      <Note size={18}>Posted by students. Tap “still good” when you've used one so people know it's real.</Note>
      <View style={styles.row}>
        <Chip label="All deals" active={!todayOnly} onPress={() => setTodayOnly(false)} />
        <Chip label="On today" active={todayOnly} onPress={() => setTodayOnly(true)} />
      </View>
      <Button label="Post a deal" kind="citrus" onPress={() => navigation.navigate('AddDeal')} />
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={shown}
        keyExtractor={(d) => d.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <DealCard
            deal={item}
            index={index}
            uid={user.uid}
            onVote={vote}
            onPress={() => navigation.navigate('Place', { placeId: item.placeId })}
          />
        )}
        ListEmptyComponent={
          deals === null ? (
            <Loading />
          ) : (
            <Empty art="burst" title="No deals yet" body="Know one? Post it for everyone." />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { padding: 22, gap: 14 },
  row: { flexDirection: 'row', gap: 8 },
});

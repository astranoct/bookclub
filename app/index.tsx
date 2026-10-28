import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { getCurrentUser } from '@/services/appwrite';

export default function Index() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    getCurrentUser().then((user) => setSignedIn(user !== null));
  }, []);

  if (signedIn === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.accentLight} />
      </View>
    );
  }

  return <Redirect href={signedIn ? '/search' : '/login'} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

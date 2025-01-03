
import { Link, Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { client, appWriteController } from '@/services/appWriteController';
import React from 'react';
import { ThemedText } from '@/components/ThemedText';

export default function HomeScreen() {

  const [redirect, setRedirect] = useState(<> </>);

  useEffect(() => {
    appWriteController.checkSession(client).then((res) => {
      console.log('res', res);
      setRedirect(res ? <Redirect href="/search" /> : <Redirect href="/login" />);
    });
  } , []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
      <ThemedText>{redirect}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
import { StyleSheet, Image, Platform, Button, TextInput } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useEffect, useState } from 'react';
import { client, appWriteController } from '@/services/appWriteController';
import { Link } from 'expo-router';

export default function TabTwoScreen() {

  const { registerAnonymousUser, registerUser, login, logout, checkSession } = appWriteController;
  const [uid, setUid] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    checkSession(client).then((response) => {
      if (response) {
        setUid(response.$id);
      }
    });
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <Link style={styles.link} replace href="/">/index</Link>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Login</ThemedText>
      </ThemedView>
      <ThemedText>Account functionality testing page.</ThemedText>
      <ThemedText>Current user ID: {uid}</ThemedText>
      <Collapsible title="Anonymous Login">
        <Button
          title="Login"
          onPress={() => {
            registerAnonymousUser(client).then((response) => {
              setUid(response.$id);
            });
          }}
        />
      </Collapsible>
      <Collapsible title="Create Account">
        <TextInput
          placeholder="Email"
          onChangeText={setEmail}
          value={email}
        />
        <TextInput
          placeholder="Password"
          onChangeText={setPassword}
          value={password}
          secureTextEntry
        />
        <Button
          title="Register"
          onPress={() => {
            registerUser(client, email, password).then((response) => {
              setUid(response.$id);
            });
          }}
        />
      </Collapsible>
      <Collapsible title="Login">
        <TextInput
          placeholder="Email"
          onChangeText={setEmail}
          value={email}
        />
        <TextInput
          placeholder="Password"
          onChangeText={setPassword}
          value={password}
          secureTextEntry
        />
        <Button
          title="Login"
          onPress={() => {
            login(client, email, password).then((response) => {
              setUid(response.$id);
            });
          }}
        />
      </Collapsible>
      <Collapsible title="Logout">
        <Button
          title="Logout"
          onPress={() => {
            logout(client).then(() => {
              setUid('null');
            });
          }}
        />
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  link: {
    color: 'white',
    textDecorationLine: 'underline',
    backgroundColor: 'black',
    padding: 8,
    width: 85,
  }
});

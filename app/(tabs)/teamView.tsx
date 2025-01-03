import { Image, StyleSheet, TextInput, Button } from 'react-native';
import { useEffect, useState } from 'react';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { appWriteController } from '@/services/appWriteController';
import { BookData } from '@/types/BookData';

const bookNotFound = {
  title: '',
  author: '',
  coverId: '',
  pageCount: 0,
  publishDate: '',
  ratingsAverage: 0,
} as BookData;

export default function TeamView() {

  const [teamId, setTeamId] = useState('');
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [teamBook, setTeamBook] = useState({} as BookData);

  useEffect(() => {
    const fetchTeamData = async () => {
      const teamId = await appWriteController.getTeamId();
      console.log('TeamID', teamId);
      setTeamId(teamId);

      if (teamId !== 'No teams found') {
        const teamMembers = await appWriteController.getTeamMembers(teamId);
        console.log('Team Members', teamMembers);
        setTeamMembers(teamMembers.memberships.map((member: any) => member.userName));

        const teamPreferences = await appWriteController.getTeamPreferences(teamId);
        console.log('TeamPreferences', teamPreferences);
        if (teamPreferences.currentBook) {
          setTeamBook(teamPreferences.currentBook);
        }
        else {
          setTeamBook(bookNotFound);
        }
      }
    };

    fetchTeamData();
  }, []);

  if (teamId.length !== 20) {
    return (
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">You are not in any bookclubs.</ThemedText>
        <ThemedText type="default">Enter a club ID below</ThemedText>
        <TextInput
          style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
          onChangeText={text => setTeamId(text)}
          value={teamId}
          onSubmitEditing={() => setTeamId('')}
        />
        <Button
          title="Make Club"
          onPress={() => {
            appWriteController.createTeam(teamId).then((res) => {
            console.log('Created team', res);
            setTeamId(res.$id);
            });
          }
          }
        />
      </ThemedView>
    );
  }
  else {
    return (
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">You are in group {teamId}.</ThemedText>
        <ThemedText type="default">Here are the members:</ThemedText>
        {teamMembers.map((member) => {
          return (
            <ThemedText type="default" key={member}>{member}</ThemedText>
          );
        })}
        <ThemedText type="default">Yall are reading the book:</ThemedText>
        <Image source={{ uri: `https://covers.openlibrary.org/b/id/${teamBook.coverId}-L.jpg` }} style={styles.coverPreview} />
        <ThemedText type="default">{teamBook.title}</ThemedText>
        <ThemedText type="default">By: {teamBook.author}</ThemedText>
        <ThemedText type="default">Published: {teamBook.publishDate}</ThemedText>
        <ThemedText type="default">Page Count: {teamBook.pageCount}</ThemedText>
        <ThemedText type="default">Average Rating: {teamBook.ratingsAverage}</ThemedText>
        
        <Button
          title="Update Book Shown"
          onPress={() => {
            appWriteController.getTeamPreferences(teamId).then((res) => {
              setTeamBook(res.currentBook);
            });
          }}
        />
      </ThemedView>
    );
  }
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    margin: 12,
  },
  coverPreview: {
    height: 100,
    resizeMode: 'contain',
  },
});
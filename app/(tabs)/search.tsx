import { Image, StyleSheet, TextInput, Button } from 'react-native';
import { useEffect, useState } from 'react';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { searchForBook } from '@/services/openLibrary';
import { Link } from 'expo-router';
import { BookData } from '@/types/BookData';
import { SearchResult } from '@/types/searchResult';
import React from 'react';
import { appWriteController } from '@/services/appWriteController';

export default function BookSearch() {

  const defaultBookData = {
    title: 'No Book Selected',
    author: 'No one',
    coverId: '',
    pageCount: 0,
    publishDate: '',
    ratingsAverage: 0,
  } as BookData;

  const [bookCover, setBookCover] = useState(require('@/assets/images/partial-react-logo.png'));
  const [searchTitle, setSearchTitle] = useState('');
  const [bookData, setBookData] = useState(defaultBookData);
  const [possibleResults, setPossibleResults] = useState([] as BookData[]);
  const [possibleResultsList, setPossibleResultsList] = useState([] as JSX.Element[]);
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [teamId, setTeamId] = useState('');

  function updateTeamId() {
    return appWriteController.getTeamId().then((teamId) => {
      setTeamId(teamId);
    });
  }

  useEffect(() => {
    updateTeamId();
  }, []);

  function submitSearch() {
    setSearchSubmitted(true);
    searchForBook(searchTitle).then((response: SearchResult) => {
      setBookCover({ uri: `https://covers.openlibrary.org/b/id/${response.mostLikelyResult.coverId}-L.jpg` });
      setBookData(response.mostLikelyResult);
      setPossibleResults(response.possibleResults);
    });
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#FFFFFF', dark: '#000000' }}
      headerImage={
        <Image
          source={bookCover}
          style={styles.reactLogo}
        />
      }>
      {bookData.title === 'No Book Selected' ? <ThemedText type="title">No Book Selected</ThemedText> : <>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{`${bookData.title}`}</ThemedText>
      </ThemedView>
      <ThemedText type="subtitle">{`by ${bookData.author}`}</ThemedText>
      <ThemedText type="default">{`Pages: ${bookData.pageCount}`}</ThemedText>
      <ThemedText type="default">{`Published: ${bookData.publishDate}`}</ThemedText>
      <ThemedText type="default">{`Average Rating: ${bookData.ratingsAverage}`}</ThemedText>
      <Button
        title="Set as Club Book"
        onPress={() => {
          updateTeamId().then(() => {
            appWriteController.setTeamPreferences(teamId, bookData).then((res) => {
              console.log('Updated book', res);
            });
          });
        }}
      />
      {possibleResults.length > 0 && <Button
        title="Wrong book?"
        onPress={() => {
          setPossibleResultsList(possibleResults.map((bookData: BookData, index) => {
            return (
              <ThemedView key={`${index}:${bookData.title}`}>
                <ThemedText type="default">{`${bookData.title}`}</ThemedText>
                <ThemedText type="default">{`by ${bookData.author}`}</ThemedText>
                <Button
                  title="Select"
                  onPress={() => {
                    setBookCover({ uri: `https://covers.openlibrary.org/b/id/${bookData.coverId}-L.jpg` });
                    setBookData(bookData);
                    setPossibleResults([]);
                    setPossibleResultsList([]);
                  }}
                />
              </ThemedView>
            );
          }));
        }
        }
      />}
      {possibleResultsList}
      </>}
      {!searchSubmitted && <>
      <ThemedView style={styles.stepContainer}>
        <ThemedView style={{ borderBottomColor: 'gray', borderBottomWidth: 2, marginVertical: 8 }} />
        <ThemedText type="default">Search for a book title below</ThemedText>
        <TextInput
          style={{
            height: 40,
            borderColor: 'gray',
            borderWidth: 1,
            marginVertical: 8,
            backgroundColor: 'white',
            color: 'black',
          }}
          onChangeText={text => setSearchTitle(text)}
          value={searchTitle}
          onSubmitEditing={() => submitSearch()}
        />
        <Button
          title="Search"
          onPress={() => {submitSearch()}}
        />
      </ThemedView>
      </>}
      <Link href="/login" style={{borderColor:'black',fontWeight:'800'}}>To Dev Panel</Link>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: '100%',
    resizeMode: 'contain',
    marginTop: 8,
  },
});

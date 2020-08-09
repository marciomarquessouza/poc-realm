import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  FlatList,
} from 'react-native';
import Realm from 'realm';
import { POSTS_SCHEMA_NAME, PostsSchema } from '../models/schema';

const databaseOptions: Realm.Configuration = {
  path: 'realmT4.realm',
  schema: [PostsSchema],
  schemaVersion: 0,
};

interface IPost {
  id: number;
  userId: number;
  title: string;
  body: string;
}

interface IPostsState {
  size: number;
  posts: IPost[];
  runTime: number;
  searchText: string;
  searchID: number;
  updateBody: string;
  isLoading: boolean;
}

const parsePost = (post: IPost): IPost => ({
  id: post.id,
  userId: post.userId,
  title: post.title,
  body: post.body,
});

export const Posts = () => {
  const [state, setState] = useState<IPostsState>({
    size: 0,
    posts: [],
    runTime: 0,
    searchText: '',
    updateBody: '',
    isLoading: false,
    searchID: 0,
  });

  useEffect(() => {
    setState({ ...state, isLoading: true });
    Realm.open(databaseOptions).then((realm) => {
      setState({
        ...state,
        size: realm.objects(POSTS_SCHEMA_NAME).length,
        isLoading: false,
      });
    });
  }, []);

  const fetchPosts = async () => {
    try {
      const startTime = new Date().getTime();
      setState({ ...state, isLoading: true });
      const posts: IPost[] = await fetch(
        'https://jsonplaceholder.typicode.com/posts',
      )
        .then((response) => response.json())
        .then((posts) => posts);

      Realm.open(databaseOptions).then((realm) => {
        realm.write(() => {
          posts.forEach((post) => {
            if (
              !realm.objects(POSTS_SCHEMA_NAME).filtered(`id=${post.id}`).length
            ) {
              realm.create(POSTS_SCHEMA_NAME, post);
            }
          });
          const endTime = new Date().getTime();
          setState({
            ...state,
            size: realm.objects(POSTS_SCHEMA_NAME).length,
            runTime: endTime - startTime,
            isLoading: false,
          });
        });
      });
    } catch (error) {
      console.error('Bad news: ', error.message);
    }
  };

  const getPosts = () => {
    const startTime = new Date().getTime();
    setState({ ...state, isLoading: true });
    Realm.open(databaseOptions)
      .then((realm) => {
        const result = realm.objects<IPost>(POSTS_SCHEMA_NAME);
        const posts: IPost[] = result.map((post: IPost) => parsePost(post));
        const endTime = new Date().getTime();
        setState({
          ...state,
          posts,
          isLoading: false,
          runTime: endTime - startTime,
        });
      })
      .catch((error) => console.error('Bad news: ', error));
  };

  const gestPostById = () => {
    const startTime = new Date().getTime();
    setState({ ...state, isLoading: true });
    try {
      Realm.open(databaseOptions).then((realm) => {
        const result = realm
          .objects<IPost>(POSTS_SCHEMA_NAME)
          .filtered(`id=${state.searchID}`);
        const posts = result.map((post) => parsePost(post));
        const endTime = new Date().getTime();
        setState({
          ...state,
          posts,
          isLoading: false,
          runTime: endTime - startTime,
        });
      });
    } catch (error) {
      console.error('Bad news: ', error);
    }
  };

  const gestPostByTitle = () => {
    const startTime = new Date().getTime();
    setState({ ...state, isLoading: true });
    try {
      Realm.open(databaseOptions).then((realm) => {
        const result = realm
          .objects<IPost>(POSTS_SCHEMA_NAME)
          .filtered(`title LIKE "*${state.searchText}*"`);
        const posts = result.map((post) => parsePost(post));
        const endTime = new Date().getTime();
        setState({
          ...state,
          posts,
          isLoading: false,
          runTime: endTime - startTime,
        });
      });
    } catch (error) {
      console.error('Bad news: ', error);
    }
  };

  const clearAllPosts = () => {
    const startTime = new Date().getTime();
    setState({ ...state, isLoading: true });
    Realm.open(databaseOptions).then((realm) => {
      realm.write(() => {
        const posts = realm.objects(POSTS_SCHEMA_NAME);
        realm.delete(posts);
        const totalPosts = realm.objects(POSTS_SCHEMA_NAME).length;
        const endTime = new Date().getTime();
        setState({
          ...state,
          runTime: endTime - startTime,
          size: totalPosts,
          isLoading: false,
          posts: [],
        });
      });
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Database Size: {state.size}</Text>
      <Text style={styles.title}>Runtime: {state.runTime}</Text>
      <Text style={styles.title}>
        Loading: {state.isLoading ? 'yes' : 'no'}
      </Text>

      <View style={styles.buttonStyle}>
        <Button title="Fetch Posts" onPress={fetchPosts} />
      </View>
      <View style={styles.buttonStyle}>
        <Button title="Get All Posts" onPress={getPosts} />
      </View>
      <View style={styles.buttonStyle}>
        <Button title="Clear All Posts" onPress={clearAllPosts} />
      </View>
      <View>
        <Text>Search By ID</Text>
        <TextInput
          placeholder="Post ID"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="number-pad"
          value={`${state.searchID}`}
          onChangeText={(searchID) =>
            setState({
              ...state,
              searchID: parseInt(searchID.replace(/[^0-9\.]+/g, '')) || 0,
            })
          }
          style={{ borderWidth: 1, padding: 5 }}
        />
        <Button title="Search By ID" onPress={gestPostById} />
      </View>
      <View>
        <Text>Search By Title</Text>
        <TextInput
          placeholder="Post Title"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(searchText) => setState({ ...state, searchText })}
          style={{ borderWidth: 1, padding: 5 }}
        />
        <Button title="Search By Title" onPress={gestPostByTitle} />
      </View>
      {!!state.posts.length && (
        <View>
          <FlatList
            data={state.posts}
            keyExtractor={({ id }) => `${id}`}
            renderItem={({ item, index }) => (
              <View key={index}>
                <Text>Title: {item.title}</Text>
                <Text>Body: {item.body}</Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    margin: 10,
  },
  title: {
    fontSize: 16,
  },
  buttonStyle: {
    marginVertical: 6,
  },
});

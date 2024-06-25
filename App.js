import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, Image, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Home from './Screens/Home'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native';
import Paywall from './Screens/Paywall';
import TestHome from './Screens/TestHome';
import EnterLink from './Screens/EnterLink';
import Tutorials from './Screens/Tutorials';

export default function App() {
  const Stack = createNativeStackNavigator()
  const {width, height} = useWindowDimensions()
  return(
    <NavigationContainer>
    <Stack.Navigator
    screenOptions={{
      headerShown:false,
      backgroundColor:'transparent',
      borderTopWidth: 0,
      }}
      initialRouteName="TestHome"
      >
        <Stack.Screen name="Tutorials" component={Tutorials} />
        <Stack.Screen name="TestHome" component={TestHome} />
        <Stack.Screen name="EnterLink" component={EnterLink} />
        
        <Stack.Screen name="home" component={Home} />
        <Stack.Screen name="Paywall" component={Paywall} />
      </Stack.Navigator>
      </NavigationContainer>

      
  );
}



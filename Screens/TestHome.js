import React from 'react'
import { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, AppState, Text, TouchableOpacity, View, useWindowDimensions, Image, Linking, ActivityIndicator, ScrollView, Alert, TextInput, Platform } from 'react-native';
import tw from 'twrnc';
import {useIsFocused} from '@react-navigation/native'
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useRevHook from '../Components/useRevHook';
import { Audio, RecordingOptionsPresets, IOSOutputFormat, IOSAudioQuality } from 'expo-av';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import { Foundation } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import Purchases from 'react-native-purchases'
import Spinner from 'react-native-loading-spinner-overlay'
import { Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MotiView, MotiText } from 'moti';
import { Easing } from 'react-native-reanimated';
import { Entypo } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';


export default function TestHome({navigation}) {
    const {isProMember} = useRevHook()
    const [usageCount, setUsageCount] =useState()
    const {width, height} = useWindowDimensions()
    const [spinner, setSpinner] = useState(false)
    const isFocused = useIsFocused()

    useEffect(()=> {
        
        console.log("checking usage")
        async function fetchData(){
            try{
                await getUsageData()
            } catch (error){
                console.error("Error Fetching Data", error)
            }
        }
        fetchData()
        
    }, [isFocused])

    async function getUsageData(){
        try{
          const value = await AsyncStorage.getItem('usage')
          
          if(value != null){
            console.log("Value Found", value)
            setUsageCount(Number(value))
          } else {
            createUsageData(15)
          }
    
        }catch(error){
          console.error("Error getting data", error)
        }
    
      }

    async function restorePurchases(){
        setSpinner(true)
        const purchaserInfo = await Purchases.restorePurchases().catch((error)=> {
          setSpinner(false)
        })
    
        if(purchaserInfo.activeSubscriptions.length > 0){
          Alert.alert("Success", "Your purchase has been restored")
          setSpinner(false)
          navigation.navigate('TestHome')
        } else {
          Alert.alert("Error", "No purchases to restore")
          setSpinner(false)
        }
    
        if(!currentOffering){
          return(
            <View>
              <ActivityIndicator size="large" color='white' />
            </View>
          )
        }
      }

      async function saveUsageData(value){
        try{
        await AsyncStorage.setItem("usage", String(value))
        getUsageData()
        } catch(error){
          console.error("Error storing data", error)
        }
      }
  
      async function createUsageData(value){
        try{
          await AsyncStorage.setItem("usage", String(value))
          getUsageData()
          } catch(error){
            console.error("Error storing data", error)
          }
      }
      
      function handleNavigationLink(){
        if(!isProMember){
            if(usageCount <= 0){
                navigation.navigate("Paywall")
            } else {
                navigation.navigate('EnterLink')
            }
        } else{
            navigation.navigate('EnterLink')
        }

      }

      function handleNavigationRecord(){
        if(!isProMember){
            if(usageCount <= 0){
                navigation.navigate("Paywall")
            } else {
                navigation.navigate('home')
            }
        } else{
            navigation.navigate('home')
        }
      }

      async function openPrivacy(){
        await Linking.openURL('http://flourishapp.netlify.app/ai-spy')
      }
  
      async function openAgreement(){
        await Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')
      }
    

  return (
    <View style={[tw`bg-black`, {width:width, height:height}]}>
        
        <MotiView from={{scale:0}} animate={{scale:1}} style={tw`flex-col items-center mt-15`}>
        <Image style={[tw``,{height:80, width:100}]} source={require('../assets/image0.png')} />
        <Text style={tw`text-white text-center font-bold text-2xl`}>Ai-SPY</Text>
        <Text style={tw`text-white text-center italic font-light text-lg`}>AI Speech Detection</Text>
        </MotiView>
        
        <View style={tw`flex-1 flex-row items-start justify-between mx-1 mt-5`}>
            <MotiView from={{scale:0}} animate={{scale:1}}>
            <TouchableOpacity onPress={()=> handleNavigationLink()} style={[tw`bg-slate-900 justify-start items-center pt-5 h-50 rounded-2xl`,{width:width/2.2}]}>
            <Entypo name="link" size={70} style={tw`items-center`} color="orange" />
                    <Text style={tw`text-white text-center mt-4 font-bold`}>Enter Social Media Link</Text>
                    <Text style={tw`text-white text-center text-xs italic  mx-2 font-light`}>Analyze social media content to see if it contains AI</Text>
                    

            </TouchableOpacity>
            </MotiView>
            <MotiView from={{scale:0}} animate={{scale:1}}>
            
            <TouchableOpacity onPress={()=> handleNavigationRecord()} style={[tw`bg-slate-900 justify-start items-center pt-5 h-50 rounded-2xl`,{width:width/2.2}]}>
            <Entypo name="sound" size={60} style={tw`p-3`} color="orange" />
                    <Text style={tw`text-white text-center font-bold`}>Record A Sound</Text>
                    <Text style={tw`text-white text-center text-xs italic  font-light mx-2`}>Record a clip to see if it contains AI</Text>

            </TouchableOpacity>
            </MotiView>
            
          
        
        
      </View>
      <MotiView  from={{scale:0}} animate={{scale:1}} style={tw`flex-1.2 justify-start`}>
          
          {!isProMember && 
          <>
          {(usageCount || usageCount === 0) && <Text style={tw`text-white text-center mt-4 text-lg`}>{usageCount <= 0 ? 0 : usageCount} Free Submissions Remaining</Text>}
          <TouchableOpacity onPress={()=> navigation.navigate("Paywall")} style={[tw` p-3 rounded-2xl mx-15 items-center mt-2`, {backgroundColor:"#fdc689"}]}>
            <Text style={tw`font-bold`}>Upgrade Now</Text>
          </TouchableOpacity>
          </>
          }
       
          <TouchableOpacity onPress={()=> openPrivacy()} style={tw`mt-5`}>
            <Text style={tw`text-stone-400 font-light text-center`}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=> openAgreement()} style={tw`mt-4`}>
            <Text style={tw`text-stone-400 font-light text-center`}>User Agreement</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => restorePurchases()} style={tw`flex-col mb-5 mt-4  rounded-2xl  `}>
                <Text style={tw`text-stone-400 font-light text-center`}>Restore Purchases</Text>
                
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:ss@ai-spy.xyz')} style={tw`flex-col mb-5 mt-4  rounded-2xl  `}>
                <Text style={tw`text-white font-light text-center`}>Contact Us</Text>
                
          </TouchableOpacity>
          
          </MotiView>
    </View>
  )
}
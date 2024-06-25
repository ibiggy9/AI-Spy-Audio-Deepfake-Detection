import React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, AppState, Text, TouchableOpacity, View, useWindowDimensions, Image, Linking, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
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
import { CurveType, LineChart } from 'react-native-gifted-charts';
//import { LineChart } from 'react-native-chart-kit';
import { MotiView, MotiText } from 'moti';
import { Easing } from 'react-native-reanimated';
import { Entypo } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/core';
import * as Progress from 'react-native-progress';
import Config from 'react-native-config'
import analytics from '@react-native-firebase/analytics';

const _size  = 300
const _color = '#5C7693'

export default function EnterLink({navigation}) {
    const clipboardContentRef = useRef('');
    const [link, setLink] = useState("")
    const [websocket, setWebsocket] = useState()
    const [errorMessage,setErrorMessage]= useState()
    const {width, height} = useWindowDimensions()
    const [file, setFile] = useState()
    const [displayError, setDisplayError] = useState()
    const screenWidth = Dimensions.get('window').width;
    const [estimatedDuration, setEstimatedDuration] = useState()
    const [fileName, setFileName] = useState()
    const [fileSize, setFileSize] = useState()
    const appState = useRef(AppState.currentState)
    const [appStateVisible, setAppStateVisible] = useState(appState.current)
    const [submitted, setSubmitted] = useState(false)
    const [prediction, setPrediction] = useState()
    const [loading, setloading] = useState(false)
    const [usageCount, setUsageCount] = useState()
    const abortControllerRef = useRef(null)
    const {isProMember, currentOffering} = useRevHook()
    const [viewDataPoint, setViewDataPoint] = useState(false)
    const [data, setData]= useState()
    const [aiReport, setAiReport] = useState(false)
    const [animateState, setAnimateState] = useState(false)
    const [activeDotIndex, setActiveDotIndex] = useState()
    const [loadingMessage, setLoadingMessage] = useState()
    const [checkingSize, setCheckingSize] = useState()
    const [doneReport, setDoneReport] = useState(false)
    const [progress, setProgress] = useState(0);
    const [intervalId, setIntervalId] = useState(null);
    const [modelResults, setModelResults ] = useState()
    const [tooltipData, setTooltipData] = useState(null);
    const [smoothData, setSmoothData] = useState()
    const [dataSelectToggle, setDataSelectToggle] = useState()
    const [selectedData, setSelectedData] = useState(null)
    const apiKey = Config.API_KEY



    useEffect(()=>{

      console.log("loggin event")
      analytics().logEvent('test_event', {
        id: 123,
        description: 'example description',
      })
    }, [link])
    

    useEffect(() => {
      
      if (prediction && intervalId === null) {
        let secondsPassed = 0;
        const id = setInterval(() => {
          secondsPassed += 1;
          setProgress(secondsPassed / 18);
  
          if (secondsPassed >= 18) {
            clearInterval(id);
            setIntervalId(null);
          }
        }, 1000);
        setIntervalId(id);
      }
  
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }, [prediction, intervalId]);
    
    
    useEffect(()=> {
      console.log("logging event")
      
      console.log("checking usage")
      async function fetchData(){
          try{
              await getUsageData()
          } catch (error){
              console.error("Error Fetching Data", error)
          }
      }
      fetchData()
      
  }, [])
  
  
  // Usage:

  


  

    function runPredictionWebSocket() {
      setloading(true)
      const handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          ws.close();
          console.log('WebSocket Closed due to app going to background');
        }
      };

      
    
      AppState.addEventListener('change', handleAppStateChange);
      const ws = new WebSocket('wss://api-mobile-app-aispy-6oedxiv3iq-ue.a.run.app/neural/ws');
      
      ws.onopen = () => {
        console.log('WebSocket Connected');

        ws.send(link);
      };
    
      ws.onmessage = (e) => {
        //console.log('Message from server:', e.data);
        
      
        try {
          const response = JSON.parse(e.data)
          // Try to parse the message as JSON
          setModelResults(response)
          

          
          if(typeof(response) == 'object'){
            
            setPrediction(response.prediction)
            if(!isProMember){
              saveUsageData(usageCount-1)
              }
            written(response) 
            
            const chunkResults = response.Results.chunk_results;
            setData(chunkResults.map((result) => ({
              value: parseFloat(result.Probability_ai.slice(0, -1)), // Remove the '%' and convert to number
              dataPointText: `${parseFloat(result.Probability_ai.slice(0, -1)).toFixed(0)}%`,
              label: result.chunk.toString(),
              meta: {
                confidence: result.confidence,
                prediction: result.prediction,
              },
            })))
            console.log("overall trend")
            overallTrend(response)

            /*
            This is for Chart Kit
            const chunks = response.Results.chunk_results.map(result => result.chunk);
            const probabilities = response.Results.chunk_results.map(result => parseFloat(result.Probability_ai.slice(0, -1)));
            const confidence = response.Results.chunk_results.map(result => result.confidence)
            const predictions = response.Results.chunk_results.map(result => result.prediction)
            const chartWidth = chunks.length * 25;
            console.log("chunks" + chunks)
            console.log("probs" + probabilities)
            console.log("confidence" + confidence)
            console.log("predictions" + predictions)
            console.log("chart" + chartWidth)
            
            
             
            setData({
              labels: chunks,
              chartWidth: chartWidth,
              datasets: [
                {
                    confidence: confidence,
                    prediction: predictions,
                    data: probabilities,
                    color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                    strokeWidth: 2,
                    
                }
              ]
          });


           */
           
          setloading(false)
          console.log("loading false")
          } else {
            setLoadingMessage(response)
          }
          
          
        } catch (error) {
          console.log(error)
          // If parsing fails, treat the message as plain text and set loading content
          setLoadingMessage(e.data);
        }
      };
    
      ws.onerror = (e) => {
        console.error('WebSocket Error:', e);
      };
    
      ws.onclose = () => {

        /* Bad Idea, loops and re runs working links
        if(reattemptRef.current <= 10){
          runPredictionWebSocket()
          console.log(reattemptRef.current)
          reattemptRef.current = reattemptRef.current + 1
        }
        navigation.goBack()
        */
       if(!prediction){
        setloading(false)
        setErrorMessage("There was an error please try again.")
       }
       
        console.log('WebSocket Disconnected');
      };
    
      // Return cleanup function
      setWebsocket(ws)
    }

    useEffect(() => {
      return () => {
        if (websocket) {
          websocket.close();
        }
      };
    }, [websocket]);
  
   
    
    useKeepAwake()
    useEffect(() => {
      
        // Trigger the animation
        setAnimateState(true);
    
        // Revert after a little delay to reset the animation state
        const timer = setTimeout(() => setAnimateState(false), 50); // 50ms should be enough
    
        return () => clearTimeout(timer); // Cleanup on unmount or if the effect runs again
    }, [viewDataPoint]);

    const chartConfig = {
        backgroundColor: 'black',
        backgroundGradientFrom: 'black',
        backgroundGradientTo: 'black',
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        strokeWidth: 5,
        barPercentage: 0.9,
        useShadowColorFromDataset: false,
        
      };

      useEffect(() => {
      
        const subscription = AppState.addEventListener('change', nextAppState => {
          if (
            appState.current.match(/inactive|background/) && 
            nextAppState === 'active'
            
          ) {
            console.log('App has come to the foreground!');
          } else{
            console.log("App has gone to the background.")
          }
    
          appState.current = nextAppState;
          setAppStateVisible(appState.current);
          //console.log(appState.current) 
        });
    
        return () => {
          subscription.remove();
        };
      }, []);

      useEffect(()=> {
        console.log(AppState.currentState)
        if(AppState.currentState != 'active' && loading == true){
          cancelRun()
        }
      },[AppState.currentState])

      useEffect(()=> {
        getUsageData()
  
        
      }, []) 

      async function clearFile(){
        setLink("")
        setViewDataPoint()
        setFile()
        setFileName()
        setloading(false)
        setFileSize()
        setPrediction()
        setData()
        cancelRun()
        setDisplayError()
        setSubmitted(false)

      }
      
      async function written(predictionChunks) {
        setDoneReport(false)
        const url = 'url-to-api'; // Replace with your API's URL
        //const token = 'YOUR_AUTH_TOKEN'; // Replace with your actual token
      
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
         // Sending the token in the header
            },
            body: JSON.stringify(predictionChunks?.Results.chunk_results),
          });
      
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
      
          const data = await response.json();
          setDoneReport(true)
          setAiReport(data)
          return data;
        } catch (error) {
          console.error('Error fetching data: ', error);
        }
      }
      
    

function cancelRun(){
    abortControllerRef.current && abortControllerRef.current.abort()
    setloading(false) 
    setDisplayError("Request Cancelled. Please don't leave the app while it is loading. Please try again")
  }

  async function openPrivacy(){
    await Linking.openURL('http://flourishapp.netlify.app/ai-spy')
  }

  async function openAgreement(){
    await Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')
  }

  async function getUsageData(){
    try{
      const value = await AsyncStorage.getItem('usage')
      
      if(value != null){
        console.log("Value Found", value)
        setUsageCount(Number(value))
      } else {
        createUsageData(10)
      }

    }catch(error){
      console.error("Error getting data", error)
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

  useEffect(()=> {
    setErrorMessage()
    setCheckingSize(false)
    
    if(link.length > 25){
      if(link.includes("x.com")){
        setFileSize(3.25)
      } else if(link.includes("twitter.com")){
        setFileSize(3.25)
      }else{
      checkSize()
      }
    }
  }, [link])

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes} minutes & ${remainingSeconds} seconds `;
  }

  async function checkSize() {
    
    setCheckingSize(true)
    console.log("checking size")
    setEstimatedDuration()
    setFileSize()
    setErrorMessage()
    abortControllerRef.current = new AbortController();
    console.log('Link:', link);
    try {
      const url = new URL('link-to-api');
      url.searchParams.append('link', link);
  
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(response)
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}, Body: ${errorText}`);
      }
  
      const result = await response.json();
     
      setCheckingSize(false)
      console.log(result)
      if(result.file_size_mb){
      const size = parseFloat(result.file_size_mb)
      console.log(size)
      if(size > 28){
        setCheckingSize(false)
        setErrorMessage(`File size is ${size}MB & exceeds 28MB limit.`)
      } else {
      const estimatedSeconds = size*12.6
      setEstimatedDuration(formatTime(estimatedSeconds))
      setFileSize(result.file_size_mb)
      if(result.file_size_mb > 15){}
      }
      } else {
        setErrorMessage("Please enter a valid URL")
        setCheckingSize(false)
      }
    }catch (error) {
      setCheckingSize(false)
      console.error('Error during fetch operation:', error.message);
    }
    
  }

  function overallTrend(dataContainer, numberOfPoints = 12) {
    // First, retrieve the chunk_results array from the dataContainer object
    const dataPassed = dataContainer.Results.chunk_results;
  
    // Check if dataPassed is an array and has elements
    if (!Array.isArray(dataPassed) || dataPassed.length === 0) {
      console.error("Invalid or empty dataPassed array");
      return []; // Return an empty array or handle as needed
    }
  
    const segmentSize = Math.floor(dataPassed.length / numberOfPoints);
    const trendData = [];
  
    for (let i = 0; i < numberOfPoints; i++) {
      let sum = 0;
      let count = 0;
      const start = i * segmentSize;
      let end = (i + 1) * segmentSize;
  
      if (i === numberOfPoints - 1) {
        end = dataPassed.length; // Ensure we include all remaining data points in the last segment
      }
  
      for (let j = start; j < end; j++) {
        if (dataPassed[j]) { // Check if the data point exists
          sum += parseFloat(dataPassed[j].Probability_ai.slice(0, -1)); // Remove '%' and parse to float
          count++;
        }
      }
  
      const average = sum / (count || 1); // Avoid division by zero
      const midPoint = Math.floor((start + end - 1) / 2);
  
      if (dataPassed[midPoint]) { // Check if the midpoint data exists
        trendData.push({
          value: average,
          dataPointText: `${average.toFixed(2)}%`,
          label: dataPassed[midPoint].chunk.toString(),
          meta: {
            confidence: dataPassed[midPoint].confidence,
            prediction: dataPassed[midPoint].prediction,
          },
        });
      } else {
        console.error(`No data at midpoint index: ${midPoint}`);
      }
    }
  
    console.log(trendData);
    setSmoothData(trendData);
  }

  function viewSmoothData(){
    console.log("this ran")    
    setSelectedData(smoothData)
    
    
  }

  function rawData(){
    setSelectedData(null)
  }


  return (
    <View style={[tw`bg-black`, {width:width, height:height}]}>
    {!data ?
    <>
        
    {!loading ?
    <View style={tw`flex-1 mt-15 flex-col items-center justify-center`}>
    <View style={tw`flex-col items-center justify-center`}>
        <MotiText from={{scale:0}} animate={{scale:1}} style={tw`text-white text-3xl font-bold `}>Ai-SPY</MotiText>
        <MotiText from={{scale:0}} animate={{scale:1}} style={tw`text-slate-300 italic`}>AI Speech Detection</MotiText>
      </View>
    
    <View style={tw`flex-1  justify-start items-center`}>
      
    <View style={tw`flex-row items-center justify-center`}>
      
    <Feather name="link" size={30} color="orange" />
    
    <Text style={tw`text-white mt-5  text-2xl mb-2`}> Enter Social Media Link</Text>
    </View>
    <Text style={tw`text-slate-300 mx-10 mb-5 text-sm font-light italic text-center`}>Copy/paste a link from social media & check if it contains AI.</Text>
    <View style={tw`flex-row items-baseline`}>
      {link.length > 2 &&
      <TouchableOpacity onPress={()=> clearFile()}>
    <AntDesign name="closecircle" style={tw`mr-2 pb-2`} size={24} color="white" />
    </TouchableOpacity>
    }
    <TextInput
    style={[tw`w-90 h-10 mb-2 text-white border-b border-white`, {fontSize:17}]}
    value={link}
    onChangeText={setLink}
    autoFocus
    
    />
    
    </View>
    
    {checkingSize &&
    <View>
    <ActivityIndicator size={'large'} color="gray" />
    <Text style={tw`text-white font-light text-center mx-5 mb-3 italic`} >Estimating analysis duration...</Text>
    </View>
    }
    {estimatedDuration &&<Text style={tw`text-white font-light text-center mx-2 mb-3 italic`} >Estimated Time To Analyze: {estimatedDuration}</Text>}
    {fileSize && <Text style={tw`text-white font-light text-center mx-5 mb-3 italic`} >File Size: {fileSize}Mb</Text>}

    {!errorMessage && fileSize && fileSize < 28 &&
    <TouchableOpacity onPress={()=> runPredictionWebSocket()} style={tw`mb-5 border border-white px-10 rounded-2xl py-2`}>
      <MotiText from={{scale:0}} animate={{scale:1}} style={tw`text-white text-lg font-bold`}>Run</MotiText>
    </TouchableOpacity>
    
  
    }

    {errorMessage == "There was an error please try again." &&
    <TouchableOpacity onPress={()=> runPredictionWebSocket()} style={tw`mb-5 border border-white px-20 rounded-2xl py-5`}>
      <MotiText from={{scale:0}} animate={{scale:1}} style={tw`text-white text-xl`}>Try Again</MotiText>
    </TouchableOpacity>
    
    }

    {errorMessage &&
    <Text style={tw`text-red-500 mt-2 text-center mb-5`}>{errorMessage}</Text>
    }
    
    <Text style={tw`text-slate-300 font-bold mx-20 text-center text-lg`}>Suported Link Sources: </Text>
    <Text style={tw`text-slate-300 font-light mx-20 text-center`}>Tik Tok, Youtube (Shorts Excluded)</Text>
    <Text style={tw`text-slate-300 font-bold mx-20 text-center text-lg mt-3`}>Note: </Text>
    <Text style={tw`text-slate-300 font-light mx-20 text-center `}>X/Twitter, Facebook & Instagram Are Not Currently Supported</Text>
    {/*
    <TouchableOpacity onPress={()=> navigation.navigate("Tutorials")}>
    <Text style={tw`text-white mt-10`}>How do I copy Social Media Links? </Text>
    </TouchableOpacity>
     */}
    </View>
    </View>
    :
    <View style={tw`flex-1 mt--15 justify-center items-center`}>
          <View style={tw`flex-col mb-3`}>
          <Text style={tw`text-white text-2xl font-bold mb-3`}>Loading...</Text>

          <ActivityIndicator  size="large" color="white" />
       
          </View>
        {loadingMessage &&<Text style={[tw`text-white font-bold text-center  mx-15 `, {fontSize:16}]} >Status: {loadingMessage}</Text>}
        {estimatedDuration && <Text style={tw`text-white font-light text-center mx-15 mt-2 italic`} >Estimated time to complete: {estimatedDuration}</Text> }
        <Text style={tw`text-white font-light text-center mx-15 mt-2 italic`} >Please do not leave the app while this is running</Text> 
        
        {/*
        <TouchableOpacity onPress={()=> clearFile()} style={tw` justify-center items-center mt-5 border border-white px-10 rounded-2xl py-2`}>
          <Text style={tw`text-white text-lg`}>Cancel</Text>
        </TouchableOpacity>
        */}
        </View>
         
    
    
    }
    </>
    :
    <ScrollView scrollEnabled={doneReport} pagingEnabled showsVerticalScrollIndicator="false" style={tw``} contentContainerStyle={tw` pb-40`}>
      {prediction == "human" &&
        <View>
        
        <MotiView from={{translateY:1500}} animate={{translateY:0}} transition={{type:'timing', duration:500}}  style={[tw` bg-green-500  justify-center`,{width:width, height:height}]}>
        <TouchableOpacity onPress={()=> navigation.goBack()}>
              <Ionicons name="arrow-back-circle-outline" style={tw` mt-40 p-2 ml-3`} size={40} color="white" />
          </TouchableOpacity>
        <View style={tw`items-center`}>
        
        <View>
          <View style={tw`flex-3 justify-center items-center`}>
            <MotiText style={tw` text-white font-bold text-4xl`}>Overall Prediction:</MotiText>
            <MotiText style={tw`text-white font-bold text-3xl`}>Human</MotiText>
            
          </View>
          {!doneReport ?
          <View style={tw`flex-2.5 justify-center   items-center`}>
          <Text style={tw`text-white text-xl`}>Generating Forensic Report</Text>
          <Progress.Bar progress={progress} style={tw`mt-2 rounded-2xl`} width={260} color={"white"} height={20} />
          </View>
        :
        <MotiView style={tw`flex-2.5 justify-center   items-center`}>
            <MotiText style={tw` text-white font-bold text-xl mb-2`}>Swipe Up To See Forensic Analysis</MotiText>
            <MotiView>
        
        <FontAwesome name="arrow-up" size={40} color="white" />
        </MotiView>
          </MotiView>
          }
          
          
          </View>
          </View>
          </MotiView>
        </View>
      }

    {prediction == "contains some ai" &&
      <View>
        
      <MotiView from={{translateY:1500}} animate={{translateY:0}} transition={{type:'timing', duration:500}}  style={[tw` bg-yellow-600  justify-center`,{width:width, height:height}]}>
      <TouchableOpacity onPress={()=> navigation.goBack()}>
            <Ionicons name="arrow-back-circle-outline" style={tw` mt-40 p-2 ml-3`} size={40} color="white" />
        </TouchableOpacity>
      <View style={tw`items-center`}>
      
      <View>
        <View style={tw`flex-3 justify-center items-center`}>
          <MotiText style={tw` text-white font-bold text-4xl`}>Overall Prediction:</MotiText>
          <MotiText style={tw`text-white font-bold text-3xl`}>Likely Contains Some AI</MotiText>
        </View>
        {!doneReport ?
          <View style={tw`flex-2.5 justify-center   items-center`}>
          <Text style={tw`text-white text-xl`}>Generating Forensic Report</Text>
          <Progress.Bar progress={progress} style={tw`mt-2 rounded-2xl`} width={260} color={"white"} height={20} />
          </View>
        :
        <MotiView style={tw`flex-2.5 justify-center   items-center`}>
            <MotiText style={tw` text-white font-bold text-xl mb-2`}>Swipe Up To See Forensic Analysis</MotiText>
            <MotiView>
        
        <FontAwesome name="arrow-up" size={40} color="white" />
        </MotiView>
          </MotiView>
          }
          
        
        </View>
        </View>
        </MotiView>
      </View>
      }


      {prediction == "ai" &&
      <View>
        
      <MotiView from={{translateY:1500}} animate={{translateY:0}} transition={{type:'timing', duration:500}}  style={[tw` bg-red-700  justify-center`,{width:width, height:height}]}>
      <TouchableOpacity onPress={()=> navigation.goBack()}>
            <Ionicons name="arrow-back-circle-outline" style={tw` mt-40 p-2 ml-3`} size={40} color="white" />
        </TouchableOpacity>
      <View style={tw`items-center`}>
      
      <View>
        <View style={tw`flex-3 justify-center items-center`}>
          <MotiText style={tw` text-white font-bold text-4xl`}>Overall Prediction:</MotiText>
          <MotiText style={tw`text-white font-bold text-3xl`}>AI</MotiText>
        </View>
        {!doneReport ?
          <View style={tw`flex-2 justify-center   items-center`}>
          <Text style={tw`text-white text-xl`}>Generating Forensic Report</Text>
          <Progress.Bar progress={progress} style={tw`mt-2 rounded-2xl`} width={260} color={"white"} height={20} />
          </View>
        :
        <MotiView style={tw`flex-2 justify-center   items-center`}>
            <MotiText style={tw` text-white font-bold text-xl mb-2`}>Swipe Up To See Forensic Analysis</MotiText>
            <MotiView>
        
        <FontAwesome name="arrow-up" size={40} color="white" />
        </MotiView>
          </MotiView>
          }
          
        
        </View>
        </View>
        </MotiView>
      </View>
      }



        
    <View style={tw`mt-15 ${!aiReport && "mb-80"}`}>
      
      <Text style={tw`text-white text-center text-3xl ${prediction == 'human' && `text-green-500`} ${prediction == "ai" && `text-red-500`} ${prediction == "contains some ai" && 'text-yellow-600'}`}>Overall Prediction: {prediction != "contains some ai" ? prediction.toUpperCase() : "May Contain Some AI"}</Text>
      {prediction != "contains some ai" &&
      <Text style={[tw`text-white italic mx-5 mb-5`, {fontSize:12}]}>This means thats the average AI prediction probability is {prediction =="ai" ? "over" : "under"} 50% in this clip. There may still be some non-{prediction} content in this audio.</Text>
      }


  
    {/*Gifted Charts */}
    {selectedData == null ? 
    <LineChart
    lineGradient
    startFillColor1={'red'}
    startFillColor2='orange'
    
    

    endFillColor1={'green'}
    overflowTop={5}
    startOpacity1={0.5}
    endOpacity1={0.7}
    lineGradientStartColor='gray'
    lineGradientEndColor='gray'
    initialSpacing={20}
    endSpacing={60}
    data={data}
  
    width={width}
    areaChart
    yAxisLabelSuffix={"%"}
    textColor1='white'
    hideRules
    rotateLabel
    xAxisColor={"gray"}
    yAxisColor={"gray"}
    xAxisLabelTextStyle={tw`text-white`}
    dataPointsColor1='white'
    height={350}
    thickness1={2}
    color1='#5D1FE1'
    dotColor="white"
    dataPointsRadius1={6}
    spacing={30}
    stripHeight={15}
    stripWidth={15}
    start
    scrollAnimation
    scrollEnabled
    stripOpacity={100}
    curved
    curveType={CurveType.QUADRATIC}
    textShiftX={-10}
    textShiftY={-10}
    yAxisTextStyle={{ color: '#FFFFFF' }} 
    pointerConfig={{
      pointerStripHeight: 270,
      pointerStripColor: 'lightgray',
      pointerStripWidth: 4,
      pointerColor: 'lightgray',
      radius: 6,
      hidePointer1:true,
      pointerLabelWidth: 100,
      pointerLabelHeight: 90,
      activatePointersOnLongPress: true,
      autoAdjustPointerLabelPosition: false,
      activatePointersDelay:100,
      pointerLabelComponent: items => {
        return (
          <View
            style={{
              height: 90,
              width: 125,
              justifyContent: 'center',
              marginTop: -30,
              marginLeft: -40,
            }}>
            <Text style={{color: 'white', fontSize: 14, marginBottom:6,textAlign:'center'}}>
              {items[0].date}
            </Text>

            <View style={[tw`bg-slate-900 border border-slate-400`,{paddingHorizontal:10,paddingVertical:6, borderRadius:20}]}>
              <Text style={tw`text-white  text-center font-bold`}>Prediction</Text>
              <Text style={[tw`text-white`,{fontWeight: 'bold',textAlign:'center'}]}>
                {(items[0].meta.prediction).toUpperCase()}
              </Text>
              <Text style={tw`text-white text-center font-bold mt-2`}>Confidence</Text>
              <Text style={[tw`text-white`,{fontWeight: 'bold',textAlign:'center'}]}>
                {(items[0].meta.confidence)}
              </Text>

              <Text style={tw`text-white font-bold mt-2 text-center`}>Second</Text>
              <Text style={[tw`text-white`,{fontWeight: 'bold',textAlign:'center'}]}>
                {(items[0].label)}
              </Text>
            </View>
          </View>
        );
      },
    }}
    />
    :
    <LineChart
    lineGradient
    overflowTop={5}
    lineGradientStartColor='red'
    lineGradientEndColor='green'
    initialSpacing={20}
    endSpacing={60}
    data={smoothData}
    width={width}
    yAxisLabelSuffix={"%"}
    textColor1='white'
    hideRules
    rotateLabel
    xAxisColor={"white"}
    yAxisColor={"white"}
    xAxisLabelTextStyle={tw`text-white`}
    dataPointsColor1='white'
    height={350}
    thickness1={3}
    color1='#5D1FE1'
    dotColor="white"
    dataPointsRadius1={6}
    spacing={30}
    stripHeight={15}
    stripWidth={15}
    stripOpacity={100}
    curved
    curveType={CurveType.QUADRATIC}
    textShiftX={-10}
    textShiftY={-10}
    yAxisTextStyle={{ color: '#FFFFFF' }} 
    pointerConfig={{
      pointerStripHeight: 270,
      pointerStripColor: 'lightgray',
      pointerStripWidth: 2,
      hidePointer1:true,
      pointer1Color:"black",
      dotColor:"black",
      radius: 6,
      pointerLabelWidth: 100,
      pointerLabelHeight: 90,
      activatePointersOnLongPress: true,
      autoAdjustPointerLabelPosition: false,
      activatePointersDelay:100,
      pointerLabelComponent: items => {
        return (
          <View
            style={{
              height: 90,
              width: 120,
              justifyContent: 'center',
              marginTop: -30,
              marginLeft: -40,
            }}>
            <Text style={{color: 'white', fontSize: 14, marginBottom:6,textAlign:'center'}}>
              {items[0].date}
            </Text>

            <View style={[tw`bg-slate-900 border border-slate-500`,{paddingHorizontal:10,paddingVertical:6, borderRadius:20}]}>
              <Text style={tw`text-white text-center font-bold`}>Prediction</Text>
              <Text style={[tw`text-white`,{fontWeight: 'bold',textAlign:'center'}]}>
                {(items[0].meta.prediction).toUpperCase()}
              </Text>
              <Text style={tw`text-white text-center font-bold mt-2`}>Confidence</Text>
              <Text style={[tw`text-white`,{fontWeight: 'bold',textAlign:'center'}]}>
                {(items[0].meta.confidence)}
              </Text>
              <Text style={tw`text-white font-bold mt-2 text-center`}>Second</Text>
              <Text style={[tw`text-white`,{fontWeight: 'bold',textAlign:'center'}]}>
                {(items[0].label)}
              </Text>
            </View>
          </View>
        );
      },
    }}
    />
    }
    
      {/* Chart kit
     <LineChart
     style={tw`ml--2`}
      data={data}
      bezier
      yAxisInterval={50}
      withHorizontalLines={false}
      withVerticalLabels={false}
      withVerticalLines={false}
      onDataPointClick={({index, value, dataset, x, y}) => {
        setActiveDotIndex(index);
        setAnimateState(true)
        setViewDataPoint({
          timestamp:index,
          value: value, 
          data: value,
          confidence: dataset.confidence[index],
          prediction: dataset.prediction[index],
        })
        

        
    }}
    width={width}
      height={400}
      yAxisSuffix="%"
      chartConfig={chartConfig}
      segments={10} // This will give you the dotted lines, adjust as needed
      
    />
  
      */}
   
    
    
    
     <Text style={tw`text-slate-300 text-center  italic mb-2 mt-5`}>Seconds</Text>
     <Text style={[tw`text-slate-300 text-center  italic font-bold mb-5`, {fontSize:16}]}>Hold Your Figure Over The Chart To See More Data</Text>
    <View style={tw`justify-center flex-row`}>
      <TouchableOpacity onPress={()=> rawData()} style={tw`border border-white rounded-2xl mr-5 px-10 py-5 ${selectedData == null && `bg-blue-900`}`}>
      <Text style={tw`text-white`}>Raw Data</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={()=> viewSmoothData()} style={tw`border border-white ml-5 rounded-2xl px-10 py-5 ${selectedData && `bg-blue-900`}`}>
      <Text style={tw`text-white`}>Overall Trend</Text>
      </TouchableOpacity>
    </View>
   
    {!aiReport && <Text style={tw`text-slate-300 text-center mt-5 italic mb-5`}>Note: There is no AI-Generated Report as there was an technical issue.</Text>}
    </View>
    {viewDataPoint &&
    <>
    <View style={tw`border border-slate-600  w-full mb-3`}></View>
    <View style={tw`  mb-5  justify-between mx-5 flex-row mt-5`}>
      
      <MotiView 
       from={{opacity:0, scale:0.5}}
       animate={{opacity:1, scale:1}}
       transition={{type:'timing', duration:300}}
       state={animateState}
       key={animateState}
       
      style={tw`flex-col items-center justify-center`}>
      <Ionicons name="time" size={24} color="orange" />
      <Text style={tw` text-slate-300 text-sm text-left `}>Second:</Text>
      <Text style={tw` text-slate-300 text-sm text-left `}>{viewDataPoint.timestamp}</Text>
      </MotiView>

      <MotiView 
       from={{opacity:0, scale:0.5}}
       animate={{opacity:1, scale:1}}
       transition={{type:'timing', duration:300, delay:100}}
       state={animateState}
       key={animateState+1} style={tw`flex-col items-center justify-center`}>
      <MaterialIcons name="batch-prediction" size={24} color="orange" />
      <Text style={tw`text-slate-300 text-sm`}>Prediction: </Text>
      <Text style={tw`text-slate-300 text-sm ${viewDataPoint.prediction == 'human' ? `text-green-500` : `text-red-500`}`}>{viewDataPoint.prediction}</Text>
      </MotiView>

      <MotiView 
       from={{opacity:0, scale:0.5}}
       animate={{opacity:1, scale:1}}
       transition={{type:'timing', duration:300, delay:200}}
       state={animateState}
       key={animateState+5} style={tw`flex-col items-center justify-center`}>
      <MaterialIcons name="priority-high" size={24} color="orange" />
      <Text style={tw`text-slate-300 text-sm`}>Confidence: </Text>
      <Text style={tw`text-slate-300 text-sm`}>{viewDataPoint.confidence}</Text>
      </MotiView>

      <MotiView 
       from={{opacity:0, scale:0.5}}
       animate={{opacity:1, scale:1}}
       transition={{type:'timing', duration:300, delay:300}}
       state={animateState}
       key={animateState+3} style={tw`flex-col items-center justify-center`}>
      <FontAwesome5 name="robot" size={24} color="orange" />
      <Text style={tw`text-slate-300 text-sm`}>Probability Ai:</Text>
       <Text style={tw`text-slate-300 text-sm`}>{viewDataPoint.data}%</Text> 
      </MotiView>
      

    </View>
    <View style={tw`border border-slate-600 mb-3 w-full `}></View>
    </>
    }

    {aiReport &&
    <View>
      <Text style={tw`text-center text-white text-2xl mb-2 mt-5`}>AI-Generated Report</Text>
      <Text style={tw`text-white text-lg mx-3`}>
        {aiReport}
      </Text>

    </View>
    
    
    
    }


    

    </ScrollView>
    }
    </View>
  )
}


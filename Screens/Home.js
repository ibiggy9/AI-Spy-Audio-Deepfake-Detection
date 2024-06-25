import React from 'react'
import { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, AppState, Text, TouchableOpacity, View, useWindowDimensions, Image, Linking, ActivityIndicator, ScrollView, Alert } from 'react-native';
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
import { LineChart } from 'react-native-chart-kit';
import { MotiView, MotiText } from 'moti';
import { Easing } from 'react-native-reanimated';
import { Entypo } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { FontAwesome } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import Config from 'react-native-config'
/*
Need to do:
1) Add a abort thing for the api call if the user leaves that app and an error message needs to pop up
*/
const _size  = 300
const _color = '#5C7693'

export default function Home({navigation}) {
    const apiKey = Config.API_KEY
    const {width, height} = useWindowDimensions()
    const [file, setFile] = useState()
    const [uploadError, setUploadError] = useState()
    const [displayError, setDisplayError] = useState()
    const [spinner, setSpinner] = useState(false)
    const [loadingTouch, setLoadingTouch] = useState()
    const screenWidth = Dimensions.get('window').width;
    const [fileName, setFileName] = useState()
    const [fileSize, setFileSize] = useState()
    const appState = useRef(AppState.currentState)
    const [appStateVisible, setAppStateVisible] = useState(appState.current)
    const [submitted, setSubmitted] = useState(false)
    const [prediction, setPrediction] = useState()
    const [loading, setloading] = useState(false)
    const [usageCount, setUsageCount] = useState()
    const abortControllerRef = useRef(null)
    const [recording, setRecording] = React.useState();
    const [mp3Recording, setMp3Recording] = useState()
    const pendulumEasing = Easing.bezier(0.36, 0, 0.2, 1);
    const {isProMember, currentOffering} = useRevHook()
    const [isRecording, setIsRecording] = useState(false)
    const [viewDataPoint, setViewDataPoint] = useState(false)
    const [data, setData]= useState()
    const aiReportRef = useRef('');
    const [aiReport, setAiReport] = useState('');
    const [animateState, setAnimateState] = useState(false)
    const [activeDotIndex, setActiveDotIndex] = useState()
    const [doneReport, setDoneReport] = useState(false)
    const [progress, setProgress] = useState(0);
    const [intervalId, setIntervalId] = useState(null);

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

    

    useKeepAwake()
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
      
  }, [])
    

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
      barPercentage: 0.5,
      useShadowColorFromDataset: false,
      
    };


    Audio.RecordingOptionsPresets.HIGH_QUALITY = {
      isMeteringEnabled: true,
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.MAX,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false
      }
    }

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


    async function written(predictionChunks) {
      setDoneReport(false)
      const url = 'api-url'; // Replace with your API's URL
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


  
   
  
        async function clearFile(){
          setViewDataPoint()
          setFile()
          setFileName()
          setloading(false)
          setFileSize()
          setPrediction()
          setData()
          
          setDisplayError()
          setSubmitted(false)
        }

        async function startRecording() {
          setIsRecording(true)
          setSubmitted(true)
          clearFile()
          if(usageCount > 0 || isProMember){
            
            try {
              
              
              setDisplayError()
              setPrediction(false)
              console.log('Requesting permissions..');
              await Audio.requestPermissionsAsync();
              await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
              });
              
           
              console.log('Starting recording..');
              
              const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY
              )
              
              setRecording(recording);
              console.log('Recording started');

              setTimeout(async () => {
            
                console.log('Stopping recording after 60 seconds'); 
                    
                    await stopRecording(recording)
                    
                    
              }, 60000);  // 60 seconds = 60000 milliseconds

            } catch (err) {
              console.error('Failed to start recording', err);
            }
            } else {
              navigation.navigate("Paywall")
            }
            
        
        }

    async function stopRecording(recordingObj) {
          setSubmitted(true)
          setIsRecording(false)
          
          
          console.log('Stopping recording..');
          

         
    
          const status = await recording.getStatusAsync()
          await recordingObj.stopAndUnloadAsync();
          await Audio.setAudioModeAsync(
            {
              allowsRecordingIOS: false,
            }
          );
          const clipDuration = status.durationMillis
          /*
          if(clipDuration < 5000){
            console.log("Short Clip length")
            setDisplayError("The clip wasn't long enough please record at least 5 seconds.")
            setRecording()
            
          } else {
  
          
          }
          */
          const uri = recordingObj.getURI();
          setRecording()
          sendRecordingForPrediction(uri);
          
        }

            

        async function sendRecordingForPrediction(uri) {
          
          abortControllerRef.current = new AbortController();
          setloading(true);
      
          try {
              const formData = new FormData();
              formData.append('file', {
                  uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
                  type: 'audio/m4a',
                  name: 'uploaded_audio.m4a'
              });
      
              const response = await fetch('api-link', {
                  method: 'POST',
                  body: formData,
                  signal: abortControllerRef.current.signal,
                  headers: {
                      "Content-Type": "multipart/form-data" 
                  }
              });
      
              if (!response.ok) {
                  throw new Error('Error while sending recording for prediction');
              }
      
              // Parse the response
              const result = await response.json();
              if(!isProMember){
              saveUsageData(usageCount-1)
               }
         
      
              // If the prediction is present in the result, handle it
              if (result && result.prediction) {
                  written(result)
                  
                  setPrediction(result.prediction)
                  const chunks = result.Results.chunk_results.map(result => result.chunk);
                  const probabilities = result.Results.chunk_results.map(result => parseFloat(result.Probability_ai.slice(0, -1)));
                  const confidence = result.Results.chunk_results.map(result => result.confidence)
                  const prediction = result.Results.chunk_results.map(result => result.prediction)
                  const chartWidth = chunks.length * 60;

                  setData({
                    labels: chunks,
                    chartWidth: chartWidth,
                    datasets: [
                       {
                          confidence: confidence,
                          prediction: prediction,
                          data: probabilities,
                          color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                          strokeWidth: 2,
                          
                       }
                    ]
                 });
                 
 
              } else {
                  console.error("Failed to retrieve prediction from the server.");
              }
      
              setloading(false);
      
          } catch (error) {
              console.error("There was an error sending the recording for prediction", error);
          }
      }
      
    return (
      <View style={[tw`bg-black`, {width:width, height:height}]}>
        {!recording && !prediction &&
        <TouchableOpacity onPress={()=> navigation.navigate("TestHome")}>
        <Ionicons name="arrow-back-circle-outline" style={tw`mt-15 ml-3`} size={40} color="white" />
        </TouchableOpacity>
        }
      <View style={tw`flex-1 items-center justify-start`}>
        {!data ? 
        <>
        <Spinner
      visible={spinner}
      
      textStyle={{color:'white'}}
      />
        
      {!loading &&
       <View style={tw`mt-15`}>
        {!recording ?
        <>
        <TouchableOpacity  onPress={()=> !displayError ? startRecording() : clearFile()}>
          <Image style={[tw``,{height:300, width:350}]} source={require('../assets/image0.png')} />
          <Text style={tw`text-white text-xl text-center  font-bold`}>Tap Logo To Record Sound</Text>
          </TouchableOpacity>
          </>
          :
          <TouchableOpacity style={tw`mt-50`} onPress={()=> stopRecording(recording)}>
            <View style={[styles.dot, tw`justify-center items-center`]}>
            
              {[...Array(5).keys()].map(index => {
                  return ( 
                  <MotiView
                    from={{opacity:1, scale:1}}
                    animate={ {opacity:0, scale:4}}
                    transition={{
                      type:'timing',
                      duration:2000,
                      easing: Easing.out(Easing.ease), 
                      delay: index * 400,
                      loop: true,

                    }}
                    key={index}
                    style={[StyleSheet.absoluteFillObject, styles.dot, tw`justify-center items-center`]}
                    
                    />   
                  )
                    
              })}
              <MotiView 
                from={{scale:1}}
                animate={{
                  scale: [
                      { value: 1.1, type: 'timing', duration: 400 },
                      { value: 1, type: 'timing', duration: 100 },
                      { value: 1.1, type: 'timing', duration: 400 },
                      { value: 1, type: 'timing', duration: 100 },
                      { value: 1, type: 'timing', duration: 500 },
                  ],
              }}
                transition={{
                  type:'timing',
                  duration:500,
                  loop:true,
                  
                }}
              
              >
              <Image style={[tw``,{height:300, width:350}]} source={require('../assets/image0.png')} />
              </MotiView>
             
            </View>

          <Text style={tw`text-red-500 text-2xl mt-40 text-center mb-2 font-bold`}>Recording...</Text>
          <Text style={tw`text-white text-center text-xl  font-bold`}>Tap logo to stop.</Text>

          </TouchableOpacity>
        }
        </View>
        }
          
        {uploadError && <Text style={tw`text-center text-lg text-red-500 italic mt-2 mx-5`}>{uploadError}</Text>}
     
        {loading && 
        <View style={tw`mt-5 justify-center items-center`}>
          <View style={tw`flex-col mb-3`}>
          <Text style={tw`text-white text-2xl font-bold mb-3`}>Loading...</Text>

          <ActivityIndicator  size="large" color="white" />
       
          </View>
        <Text style={tw`text-white font-light text-center mx-15 italic`} >This can take up to 30 seconds. Please don't leave the app while this is running.</Text>
        <TouchableOpacity onPress={()=> clearFile()} style={tw` justify-center items-center mt-5 border border-white px-10 rounded-2xl py-2`}>
          <Text style={tw`text-white text-lg`}>Cancel</Text>
        </TouchableOpacity>
        </View>
        }
        {displayError && 
        <View style={tw`mt-10 justify-center items-center`}>
        <Text style={tw`text-red-500 font-bold text-lg text-center mx-15 `} >{displayError}</Text>
        </View>

        }
        
        
        <StatusBar style="auto" />
        </>
        :
        <ScrollView scrollEnabled={doneReport} showsVerticalScrollIndicator="false" pagingEnabled style={tw``} contentContainerStyle={tw` pb-40`}>
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
        <View style={tw`mt-15`}>
          <Text style={tw`text-white text-center text-3xl ${prediction == 'human' ? `text-green-500`: 'text-red-500'}`}>Overall Prediction: {prediction.toUpperCase()}</Text>
          <Text style={[tw`text-white italic mx-5 mb-5`, {fontSize:12}]}>This means thats 50% or more of this clip was predicted to be {prediction}. There may still be some non-{prediction} content in this audio.</Text>

        <ScrollView pagingEnabled horizontal={true} showsHorizontalScrollIndicator={false}>
         <LineChart
          data={data}
          bezier
          yAxisInterval={25}
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
        width={data.chartWidth}
          height={400}
          yAxisSuffix="%"
          chartConfig={chartConfig}
          segments={10} // This will give you the dotted lines, adjust as needed
          
        />
        </ScrollView>
        <Text style={tw`text-slate-300 text-center mt--13 italic mb-5`}>Seconds</Text>
    <MotiText from={{scale:0}} animate={{scale:1}} style={tw`text-slate-300 text-center mt--3 italic mb-5`}>Tap the dots to see more data.</MotiText>
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
          <Text style={tw` text-slate-300 text-sm text-left `}>Timestamp:</Text>
          <Text style={tw` text-slate-300 text-sm text-left `}>{viewDataPoint.timestamp + 1}</Text>
          </MotiView>

          <MotiView 
           from={{opacity:0, scale:0.5}}
           animate={{opacity:1, scale:1}}
           transition={{type:'timing', duration:300, delay:100}}
           state={animateState}
           key={animateState+1} style={tw`flex-col items-center justify-center`}>
          <MaterialIcons name="batch-prediction" size={24} color="orange" />
          <Text style={tw`text-slate-300 text-sm`}>Prediction: </Text>
          <Text style={tw`text-slate-300 text-sm ${viewDataPoint.prediction == 'human' ? `text-green-500` : `text-red-500`}`}>{viewDataPoint.prediction.toUpperCase()}</Text>
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
          <Text style={tw`text-center text-white text-2xl mb-2`}>AI-Generated Report</Text>
          <Text style={tw`text-white text-lg mx-3`}>
            {aiReport}
          </Text>

        </View>   
        
        }

        </ScrollView>
      
        }
        </View>
      </View>
)}


const styles = StyleSheet.create({
  dot:{
    width: 175,
    height: 150,
    borderRadius: _size,
    backgroundColor: _color
  },
  

})
import { View, Text, useWindowDimensions, TouchableOpacity,Image, Animated, ActivityIndicator, ScrollView, Modal, Alert, Platform, Linking, AppState, SafeAreaView } from 'react-native'
import React, {useState, useEffect, useRef} from 'react'
import Spinner from 'react-native-loading-spinner-overlay'
import tw from 'twrnc'
import Purchases from 'react-native-purchases'
import useRevHook from '../Components/useRevHook'
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';


export default function Paywall({navigation}) {
  const [modalVisible, setModalVisible] = useState(false)
  const {height, width} = useWindowDimensions()
  const [spinner, setSpinner] = useState(false) 
  const {currentOffering, isProMember, customerInfo} = useRevHook()
  const appState = useRef(AppState.currentState)
  const [offerCodeClicked ,setOfferCodeClicked] = useState()

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
  

  async function handleMonthlyPurchase(){
    setSpinner(true)
    if(!currentOffering?.monthly) return
    console.log(currentOffering.monthly)    
    const purchaserInfo = await Purchases.purchasePackage(currentOffering.monthly).catch((error)=> {
      console.log(error)
      setSpinner(false)
    })

    console.log("Monthly sub purchased", purchaserInfo.customerInfo.entitlements.active)
    if(purchaserInfo.customerInfo.entitlements.active){
      setSpinner(false)
      navigation.navigate("TestHome")
    }
    /*
    const purchaserInfo = await Purchases.purchasePackage(currentOffering.monthly).catch((error)=> {
      console.log(error)
      setSpinner(false)
    })
    console.log(purchaserInfo)
    
    if(purchaserInfo.entitlements.active.pro){
      setSpinner(false)
      
    } else {
      setSpinner(false)
    }
    */
  }



  return (
    <ScrollView contentContainerStyle={tw`pb-10`} style={[{width:width, height:height+20,}, tw`bg-black ${Platform.OS == "android" && `mt-10` }`]}>
    <SafeAreaView style={[tw`flex-1 bg-black` , {width:width, height:height}]}>

    <Spinner
      visible={spinner}
      
      textStyle={{color:'white'}}
      />
    <View style={[tw`flex-1 justify-start mt-12`,{height:height, width:width, opacity:1, position:'absolute'}]}>
    <TouchableOpacity onPress={()=> navigation.goBack()}>
    <Ionicons style={tw`ml-3`} name="arrow-back-circle" size={34} color="white" />
    </TouchableOpacity>
    <View style={tw`mb-5 `}>
    <Text style={tw`text-white text-2xl text-center font-bold`}>Welcome Ai-SPY Premium</Text>
    <Text style={tw`text-slate-200 text-center font-light`}>Get unlimited access to all features</Text>
    <View style={tw`items-center`}>
    
    <Image style={[tw``,{height:300, width:350}]} source={require('../assets/image0.png')} />
    </View>
    </View>

    {/*Content Block */}
    <View style={tw` px-5`}>
    <View from={{translateY:700}} animate={{translateY:0}} transition={{type:'timing', duration:1000, }} style={tw`flex-row items-center`}>
      <Ionicons style={tw`mr-5`} name="key" size={32} color="#fdc689" />
      <View style={tw`flex-1`}>
      <Text style={tw`text-white font-bold`}>Get Unlimited Access to All Features</Text>
      <Text style={tw`text-slate-300 font-light`}>This includes unlimited uses.</Text>
      </View>
      
    </View>


    <View from={{translateY:700}} animate={{translateY:0}} transition={{type:'timing', duration:1600}} style={tw`flex-row items-center pt-5`}>
      
      <Ionicons style={tw`mr-5`} name="md-star" size={32} color="#fdc689" />
      <View style={tw`flex-1`}>
      <Text style={tw`text-white font-bold`}>Early access to new tools.</Text>
      <Text style={tw`text-slate-300 font-light`}>This is just the beginning. We will be rolling out new features on an ongoing basis and premium members will get early access!</Text>
      </View>

    </View>
    </View>
    {currentOffering ? 
    <View style={tw` items-center`}>
   
              
   
              <View style={tw`items-center flex-row mt-5`} from={{scale:0.0}} animate={{scale:1}} transition={{type:'spring', stiffness:250, delay:1000}}>
              {currentOffering && currentOffering.monthly &&
                <View style={tw`flex-col`}>
                
                <TouchableOpacity onPress={() => handleMonthlyPurchase()} style={[tw`flex-col px-13 py-3 mb-2 border-2 border-black bg-blue-900  rounded-3xl justify-center `, { backgroundColor:'#fdc689'}]}>
                  <View style={tw``}>
                <Text style={tw`text-center text-black  font-bold`}>Subscibe for {currentOffering.monthly?.product.priceString}/Month</Text>
                <Text style={tw`text-center text-black  `}>Cancel Anytime.</Text>  
                </View>
                </TouchableOpacity>
                </View>
                }
           
              
           

              </View>

              <View style={tw`flex-col`} from={{scale:0.0}} animate={{scale:1}} transition={{type:'spring', stiffness:250, delay:1500}} >
              <TouchableOpacity onPress={() => restorePurchases()} style={tw`flex-col mb-5 mt-3  rounded-2xl  `}>
                <Text style={tw`ml-2 text-white font-light text-center`}>Restore Purchases</Text>
                
              </TouchableOpacity>
              {/*}
              {Platform.OS == "ios" &&
              <TouchableOpacity onPress={() => {
                  setOfferCodeClicked(true)
                  navigation.navigate('PromoCode') 
                }} style={[tw`flex-col mb-5  rounded-2xl  `]}>
                <Text style={tw`ml-2 text-white font-light text-center`}>Enter Offer Code</Text>
              </TouchableOpacity>
                
              */}
              
             
              <TouchableOpacity onPress={() => {
                  setOfferCodeClicked(true)
                  navigation.goBack()
                  
                }} style={[tw`flex-col mb-5  rounded-2xl  `]}>
                <Text style={tw`ml-2 text-white font-bold text-lg text-center`}>Return to Free Version</Text>
              </TouchableOpacity>
               

              {Platform.OS == 'android' &&
              <View>
              <TouchableOpacity onPress={() => {
                setOfferCodeClicked(true)
                navigation.navigate('HowToRedeem')
              }} style={[tw`flex-col mb-5  rounded-2xl  `]}>
              <Text style={tw`ml-2 text-white font-light text-center`}>How to Redeem an Offer Code</Text>
            </TouchableOpacity >
              
            <TouchableOpacity onPress={()=> navigation.navigate('PromoCode') } style={[tw`flex-col mb-5  rounded-2xl  `]}>
            <Text style={tw`ml-2 text-white font-light text-center`}>Enter Organization Code</Text>
            </TouchableOpacity>
            </View>
              
              
              }
              </View>
              </View>
              :
              <View>
                <ActivityIndicator size={'large'} />
              </View>

              }
      
      
      
    
      
              
  </View>
  </SafeAreaView>
  </ScrollView>
  
  
  )
}
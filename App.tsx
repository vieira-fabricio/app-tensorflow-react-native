import { StatusBar } from 'expo-status-bar';
import { Inter_400Regular, Inter_400Regular_Italic, useFonts } from '@expo-google-fonts/inter';
import { View, StatusBar as RNStatusBar, StyleSheet } from 'react-native';

import Home from "./src/screens/home";
import { Loading } from './src/components/loading';


export default function App() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_400Regular_Italic});

  if (!fontsLoaded) {
    return (
      <Loading />
    )
  }
  return (
    <>
      <View style={styles.statusBarBackground} />

      <StatusBar style="dark" translucent/>
      <Home />
    </>
  );
}

const styles = StyleSheet.create({
  statusBarBackground: {
    height: RNStatusBar.currentHeight, // cobre a área do status bar
    backgroundColor: '#2E9D4C', // cor desejada
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  }
});

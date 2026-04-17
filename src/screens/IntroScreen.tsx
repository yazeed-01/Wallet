import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
  Dimensions,
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { useSettingsStore } from '../store/settingsStore';

const { width, height } = Dimensions.get('window');

const IntroScreen: React.FC = () => {
  const videoRef = useRef<VideoRef>(null);
  const [ended, setEnded] = useState(false);
  const markIntroSeen = useSettingsStore((s) => s.markIntroSeen);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Video
        ref={videoRef}
        source={require('../assets/intro.mp4')}
        style={styles.video}
        resizeMode="cover"
        repeat={false}
        muted={false}
        onEnd={() => setEnded(true)}
        ignoreSilentSwitch="ignore"
        playInBackground={false}
      />

      {/* Skip button — always visible */}
      <TouchableOpacity style={styles.skipBtn} onPress={markIntroSeen} activeOpacity={0.8}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Get Started button — appears when video ends */}
      {ended && (
        <TouchableOpacity style={styles.startBtn} onPress={markIntroSeen} activeOpacity={0.85}>
          <Text style={styles.startText}>Get Started</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default IntroScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width,
    height,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  skipBtn: {
    position: 'absolute',
    top: 52,
    right: 24,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  skipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  startBtn: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: '#00BCD4',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  startText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

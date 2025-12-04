import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Path, G, Ellipse, Rect, Defs, ClipPath, Line } from 'react-native-svg';
import { useFonts } from 'expo-font';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';

const { width } = Dimensions.get('window');

// --- SPARK COMPONENT (Blue Burst) ---
const FireworksSparks = ({ color, scale = 1, rotate = 0 }) => {
  const Spark = ({ height, width, angle, distance, opacity = 1 }) => (
    <View style={{
        position: 'absolute',
        width: width,
        height: height,
        backgroundColor: color,
        opacity: opacity,
        borderRadius: width / 2,
        transform: [
            { rotate: `${angle}deg` },
            { translateY: -distance } // Radius
        ]
    }} />
  );

  const Dot = ({ size, angle, distance, opacity = 1 }) => (
    <View style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: opacity,
        transform: [
            { rotate: `${angle}deg` },
            { translateY: -distance }
        ]
    }} />
  );

  return (
    <View style={[styles.sparksWrapper, { transform: [{ scale }, { rotate: `${rotate}deg` }] }]}>
      {/* CORE BURST */}
      <Spark height={40} width={3} angle={0} distance={130} />
      <Spark height={35} width={2.5} angle={45} distance={120} />
      <Spark height={35} width={2.5} angle={-45} distance={120} />
      <Spark height={30} width={2} angle={90} distance={110} />
      <Spark height={30} width={2} angle={-90} distance={110} />
      
      {/* OUTER DEBRIS */}
      <Dot size={6} angle={20} distance={160} />
      <Dot size={6} angle={-20} distance={160} />
      <Dot size={5} angle={60} distance={150} opacity={0.8} />
      <Dot size={5} angle={-60} distance={150} opacity={0.8} />
      <Dot size={4} angle={120} distance={130} opacity={0.6} />
      <Dot size={4} angle={-120} distance={130} opacity={0.6} />
      
      {/* FILLERS */}
      <Spark height={15} width={2} angle={25} distance={100} opacity={0.7} />
      <Spark height={15} width={2} angle={-25} distance={100} opacity={0.7} />
      <Spark height={12} width={2} angle={135} distance={90} opacity={0.5} />
      <Spark height={12} width={2} angle={-135} distance={90} opacity={0.5} />
    </View>
  );
};

// --- PARABOLIC GLASS (Orange Glass & Liquid) ---
const ParabolicGlass = ({ glassColor, liquidColor }) => {
    const glassBowlPath = "M 25 30 C 25 65, 40 85, 50 85 C 60 85, 75 65, 75 30";

    return (
        <Svg height="120" width="100" viewBox="0 0 100 120">
            <Defs>
                <ClipPath id="bowlMask">
                    <Path d={glassBowlPath + " Z"} /> 
                </ClipPath>
            </Defs>

            <G rotation={0} origin="50, 50">
                
                {/* LIQUID LAYER */}
                <G clipPath="url(#bowlMask)">
                    <Rect 
                        x="-100" 
                        y="45" 
                        width="300" 
                        height="300" 
                        fill={liquidColor} 
                        fillOpacity="0.4" 
                    />
                    <Line 
                        x1="-50" y1="45" 
                        x2="150" y2="45" 
                        stroke={liquidColor} 
                        strokeWidth="1.5" 
                        strokeOpacity="0.8"
                    />
                </G>

                {/* GLASS OUTLINE */}
                <Ellipse cx="50" cy="30" rx="25" ry="5" fill="none" stroke={glassColor} strokeWidth="2.5" />
                <Path d={glassBowlPath} fill="none" stroke={glassColor} strokeWidth="2.5" strokeLinecap="round" />
                <Path d="M 50 85 L 50 105" fill="none" stroke={glassColor} strokeWidth="2.5" strokeLinecap="round" />
                <Path d="M 30 105 L 70 105" fill="none" stroke={glassColor} strokeWidth="2.5" strokeLinecap="round" />
            </G>
        </Svg>
    );
};

export default function AnimatedSplash({ onAnimationFinish }) {
  let [fontsLoaded] = useFonts({ BodoniModa_700Bold });

  const progress = useRef(new Animated.Value(0)).current; 
  const textOpacity = useRef(new Animated.Value(0)).current;

  // Three waves
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      
      // 1. CLINK
      Animated.timing(progress, {
        toValue: 1,
        duration: 900, 
        useNativeDriver: true,
        easing: Easing.out(Easing.poly(4)), 
      }),

      // 2. MULTI-WAVE BURST
      Animated.parallel([
        // Text Fade In
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        
        // Staggered Spark Waves
        Animated.stagger(150, [
            Animated.timing(wave1, {
                toValue: 1,
                duration: 2000, 
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            }),
            Animated.timing(wave2, {
                toValue: 1,
                duration: 2500, 
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            }),
            Animated.timing(wave3, {
                toValue: 1,
                duration: 2800, 
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            }),
        ]),
      ]),

      // 3. EXIT
      Animated.delay(800), 
    ]).start(() => {
        if (onAnimationFinish) onAnimationFinish();
    });
  }, []);

  // --- INTERPOLATIONS ---
  const glassMove = progress.interpolate({ inputRange: [0, 1], outputRange: [100, -16] });
  const rotateString = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '15deg'] });
  const rotateRightString = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-15deg'] });

  const getOpacity = (anim) => anim.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 0] });
  const getScale = (anim, maxScale) => anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, maxScale] });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      
      <View style={styles.centerStage}>
        
        {/* --- WAVE 1: Core Burst (BLUE) --- */}
        <Animated.View style={[styles.sparksContainer, { 
            opacity: getOpacity(wave1), 
            transform: [{ scale: getScale(wave1, 1.3) }] 
        }]}>
            <FireworksSparks color="#007A7A" />
        </Animated.View>

        {/* --- WAVE 2: Secondary (Rotated, BLUE) --- */}
        <Animated.View style={[styles.sparksContainer, { 
            opacity: getOpacity(wave2), 
            transform: [{ scale: getScale(wave2, 1.5) }] 
        }]}>
            <FireworksSparks color="#007A7A" rotate={25} scale={0.9} />
        </Animated.View>

        {/* --- WAVE 3: Grand Surround (BLUE) --- */}
        <Animated.View style={[styles.sparksContainer, { 
            opacity: getOpacity(wave3), 
            transform: [{ scale: getScale(wave3, 1.7) }] 
        }]}>
            <FireworksSparks color="#007A7A" rotate={-15} scale={1.1} />
        </Animated.View>

        {/* GLASSES (ORANGE) */}
        <View style={styles.glassesPair}>
            <Animated.View style={{ transform: [{ translateX: Animated.multiply(glassMove, -1) }, { rotate: rotateString }] }}>
                <ParabolicGlass glassColor="#F47121" liquidColor="#F47121" />
            </Animated.View>
            <Animated.View style={{ transform: [{ translateX: glassMove }, { rotate: rotateRightString }, { scaleX: -1 }] }}>
                <ParabolicGlass glassColor="#F47121" liquidColor="#F47121" />
            </Animated.View>
        </View>

      </View>

      {/* TITLE (ORANGE) */}
      <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
        apero
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF6F0', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerStage: {
      width: 200,
      height: 140, 
      alignItems: 'center',
      justifyContent: 'flex-end', 
      marginBottom: 10,
  },
  glassesPair: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      zIndex: 1, 
  },
  sparksContainer: {
      position: 'absolute',
      top: '50%', 
      left: 0,
      right: 0,
      zIndex: 10, 
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible' 
  },
  sparksWrapper: {
      width: 0, 
      height: 0,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible' 
  },
  title: {
    fontFamily: 'BodoniModa_700Bold',
    fontSize: 54, 
    color: '#F47121', 
    marginTop: 20,
    letterSpacing: -1.5,
  }
});
import { Image, StyleSheet, View } from 'react-native';

const corporateBg = require('@/assets/images/auth-bg.jpg');

export function LoginIllustration() {
  return (
    <View style={styles.container}>
      <Image source={corporateBg} style={styles.image} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 130,
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#c5d4ef',
    shadowColor: '#405189',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

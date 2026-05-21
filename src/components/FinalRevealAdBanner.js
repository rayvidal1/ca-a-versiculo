import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const IS_DEV = __DEV__;

const ADS_ENABLED =
  IS_DEV || process.env.EXPO_PUBLIC_BIBLU_ADS_ENABLED === 'true';

const AD_UNIT_ID = IS_DEV
  ? TestIds.BANNER
  : (process.env.EXPO_PUBLIC_BIBLU_BANNER_UNIT_ID ?? '');

export default function FinalRevealAdBanner() {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!ADS_ENABLED || !AD_UNIT_ID) return null;
  if (failed) return null;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Publicidade</Text>
      <View style={[styles.bannerContainer, !loaded && styles.bannerHidden]}>
        <BannerAd
          unitId={AD_UNIT_ID}
          size={BannerAdSize.BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdLoaded={() => setLoaded(true)}
          onAdFailedToLoad={() => setFailed(true)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: 'rgba(180,140,60,0.7)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontWeight: '500',
  },
  bannerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(212,160,10,0.4)',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.07)',
    padding: 4,
  },
  bannerHidden: {
    opacity: 0,
    height: 0,
    padding: 0,
    borderWidth: 0,
  },
});

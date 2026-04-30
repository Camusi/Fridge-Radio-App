import { StyleSheet, Platform } from 'react-native';

const isAndroid = Platform.OS === 'android';

export const index = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 110,
  },

  card: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 32,
    padding: 24,
    paddingBottom: 30,
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  logoImage: {
    width: '90%',
    height: 120,
    marginBottom: 24,
  },

  titleImage: {
    width: '75%',
    height: 90,
    marginBottom: 30,
  },

  buttonContainer: {
    width: '62%',
    minHeight: 74,
    borderRadius: 34,
    backgroundColor: '#06111f',
    borderWidth: 2,
    borderColor: '#7ef0ff',
    justifyContent: 'center',
    alignItems: 'center',
    // iOS cyan glow shadow
    shadowColor: '#39c7ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    // Android: elevation alone won't give cyan — use a wrapper View trick or accept grey shadow
    elevation: 7,
    marginBottom: 20,
    padding: 10,
  },

  button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0f2346',
    borderWidth: 1,
    borderColor: '#7df5ff',
  },

  buttonText: {
    fontSize: 40,
    color: 'white',
  },

  trackRow: {
    width: '88%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: 20,
  },

  trackInfoContainer: {
    flex: 1,
    paddingRight: 12,
  },

  trackLabel: {
    color: '#f7ffff',
    textTransform: 'uppercase',
    // Android renders letterSpacing differently — reduce slightly
    letterSpacing: isAndroid ? 1.2 : 1.6,
    fontSize: 10,
    marginBottom: 4,
  },

  trackTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
    // textShadow is iOS-only; on Android use nothing (or a subtle opacity trick)
    ...(isAndroid
      ? {}
      : {
          textShadowColor: 'rgba(0,0,0,0.25)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }),
  },

  trackArtist: {
    color: '#e8ffff',
    fontSize: 13,
    ...(isAndroid
      ? {}
      : {
          textShadowColor: 'rgba(0,0,0,0.18)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 1.5,
        }),
  },

  barContainer: {
    width: 52,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingLeft: 8,
    marginTop: 30,
  },

  bar: {
    width: 5,
    borderRadius: 4,
    backgroundColor: '#76f1ff',
    marginHorizontal: 1,
    height: 24,
  },

  fridgeImage: {
    width: '62%',
    aspectRatio: 1,
    height: undefined,
  },
});
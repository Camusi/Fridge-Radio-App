import { StyleSheet } from 'react-native';

export const index = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },

  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
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
    shadowColor: '#39c7ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
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
    letterSpacing: 1.6,
    fontSize: 10,
    marginBottom: 4,
  },

  trackTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  trackArtist: {
    color: '#e8ffff',
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1.5,
  },

  barContainer: {
    width: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingLeft: 8,
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
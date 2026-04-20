import { StyleSheet } from 'react-native';

export const bibleStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
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
    width: '88%',
    height: 120,
    marginBottom: 24,
  },

  titleImage: {
    width: '72%',
    height: 90,
    marginBottom: 30,
  },

  buttonContainer: {
    width: '70%',
    minHeight: 96,
    borderRadius: 30,
    backgroundColor: '#e06f0d',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#b25b03',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
    marginBottom: 32,
  },

  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  penguinImage: {
    width: '55%',
    aspectRatio: 1,
    height: undefined,
  },
});

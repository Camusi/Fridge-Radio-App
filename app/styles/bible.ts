import { StyleSheet } from 'react-native';

export const bibleStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
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
    width: '62%',
    minHeight: 74,
    borderRadius: 34,
    backgroundColor: '#06111f',
    borderWidth: 2,
    borderColor: '#ffda61',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff6139',
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
    backgroundColor: '#241f08',
    borderWidth: 1,
    borderColor: '#fdff7d',
  },

  barContainer: {
    width: '88%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 35,
    paddingHorizontal: 120,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: 20,
  },

  bar: {
    width: 5,
    borderRadius: 4,
    backgroundColor: '#ffffffbe',
    marginHorizontal: 1,
    height: 24,
  },

  penguinImage: {
    width: '55%',
    aspectRatio: 1,
    height: undefined,
  },
});

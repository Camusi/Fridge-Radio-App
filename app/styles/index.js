import { StyleSheet } from 'react-native';

export const index = StyleSheet.create({
  container: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingTop: '20%',
    },
    
    logoImage: {
      width: '100%',
      height: '14%',
      marginBottom: 20,
    },

    titleImage: {
      width: '70%',
      height: '22%',
    },
    
    buttonContainer: {
      width: '60%',
      height: 100,
      borderRadius: 20,
      backgroundColor: 'rgba(2, 131, 182, 0.33)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      marginTop: '10%',
      marginBottom: '10%',
      zIndex: 2
    },
    button: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    buttonText: {
      fontSize: 40,
      color: 'white',
    }
});
import { StyleSheet } from 'react-native';

export const global = StyleSheet.create({
  // Modal overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal containers
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    alignItems: 'center',
  },

  // Modal titles
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  // Button styles
  primaryButton: {
    backgroundColor: '#00a8f3',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  secondaryButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },

  // Text input
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    width: '100%',
  },

  // Widget card
  widgetCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Widget image
  widgetImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },

  // Widget text
  widgetText: {
    fontSize: 16,
  },
});

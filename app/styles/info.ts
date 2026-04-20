import { StyleSheet } from 'react-native';

export const info = StyleSheet.create({
  // Screen container
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Scrollview
  scrollView: {
    flex: 1,
    paddingTop: '25%',
    paddingHorizontal: 20,
  },

  // Title
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: 'black',
  },

  // Info text block
  infoText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },

  // Highlighted inline label text
  highlightText: {
    fontWeight: '600',
  },

  // Widget container
  widgetContainer: {
    marginBottom: 15,
  },

  // Widget controls (up/down/delete buttons)
  widgetControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 5,
  },

  // Arrow buttons group (up/down)
  arrowButtonsGroup: {
    flexDirection: 'row',
    gap: 8,
  },

  // Add widget button (dashed outline)
  addWidgetButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    borderRadius: 15,
    padding: 30,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Add widget icon
  addWidgetIcon: {
    color: '#999',
  },

  // Add widget text
  addWidgetText: {
    color: '#999',
    marginTop: 10,
    fontSize: 14,
  },

  // Bottom spacing
  bottomSpacing: {
    height: 80,
  },

  // Add Widget Modal content
  addWidgetModalContent: {
    width: '100%',
    marginBottom: 20,
  },

  // Widget type label
  widgetTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  // Text input for widget content
  widgetTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Button row (for side-by-side buttons)
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },

  // Button in row
  buttonRowItem: {
    flex: 1,
  },

  // First button in row
  buttonRowFirst: {
    marginRight: 10,
  },

  // Last button in row
  buttonRowLast: {
    marginLeft: 10,
  },

  // Admin button
  adminButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Admin button active
  adminButtonActive: {
    backgroundColor: '#00a8f3',
  },

  // Admin button inactive
  adminButtonInactive: {
    backgroundColor: '#ccc',
  },

  // Password input
  passwordInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    fontSize: 16,
  },
});

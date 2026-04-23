import { StyleSheet } from 'react-native';

export const info = StyleSheet.create({
  // Screen container
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },

  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 32,
    padding: 24,
    height: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },

  // Scrollview
  scrollView: {
    flex: 1,
    paddingTop: '25%',
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
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

  adminButton: {
    width: 50,
    height: 50,
    marginBottom: 20,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  adminButtonActive: {
    backgroundColor: '#a1e4ff2f',
  },

  adminButtonInactive: {
    backgroundColor: 'rgba(136, 136, 136, 0.1)',
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

  editButton: {
    width: 50,
    height: 50,
    marginBottom: 20,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  editButtonActive: {
    backgroundColor: '#a1e4ff2f',
  },

  editButtonInactive: {
    backgroundColor: 'rgba(136, 136, 136, 0.1)',
  },

  infoHeader: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    gap: 90
  }
});

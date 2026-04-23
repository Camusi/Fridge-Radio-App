import { StyleSheet } from 'react-native';

export const updates = StyleSheet.create({
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

  scrollView: {
    flex: 1,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },

  widgetContainer: {
    marginBottom: 10,
  },

  widgetCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  widgetText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1a1a1a',
  },

  widgetImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
  },

  widgetControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },

  arrowButtonsGroup: {
    flexDirection: 'row',
    gap: 6,
  },

  arrowButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(107, 107, 107, 0.3)',
  },

  arrowButtonDisabled: {
    opacity: 0.3,
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },

  iconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(107, 107, 107, 0.3)',
  },

  addWidgetButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(107, 107, 107, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  addWidgetIcon: {
    color: 'rgba(107, 107, 107, 0.7)',
  },

  addWidgetText: {
    color: 'rgba(107, 107, 107, 0.7)',
    marginTop: 6,
    fontSize: 12,
    fontWeight: '500',
  },

  saveButton: {
    marginVertical: 12,
    backgroundColor: '#61d2ff',
    borderWidth: 2,
    borderColor: '#61daff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },

  saveButtonText: {
    color: '#06111f',
    fontWeight: '700',
    fontSize: 14,
  },

  disabledButton: {
    opacity: 0.55,
  },

  errorContainer: {
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#c00',
  },

  errorText: {
    color: '#c00',
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '500',
    fontSize: 12,
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

  updatesHeader: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    gap: 70
  }
});

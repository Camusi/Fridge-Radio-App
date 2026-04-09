import { ScrollView, Text, View } from 'react-native';
import { info as infoStyles } from '../styles/info';

export default function InfoScreen() {
  return (
    <View style={infoStyles.container}>
      <ScrollView style={infoStyles.scrollView}>
        <Text style={infoStyles.title}>Information</Text>
        <View style={infoStyles.widgetContainer}>
          <Text style={{ fontSize: 16, lineHeight: 24, color: '#333' }}>
            Welcome to the Fridge app! This is your information hub.{'\n\n'}
            
            <Text style={{ fontWeight: '600' }}>Home Tab:</Text> Listen to your favorite stream{'\n\n'}
            
            <Text style={{ fontWeight: '600' }}>Updates Tab:</Text> Check out the latest news and updates{'\n\n'}
            
            For more information or support, please contact the team.
          </Text>
        </View>
        <View style={infoStyles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}
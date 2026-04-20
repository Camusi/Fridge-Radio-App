import { ScrollView, Text, View } from 'react-native';
import { info as infoStyles } from './styles/info';

export default function InfoScreen() {
  return (
    <View style={infoStyles.container}>
      <ScrollView style={infoStyles.scrollView}>
        <Text style={infoStyles.title}>Information</Text>
        <View style={infoStyles.widgetContainer}>
          <Text style={infoStyles.infoText}>
            Welcome to the Fridge app! This is your information hub.{'\n\n'}
            
            <Text style={infoStyles.highlightText}>Home Tab:</Text> Listen to your favorite stream{'\n\n'}
            
            <Text style={infoStyles.highlightText}>Updates Tab:</Text> Check out the latest news and updates{'\n\n'}
            
            For more information or support, please contact the team.
          </Text>
        </View>
        <View style={infoStyles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}
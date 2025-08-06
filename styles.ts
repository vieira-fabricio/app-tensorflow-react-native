import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 7,
    marginTop: 30
  },
  results:{
        flex: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
        justifyContent: "center",
  }
});